"""Causal cleaning: no future filling, learned thresholds or removal of extremes."""
import numpy as np
import pandas as pd
from ml.pipeline.era5 import VARIABLES


class DataCleaning:
    def clean(self, df):
        if not isinstance(df.index, pd.DatetimeIndex):
            raise ValueError('Expected an hourly DatetimeIndex')
        result = df.copy()
        result.index = pd.to_datetime(result.index, utc=True)
        result.index.name = 'time'
        if 'city' not in result:
            result['city'] = 'single_location'
        result = result.reset_index().drop_duplicates()
        if result.duplicated(['city', 'time']).any():
            raise ValueError('Conflicting observations for the same city and hour')
        required = [*VARIABLES, 'latitude', 'longitude']
        if set(required) - set(result):
            raise ValueError(f'Missing columns: {sorted(set(required) - set(result))}')
        for column in required:
            result[column] = pd.to_numeric(result[column], errors='coerce').replace([np.inf, -np.inf], np.nan)
        ranges = {'temperature_2m': (-90, 65), 'relative_humidity_2m': (0, 100),
                  'pressure_msl': (800, 1100), 'wind_speed_10m': (0, 400),
                  'cloud_cover': (0, 100), 'precipitation': (0, 500)}
        for column, (low, high) in ranges.items():
            result.loc[~result[column].between(low, high), column] = np.nan
        if not result['latitude'].between(-90, 90).all() or not result['longitude'].between(-180, 180).all():
            raise ValueError('Invalid location coordinates')
        return result.sort_values(['city', 'time']).set_index('time')

    def validate_data(self, df):
        return {column: bool(df[column].notna().all()) for column in df}
