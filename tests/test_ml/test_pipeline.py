import json
import httpx
import numpy as np
import pandas as pd
import pytest
from ml.pipeline import era5
from ml.pipeline.data_cleaning import DataCleaning
from ml.pipeline.feature_engineering import FeatureEngineering
from ml.pipeline.supervised import build_supervised, chronological_masks, seasonal_baseline


@pytest.fixture
def raw_weather():
    clock = pd.date_range('2021-12-01', periods=1800, freq='h', tz='UTC', name='time')
    rows = []
    for city, offset in [('Pune', 0), ('Mumbai', 5)]:
        t = np.arange(len(clock))
        rows.append(pd.DataFrame({'city': city, 'latitude': 18 + offset, 'longitude': 73,
            'temperature_2m': 20 + offset + np.sin(t / 24), 'relative_humidity_2m': 50 + np.sin(t / 50),
            'pressure_msl': 1010 + np.cos(t / 60), 'wind_speed_10m': 10 + np.sin(t / 4),
            'cloud_cover': 30 + np.sin(t / 20), 'precipitation': np.where(t % 13 == 0, 2., 0.)}, index=clock))
    return pd.concat(rows)


def test_cleaning_preserves_cities_and_extreme_rain(raw_weather):
    raw_weather.iloc[50, raw_weather.columns.get_loc('precipitation')] = 150
    cleaned = DataCleaning().clean(raw_weather)
    assert len(cleaned) == len(raw_weather)
    assert cleaned.groupby('city').size().to_dict() == {'Mumbai': 1800, 'Pune': 1800}
    assert cleaned['precipitation'].max() == 150


def test_conflicting_duplicate_fails(raw_weather):
    extra = raw_weather.iloc[[0]].copy()
    extra['temperature_2m'] = 30
    with pytest.raises(ValueError, match='Conflicting'):
        DataCleaning().clean(pd.concat([raw_weather, extra]))


def test_targets_are_future_values_and_precipitation_is_next_day_sum(raw_weather):
    X, y, baseline = build_supervised(raw_weather)
    issue = pd.Timestamp('2021-12-03', tz='UTC')
    city = raw_weather.loc[raw_weather.city == 'Pune']
    assert y.loc[(issue, 'Pune'), 'temperature'] == city.loc[issue + pd.Timedelta(hours=24), 'temperature_2m']
    expected = city.loc[issue + pd.Timedelta(hours=1):issue + pd.Timedelta(hours=24), 'precipitation'].sum()
    assert y.loc[(issue, 'Pune'), 'precipitation_24h'] == expected
    assert baseline.loc[(issue, 'Pune'), 'temperature'] == city.loc[issue, 'temperature_2m']
    assert 'city' not in X and 'target_time' not in X


def test_future_changes_do_not_change_features(raw_weather):
    issue = pd.Timestamp('2021-12-03', tz='UTC')
    before, _, _ = build_supervised(raw_weather)
    altered = raw_weather.copy()
    altered.loc[altered.index > issue, 'temperature_2m'] += 8
    after, _, _ = build_supervised(altered)
    pd.testing.assert_frame_equal(before.loc[:issue], after.loc[:issue])


def test_missing_hour_does_not_become_a_false_one_hour_lag(raw_weather):
    missing = pd.Timestamp('2021-12-03', tz='UTC')
    raw_weather = raw_weather.loc[~((raw_weather.index == missing) & (raw_weather.city == 'Pune'))]
    X, _, _ = build_supervised(raw_weather)
    assert (missing + pd.Timedelta(hours=1), 'Pune') not in X.index
    assert (missing + pd.Timedelta(hours=1), 'Mumbai') in X.index


def test_splits_purge_future_labels_for_all_cities(raw_weather):
    X, _, _ = build_supervised(raw_weather)
    masks = chronological_masks(X.index, '2022-01-01', '2022-02-01')
    times = X.index.get_level_values('time')
    assert (times[masks['train']] + pd.Timedelta(hours=24)).max() < pd.Timestamp('2022-01-01', tz='UTC')
    assert (times[masks['validation']] + pd.Timedelta(hours=24)).max() < pd.Timestamp('2022-02-01', tz='UTC')
    assert times[masks['test']].min() >= pd.Timestamp('2022-02-01', tz='UTC')


