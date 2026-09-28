import numpy as np
import pandas as pd
from ml.pipeline.data_cleaning import DataCleaning
from ml.pipeline.feature_engineering import FeatureEngineering

TARGETS = {'temperature_2m': 'temperature', 'relative_humidity_2m': 'humidity',
           'pressure_msl': 'pressure', 'wind_speed_10m': 'wind_speed', 'cloud_cover': 'cloud_cover'}
UNITS = {'temperature': '°C', 'humidity': '%', 'pressure': 'hPa', 'wind_speed': 'km/h',
         'cloud_cover': '%', 'precipitation_24h': 'mm over next 24 hours'}


def build_supervised(raw, horizon_hours=24):
    if horizon_hours != 24:
        raise ValueError('This experiment supports a 24-hour horizon only')
    clean = DataCleaning().clean(raw)
    engineered = FeatureEngineering(horizon_hours).engineer_features(clean)
    features, targets, persistence = [], [], []
    for city, group in engineered.groupby('city'):
        g = group.sort_index()
        y = g[list(TARGETS)].shift(-horizon_hours).rename(columns=TARGETS)
        y['precipitation_24h'] = g['precipitation_past_24h'].shift(-horizon_hours)
        baseline = g[list(TARGETS)].rename(columns=TARGETS).copy()
        baseline['precipitation_24h'] = g['precipitation_past_24h']
        X = g.drop(columns=['city'])
        valid = np.isfinite(X).all(axis=1) & np.isfinite(y).all(axis=1)
        index = pd.MultiIndex.from_arrays([g.index[valid], [city] * int(valid.sum())], names=['time', 'city'])
        for frame, destination in [(X, features), (y, targets), (baseline, persistence)]:
            item = frame.loc[valid].copy()
            item.index = index
            destination.append(item)
    return tuple(pd.concat(frames).sort_index() for frames in (features, targets, persistence))


def chronological_masks(index, validation_start, test_start, horizon_hours=24):
    issue = index.get_level_values('time')
    valid = issue + pd.Timedelta(hours=horizon_hours)
    val, test = pd.Timestamp(validation_start, tz='UTC'), pd.Timestamp(test_start, tz='UTC')
    if val >= test:
        raise ValueError('Validation must precede the holdout')
    return {'train': valid < val, 'validation': (issue >= val) & (valid < test),
            'final_train': valid < test, 'test': issue >= test}


def seasonal_baseline(raw, index, cutoff):
    """Training-only city/month/hour climatology; no validation or test observations."""
    clean = DataCleaning().clean(raw)
    histories = []
    for city, g in clean.groupby('city'):
        g = g.sort_index().asfreq('h')
        values = g[list(TARGETS)].rename(columns=TARGETS).copy()
        values['precipitation_24h'] = g['precipitation'].rolling(24, min_periods=24).sum()
        values['city'] = city
        histories.append(values.loc[values.index < pd.Timestamp(cutoff, tz='UTC')])
    history = pd.concat(histories)
    lookup = history.groupby(['city', history.index.month, history.index.hour]).mean()
    valid = index.get_level_values('time') + pd.Timedelta(hours=24)
    keys = pd.MultiIndex.from_arrays([index.get_level_values('city'), valid.month, valid.hour])
    result = lookup.reindex(keys)
    result.index = index
    if result.isna().any().any():
        raise ValueError('Insufficient history for city/month/hour climatology')
    return result
