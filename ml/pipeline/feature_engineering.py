import numpy as np
import pandas as pd
from ml.pipeline.era5 import VARIABLES


class FeatureEngineering:
    """Features at issue hour t use observations no later than t, within one city."""
    def __init__(self, horizon_hours=24):
        self.horizon_hours = horizon_hours
        self.engineered_features = []

    def engineer_features(self, df):
        frames = []
        for city, group in df.groupby('city', sort=True):
            for coordinate in ('latitude', 'longitude'):
                if group[coordinate].nunique() != 1:
                    raise ValueError(f'Coordinates changed within {city}')
            # Reindex before shifting so a missing hour cannot masquerade as a one-hour lag.
            g = group.sort_index().asfreq('h').copy()
            g['city'] = city
            for coordinate in ('latitude', 'longitude'):
                g[coordinate] = group[coordinate].iloc[0]
            valid_time = g.index + pd.Timedelta(hours=self.horizon_hours)
            for name, values, period in [('hour', valid_time.hour, 24), ('season', valid_time.dayofyear, 365.25)]:
                g[f'{name}_sin'] = np.sin(2 * np.pi * values / period)
                g[f'{name}_cos'] = np.cos(2 * np.pi * values / period)
            for variable in VARIABLES:
                for lag in (1, 6, 24):
                    g[f'{variable}_lag_{lag}h'] = g[variable].shift(lag)
                for window in (6, 24):
                    g[f'{variable}_mean_{window}h'] = g[variable].rolling(window, min_periods=window).mean()
            g['precipitation_past_24h'] = g['precipitation'].rolling(24, min_periods=24).sum()
            frames.append(g)
        result = pd.concat(frames)
        self.engineered_features = [c for c in result if c != 'city']
        return result

    def get_feature_names(self):
        return self.engineered_features
