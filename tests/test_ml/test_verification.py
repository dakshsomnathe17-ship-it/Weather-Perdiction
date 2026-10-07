import json

import httpx
import pandas as pd
import pytest

from ml.pipeline import era5
from ml.scripts.verify_run import inspect_dataset


def test_dataset_audit_rejects_tampered_raw_chunks_and_invalid_observations(tmp_path, monkeypatch):
    monkeypatch.setattr(era5.time, 'sleep', lambda _: None)
    times = pd.date_range('2020-01-01', periods=24, freq='h').strftime('%Y-%m-%dT%H:%M').tolist()
    values = [20., 50., 1000., 10., 30., 0.]
    response = {'latitude': 18.5, 'longitude': 73.75,
                'hourly_units': dict(zip(era5.VARIABLES, ['°C', '%', 'hPa', 'km/h', '%', 'mm'])),
                'hourly': {'time': times, **{v: [value] * 24 for v, value in zip(era5.VARIABLES, values)}}}
    with httpx.Client(transport=httpx.MockTransport(lambda request: httpx.Response(200, json=response))) as client:
        era5.download(tmp_path, ['Pune'], '2020-01-01', '2020-01-01', client=client)
    quality, raw = inspect_dataset(tmp_path, tmp_path)
    assert quality['rows'] == len(raw) == 24
    assert quality['original_chunks_reused_unchanged'] == 1
    chunk = next((tmp_path / 'raw').glob('*.json'))
    original = chunk.read_bytes()
    chunk.write_bytes(original + b' ')
    with pytest.raises(ValueError, match='Raw chunk checksum'):
        inspect_dataset(tmp_path)
    chunk.write_bytes(original)
    raw.loc[raw.index[0], 'relative_humidity_2m'] = 105
    csv = tmp_path / 'historical_weather.csv'
    raw.to_csv(csv)
    manifest_path = tmp_path / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest['dataset_sha256'] = era5.sha256(csv)
    manifest_path.write_text(json.dumps(manifest), encoding='utf-8')
    with pytest.raises(ValueError, match='physically invalid'):
        inspect_dataset(tmp_path)
