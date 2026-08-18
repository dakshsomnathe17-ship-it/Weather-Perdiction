import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from ..models.base_model import WeatherModel
import logging

logger = logging.getLogger(__name__)

class WeatherPredictor:
    """Predictor class handling loading models and making predictions."""
    
    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.loaded_models: Dict[str, WeatherModel] = {}
        
    def load_model(self, model_name: str) -> WeatherModel:
        """Load a model by name."""
        if model_name in self.loaded_models:
            return self.loaded_models[model_name]
            
        filepath = os.path.join(self.model_dir, f"{model_name}.joblib")
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found at {filepath}")
            
        model = WeatherModel.load(filepath)
        self.loaded_models[model_name] = model
        logger.info(f"Loaded model {model_name} from {filepath}")
        return model
        
    def predict(self, model_name: str, features: Dict[str, Any]) -> Dict[str, float]:
        """Make a prediction using a specific model."""
        model = self.load_model(model_name)
        
        # Convert features dict to DataFrame
        # Assumes features contains all required columns
        df_features = pd.DataFrame([features])
        
        # Ensure column order matches training
        if hasattr(model, 'feature_names') and model.feature_names:
            missing = set(model.feature_names) - set(df_features.columns)
            if missing:
                raise ValueError(f"Missing required features: {missing}")
            df_features = df_features[model.feature_names]
            
        preds = model.predict(df_features)
        
        # Return as dict
        return preds.iloc[0].to_dict()
        
    def predict_ensemble(self, features: Dict[str, Any], models: List[str] = None) -> Dict[str, Any]:
        """Make ensemble prediction across multiple models."""
        if not models:
            raise ValueError("Must provide at least one model name.")
            
        all_preds = []
        for model_name in models:
            pred = self.predict(model_name, features)
            all_preds.append(pred)
            
        # Compute mean and std
        df_preds = pd.DataFrame(all_preds)
        mean_preds = df_preds.mean().to_dict()
        std_preds = df_preds.std().fillna(0).to_dict()
        
        return {
            'predictions': mean_preds,
            'confidence_std': std_preds
        }