def test_climatology_never_uses_evaluation_observations(raw_weather):
    X, _, _ = build_supervised(raw_weather)
    # Evaluate an hour in the same month/year, using only its earlier history.
    selected = X.index[(X.index.get_level_values('time') >= pd.Timestamp('2021-12-20', tz='UTC')) &
                       (X.index.get_level_values('time') < pd.Timestamp('2021-12-21', tz='UTC'))]
    before = seasonal_baseline(raw_weather, selected, '2021-12-20')
    altered = raw_weather.copy()
    altered.loc[altered.index >= pd.Timestamp('2021-12-20', tz='UTC'), 'temperature_2m'] += 9
    pd.testing.assert_frame_equal(before, seasonal_baseline(altered, selected, '2021-12-20'))


def test_era5_download_is_pinned_validated_and_resumable(tmp_path, monkeypatch):
    monkeypatch.setattr(era5.time, 'sleep', lambda _: None)
    times = pd.date_range('2020-01-01', periods=24, freq='h').strftime('%Y-%m-%dT%H:%M').tolist()
    units = dict(zip(era5.VARIABLES, ['°C', '%', 'hPa', 'km/h', '%', 'mm']))
    calls = []
    def respond(request):
        calls.append(request)
        assert request.url.params['models'] == 'era5'
        assert request.url.params['elevation'] == 'nan'
        return httpx.Response(200, json={'latitude': 18.5, 'longitude': 73.75, 'hourly_units': units,
            'hourly': {'time': times, **{v: [1.] * 24 for v in era5.VARIABLES}}})
    with httpx.Client(transport=httpx.MockTransport(respond)) as client:
        first = era5.download(tmp_path, ['Pune'], '2020-01-01', '2020-01-01', client=client)
        second = era5.download(tmp_path, ['Pune'], '2020-01-01', '2020-01-01', client=client)
    assert len(calls) == 1 and first['rows'] == 24
    assert first['dataset_sha256'] == second['dataset_sha256']
    saved = json.loads((tmp_path / 'raw/pune_2020-01-01_2020-01-01.json').read_text())
    saved['response']['hourly_units']['temperature_2m'] = 'K'
    with pytest.raises(ValueError, match='unit'):
        era5.validate_response(saved['response'], '2020-01-01', '2020-01-01')


def test_saved_history_inference_matches_training_features(raw_weather, tmp_path):
    from ml.models.model_registry import registry
    from ml.prediction.predictor import WeatherPredictor
    from ml.scripts.train import bounded_predictions
    X, y, _ = build_supervised(raw_weather)
    model = registry.create('random_forest', n_estimators=4, max_depth=3, n_jobs=1)
    model.train(X.iloc[:1000], y.iloc[:1000])
    model.metadata = {'cities': ['Pune', 'Mumbai'], 'horizon_hours': 24,
                      'prediction_bounds': {'humidity': [0, 100], 'cloud_cover': [0, 100],
                                            'wind_speed': [0, None], 'precipitation_24h': [0, None]}}
    model.save(str(tmp_path / 'random_forest.joblib'))
    predictor = WeatherPredictor(str(tmp_path))
    issue = pd.Timestamp('2022-01-15T12:00:00Z')
    history = raw_weather.loc[(raw_weather.index <= issue) & (raw_weather.index >= issue - pd.Timedelta(hours=24))]
    for city in ['Pune', 'Mumbai']:
        result = predictor.predict_history('random_forest', history, city)
        expected = bounded_predictions(model, X.loc[[(issue, city)]]).iloc[0]
        np.testing.assert_allclose(list(result['predictions'].values()), expected)
        assert result['valid_time'] == (issue + pd.Timedelta(hours=24)).isoformat()
        assert result['status'] == 'research_hindcast'
    with pytest.raises(ValueError, match='outside'):
        predictor.predict_history('random_forest', history, 'Delhi')
    with pytest.raises(ValueError, match='No observation history'):
        predictor.predict_history('random_forest', history.loc[history.city == 'Pune'], 'Mumbai')
    with pytest.raises(ValueError, match='contiguous'):
        predictor.predict_history('random_forest', history.loc[history.index != issue - pd.Timedelta(hours=1)], 'Pune')


@pytest.mark.parametrize('header', [None, '20', 'invalid', 'Wed, 21 Oct 2015 07:28:00 GMT'])
def test_retry_after_handles_seconds_and_http_dates(header):
    assert 5 <= era5.retry_delay(header, 0) <= 60
