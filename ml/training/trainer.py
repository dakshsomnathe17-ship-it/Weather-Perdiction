import pandas as pd
import numpy as np
from typing import Dict, List, Any
from sklearn.model_selection import train_test_split, KFold
from ..models.base_model import WeatherModel
from ..models.model_registry import registry
from .evaluator import ModelEvaluator
import logging

logger = logging.getLogger(__name__)

class ModelTrainer:
    """Class to handle model training and validation."""
    
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.evaluator = ModelEvaluator()
        
    def train(self, model: WeatherModel, X: pd.DataFrame, y: pd.DataFrame, validation_split: float = 0.2) -> Dict[str, Any]:
        """
        Train model with a single train-test split.
        """
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=validation_split, random_state=self.random_state
        )
        
        logger.info(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples.")
        model.train(X_train, y_train)
        
        preds = model.predict(X_test)
        metrics = self.evaluator.evaluate(y_test, preds)
        model.metrics = metrics
        
        return metrics
        
    def cross_validate(self, model: WeatherModel, X: pd.DataFrame, y: pd.DataFrame, cv: int = 5) -> Dict[str, Any]:
        """
        Perform K-fold cross-validation.
        """
        kf = KFold(n_splits=cv, shuffle=True, random_state=self.random_state)
        fold_metrics = []
        
        for fold, (train_idx, test_idx) in enumerate(kf.split(X)):
            logger.info(f"CV Fold {fold + 1}/{cv}")
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            
            model.train(X_train, y_train)
            preds = model.predict(X_test)
            metrics = self.evaluator.evaluate(y_test, preds)
            fold_metrics.append(metrics)
            
        # Aggregate metrics
        agg_metrics = {}
        for k in fold_metrics[0].keys():
            if isinstance(fold_metrics[0][k], dict):
                # Nested dict
                agg_metrics[k] = {}
                for sub_k in fold_metrics[0][k].keys():
                    vals = [m[k][sub_k] for m in fold_metrics]
                    agg_metrics[k][sub_k] = np.mean(vals)
            else:
                vals = [m[k] for m in fold_metrics]
                agg_metrics[k] = np.mean(vals)
                
        model.metrics = agg_metrics
        return agg_metrics
        
    def train_all_models(self, X: pd.DataFrame, y: pd.DataFrame, models: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Train multiple models and compare.
        """
        results = {}
        for model_name in models:
            logger.info(f"Processing model: {model_name}")
            model = registry.create(model_name)
            metrics = self.train(model, X, y)
            results[model_name] = metrics
            
        return results
