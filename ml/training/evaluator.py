import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


class ModelEvaluator:
    def evaluate(self, y_true, y_pred):
        if not y_true.index.equals(y_pred.index) or list(y_true.columns) != list(y_pred.columns):
            raise ValueError('Prediction coordinates/targets do not match the evaluation set')
        return {column: {'MAE': float(mean_absolute_error(y_true[column], y_pred[column])),
                         'RMSE': float(np.sqrt(mean_squared_error(y_true[column], y_pred[column]))),
                         'R2': float(r2_score(y_true[column], y_pred[column]))} for column in y_true}

    def compare_models(self, results):
        # Temperature has meaningful common units; do not average °C, %, hPa and mm.
        return pd.DataFrame({name: metrics['temperature'] for name, metrics in results.items()}).T

    def evaluate_by_city(self, y_true, y_pred):
        if 'city' not in y_true.index.names:
            raise ValueError('Per-city evaluation requires a city index level')
        if not y_true.index.equals(y_pred.index):
            raise ValueError('Prediction coordinates do not match the evaluation set')
        return {city: self.evaluate(y_true.xs(city, level='city'), y_pred.xs(city, level='city'))
                for city in y_true.index.get_level_values('city').unique()}

    def generate_report(self, model_name, metrics, output_path):
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({'model': model_name, 'metrics': metrics}, indent=2), encoding='utf-8')
