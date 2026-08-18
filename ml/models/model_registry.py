from typing import Type, Dict, List
from .base_model import WeatherModel
from .random_forest import RandomForestWeatherModel
from .xgboost_model import XGBoostWeatherModel
from .lightgbm_model import LightGBMWeatherModel

class ModelRegistry:
    """Registry for weather prediction models."""
    
    def __init__(self):
        self._registry: Dict[str, Type[WeatherModel]] = {}
        # Register defaults
        self.register('random_forest', RandomForestWeatherModel)
        self.register('xgboost', XGBoostWeatherModel)
        self.register('lightgbm', LightGBMWeatherModel)
        
    def register(self, name: str, model_class: Type[WeatherModel]) -> None:
        """Register a new model class."""
        self._registry[name] = model_class
        
    def create(self, name: str, **kwargs) -> WeatherModel:
        """Create an instance of a registered model."""
        if name not in self._registry:
            raise ValueError(f"Model '{name}' not found in registry.")
        return self._registry[name](name=name, **kwargs)
        
    def list_models(self) -> List[str]:
        """List all registered models."""
        return list(self._registry.keys())

registry = ModelRegistry()
