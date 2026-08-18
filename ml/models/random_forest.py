from .base_model import WeatherModel
import pandas as pd
from typing import Any, Dict
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
import logging

logger = logging.getLogger(__name__)

class RandomForestWeatherModel(WeatherModel):
    """Random Forest implementation for weather prediction."""
    
    def __init__(self, name: str = 'random_forest', version: str = '1.0.0', **kwargs):
        super().__init__(name, version)
        self.parameters = {**self.get_default_params(), **kwargs}
        self.model = MultiOutputRegressor(RandomForestRegressor(**self.parameters))
        
    def get_default_params(self) -> Dict[str, Any]:
        return {
            'n_estimators': 200,
            'max_depth': 20,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'n_jobs': -1,
            'random_state': 42
        }
        
    def train(self, X_train: pd.DataFrame, y_train: pd.DataFrame) -> None:
        """Train the Random Forest model."""
        logger.info(f"Training {self.name}...")
        self.feature_names = list(X_train.columns)
        self.target_names = list(y_train.columns)
        self.model.fit(X_train, y_train)
        self.is_trained = True
        logger.info(f"Finished training {self.name}.")
        
    def predict(self, X: pd.DataFrame) -> pd.DataFrame:
        """Predict using the Random Forest model."""
        if not self.is_trained:
            raise ValueError("Model is not trained yet.")
        preds = self.model.predict(X)
        return pd.DataFrame(preds, columns=self.target_names, index=X.index)
