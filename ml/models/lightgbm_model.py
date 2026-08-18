from .base_model import WeatherModel
import pandas as pd
from typing import Any, Dict
import lightgbm as lgb
from sklearn.multioutput import MultiOutputRegressor
import logging

logger = logging.getLogger(__name__)

class LightGBMWeatherModel(WeatherModel):
    """LightGBM implementation for weather prediction."""
    
    def __init__(self, name: str = 'lightgbm', version: str = '1.0.0', **kwargs):
        super().__init__(name, version)
        self.parameters = {**self.get_default_params(), **kwargs}
        self.model = MultiOutputRegressor(lgb.LGBMRegressor(**self.parameters))
        
    def get_default_params(self) -> Dict[str, Any]:
        return {
            'n_estimators': 300,
            'max_depth': 10,
            'learning_rate': 0.05,
            'num_leaves': 31,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'reg_alpha': 0.1,
            'reg_lambda': 1.0,
            'random_state': 42
        }
        
    def train(self, X_train: pd.DataFrame, y_train: pd.DataFrame) -> None:
        """Train the LightGBM model."""
        logger.info(f"Training {self.name}...")
        self.feature_names = list(X_train.columns)
        self.target_names = list(y_train.columns)
        self.model.fit(X_train, y_train)
        self.is_trained = True
        logger.info(f"Finished training {self.name}.")
        
    def predict(self, X: pd.DataFrame) -> pd.DataFrame:
        """Predict using the LightGBM model."""
        if not self.is_trained:
            raise ValueError("Model is not trained yet.")
        preds = self.model.predict(X)
        return pd.DataFrame(preds, columns=self.target_names, index=X.index)
