from abc import ABC, abstractmethod
import pandas as pd
import numpy as np
from typing import Any, Dict, List
import joblib
import os

class WeatherModel(ABC):
    """Abstract base class for all weather prediction models."""
    
    def __init__(self, name: str, version: str = '1.0.0'):
        self.name = name
        self.version = version
        self.model = None
        self.is_trained = False
        self.feature_names: List[str] = []
        self.target_names: List[str] = []
        self.metrics: Dict[str, float] = {}
        self.parameters: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
    
    @abstractmethod
    def train(self, X_train: pd.DataFrame, y_train: pd.DataFrame) -> None:
        """Train the model."""
        pass
    
    @abstractmethod
    def predict(self, X: pd.DataFrame) -> pd.DataFrame:
        """Predict using the trained model."""
        pass
    
    @abstractmethod
    def get_default_params(self) -> Dict[str, Any]:
        """Get default hyperparameters."""
        pass
    
    def save(self, filepath: str) -> None:
        """Save the model to disk using joblib."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath, compress=3)
    
    @classmethod
    def load(cls, filepath: str) -> 'WeatherModel':
        """Load the model from disk using joblib."""
        return joblib.load(filepath)
    
    def get_info(self) -> Dict[str, Any]:
        """Return model metadata."""
        return {
            'name': self.name,
            'version': self.version,
            'is_trained': self.is_trained,
            'feature_names': self.feature_names,
            'target_names': self.target_names,
            'metrics': self.metrics,
            'parameters': self.parameters,
            'metadata': self.metadata
        }
