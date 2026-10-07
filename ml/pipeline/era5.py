"""Resumable ERA5 point-series acquisition through Open-Meteo, not direct CDS."""
import hashlib
import json
import logging
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

import httpx
import numpy as np
import pandas as pd

LOG = logging.getLogger(__name__)
VARIABLES = ['temperature_2m', 'relative_humidity_2m', 'pressure_msl',
             'wind_speed_10m', 'cloud_cover', 'precipitation']
LOCATIONS = {
    'Pune': (18.5204, 73.8567), 'Mumbai': (19.0760, 72.8777),
    'Delhi': (28.6139, 77.2090), 'Bengaluru': (12.9716, 77.5946),
    'Chennai': (13.0827, 80.2707), 'Kolkata': (22.5726, 88.3639),
    'Hyderabad': (17.3850, 78.4867), 'Ahmedabad': (23.0225, 72.5714),
    # Additional city centres verified through Open-Meteo Geocoding / GeoNames.
    'Jaipur': (26.91962, 75.78781), 'Lucknow': (26.83928, 80.92313),
    'Nagpur': (21.14631, 79.08491), 'Indore': (22.71792, 75.83330),
    'Patna': (25.59408, 85.13563), 'Bhubaneswar': (20.27241, 85.83385),
    'Kochi': (9.93988, 76.26022), 'Guwahati': (26.18440, 91.74580),
}
CITY_GROUPS = {
    'india8': ('Pune', 'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Ahmedabad'),
    'india16': tuple(LOCATIONS),
}
URL = 'https://archive-api.open-meteo.com/v1/archive'


def retry_delay(header, attempt):
    try:
        seconds = float(header)
    except (TypeError, ValueError):
        try:
            seconds = (parsedate_to_datetime(header) - datetime.now(timezone.utc)).total_seconds()
        except (TypeError, ValueError, OverflowError):
            seconds = 0
    return min(60, max(5 * 2 ** attempt, seconds))


def sha256(path):
    with Path(path).open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def request_params(lat, lon, start, end):
    return dict(latitude=lat, longitude=lon, start_date=start, end_date=end,
                hourly=','.join(VARIABLES), models='era5', timezone='UTC',
                elevation='nan', cell_selection='nearest',
                temperature_unit='celsius', wind_speed_unit='kmh', precipitation_unit='mm')


def validate_response(data, start, end):
    if data.get('error') or 'hourly' not in data:
        raise ValueError('No hourly ERA5 data in provider response')
    frame = pd.DataFrame(data['hourly'])
    frame['time'] = pd.to_datetime(frame['time'], utc=True)
    expected = pd.date_range(start, pd.Timestamp(end) + pd.Timedelta(hours=23), freq='h', tz='UTC')
    if not pd.DatetimeIndex(frame['time']).equals(expected):
        raise ValueError('Incomplete, duplicate or unordered hourly timeline')
    units = data.get('hourly_units', {})
    required_units = dict(zip(VARIABLES, ['°C', '%', 'hPa', 'km/h', '%', 'mm']))
    for name, unit in required_units.items():
        if name not in frame or units.get(name) != unit:
            raise ValueError(f'Missing variable or unexpected unit: {name}')
        if not np.isfinite(pd.to_numeric(frame[name], errors='coerce')).any():
            raise ValueError(f'Variable has no finite observations: {name}')
    return frame


def download(output, cities, start='2015-01-01', end='2025-12-31', client=None):
    output = Path(output)
    raw = output / 'raw'
    raw.mkdir(parents=True, exist_ok=True)
    first, last = pd.Timestamp(start), pd.Timestamp(end)
    if first > last or first < pd.Timestamp('1940-01-01'):
        raise ValueError('Invalid ERA5 date range')
    unknown = set(cities) - set(LOCATIONS)
    if not cities:
        raise ValueError('At least one city is required')
    if unknown:
        raise ValueError(f'Unknown cities: {sorted(unknown)}')
    manifest = {'source': 'ERA5 via Open-Meteo Historical Weather API', 'model': 'era5',
                'endpoint': URL, 'start': start, 'end': end, 'cities': cities,
                'variables': VARIABLES, 'timezone': 'UTC', 'downscaling': False,
                'attribution': 'Contains modified Copernicus Climate Change Service information; processed by Open-Meteo.',
                'sources': ['https://doi.org/10.24381/cds.adbb2d47',
                            'https://open-meteo.com/en/docs/historical-weather-api',
                            'https://open-meteo.com/en/terms'],
                'license': 'CC BY 4.0; API access terms also apply', 'chunks': []}
    frames = []
    owned = client is None
    client = client or httpx.Client(timeout=httpx.Timeout(120, connect=15), follow_redirects=True)
    try:
        for city in cities:
            lat, lon = LOCATIONS[city]
            for year in range(first.year, last.year + 1):
                a = max(first, pd.Timestamp(year, 1, 1)).date().isoformat()
                b = min(last, pd.Timestamp(year, 12, 31)).date().isoformat()
                params = request_params(lat, lon, a, b)
                path = raw / f'{city.lower()}_{a}_{b}.json'
                if path.exists():
                    envelope = json.loads(path.read_text(encoding='utf-8'))
                    if envelope['request'] != params:
                        raise ValueError(f'Cached request differs: {path}')
                else:
                    for attempt in range(5):
                        try:
                            response = client.get(URL, params=params)
                            if response.status_code in (429, 500, 502, 503, 504) and attempt < 4:
                                pause = retry_delay(response.headers.get('Retry-After'), attempt)
                                LOG.warning('Provider %s; retry in %s seconds', response.status_code, pause)
                                time.sleep(pause)
                                continue
                            response.raise_for_status()
                            envelope = {'request': params, 'retrieved_at': datetime.now(timezone.utc).isoformat(), 'response': response.json()}
                            validate_response(envelope['response'], a, b)
                            temporary = path.with_suffix('.part')
                            temporary.write_text(json.dumps(envelope, ensure_ascii=False), encoding='utf-8')
                            temporary.replace(path)
                            break
                        except httpx.TransportError:
                            if attempt == 4:
                                raise
                            time.sleep(min(30, 2 ** attempt))
                    time.sleep(2)
                data = envelope['response']
                frame = validate_response(data, a, b)
                frame['city'] = city
                frame['latitude'], frame['longitude'] = lat, lon
                frames.append(frame)
                manifest['chunks'].append({'path': str(path.relative_to(output)), 'sha256': sha256(path),
                    'rows': len(frame), 'request': params, 'retrieved_at': envelope['retrieved_at'],
                    'grid_latitude': data['latitude'], 'grid_longitude': data['longitude'],
                    'elevation': data.get('elevation'), 'units': data['hourly_units'],
                    'missing': {v: int(frame[v].isna().sum()) for v in VARIABLES}})
                LOG.info('%s %s: %s hourly rows', city, year, len(frame))
    finally:
        if owned:
            client.close()
    result = pd.concat(frames).sort_values(['time', 'city'])
    if result.duplicated(['time', 'city']).any():
        raise ValueError('Duplicate city/time observations')
    target = output / 'historical_weather.csv'
    result.to_csv(target, index=False)
    manifest.update(rows=len(result), dataset_sha256=sha256(target), dataset_file=target.name)
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    return manifest
