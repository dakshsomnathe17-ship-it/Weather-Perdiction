import numpy as np
import pandas as pd
import pytest
from ml.models.base_model import WeatherModel
from ml.models.model_registry import registry
from ml.training.trainer import ModelTrainer


@pytest.mark.parametrize('name', ['random_forest', 'xgboost', 'lightgbm'])
def test_models_fit_predict_and_roundtrip(name, tmp_path):
    clock = pd.date_range('2020-01-01', periods=200, freq='h', tz='UTC', name='time')
    X = pd.DataFrame({'a': np.sin(np.arange(200) / 12), 'b': np.arange(200) / 200}, index=clock)
    y = pd.DataFrame({'temperature': 20 + 3 * X.a, 'humidity': 50 + 10 * X.b}, index=clock)
    model = registry.create(name, n_estimators=8, max_depth=3, n_jobs=1)
    with pytest.raises(ValueError, match='not trained'):
        model.predict(X)
    model.train(X.iloc[:150], y.iloc[:150])
    predictions = model.predict(X.iloc[150:])
    assert predictions.shape == (50, 2) and np.isfinite(predictions).all().all()
    assert predictions.index.equals(X.iloc[150:].index)
    path = str(tmp_path / f'{name}.joblib')
    model.save(path)
    np.testing.assert_allclose(WeatherModel.load(path).predict(X.iloc[150:]), predictions)


def test_cross_validation_never_trains_on_future_and_refits_all_data():
    clock = pd.date_range('2020-01-01', periods=360, freq='h', tz='UTC', name='time')
    X = pd.DataFrame({'signal': np.arange(len(clock))}, index=clock)
    y = pd.DataFrame({'temperature': np.arange(len(clock)) / 20}, index=clock)
    class Recorder:
        def __init__(self): self.fits = []; self.checks = 0
        def train(self, X, y): self.fits.append(X.index); self.mean = y.mean()
        def predict(self, X):
            assert self.fits[-1].max() + pd.Timedelta(hours=24) < X.index.min()
            self.checks += 1
            return pd.DataFrame({'temperature': self.mean['temperature']}, index=X.index)
    model = Recorder()
    metrics = ModelTrainer().cross_validate(model, X, y, cv=3)
    assert model.checks == 3 and model.fits[-1].equals(X.index)
    assert 'RMSE' in metrics['temperature']
