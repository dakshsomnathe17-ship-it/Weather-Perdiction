import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class ModelEvaluator:
    """Class to evaluate models."""
    
    def evaluate(self, y_true: pd.DataFrame, y_pred: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate metrics for predictions.
        """
        metrics = {}
        target_cols = y_true.columns
        
        overall_mae = []
        overall_rmse = []
        overall_r2 = []
        
        for col in target_cols:
            yt = y_true[col]
            yp = y_pred[col]
            
            mae = mean_absolute_error(yt, yp)
            rmse = np.sqrt(mean_squared_error(yt, yp))
            r2 = r2_score(yt, yp)
            
            # MAPE can be problematic with zeros, add small epsilon
            mape = np.mean(np.abs((yt - yp) / (yt + 1e-8))) * 100
            
            metrics[col] = {
                'MAE': mae,
                'RMSE': rmse,
                'R2': r2,
                'MAPE': mape
            }
            
            overall_mae.append(mae)
            overall_rmse.append(rmse)
            overall_r2.append(r2)
            
        metrics['overall'] = {
            'MAE': np.mean(overall_mae),
            'RMSE': np.mean(overall_rmse),
            'R2': np.mean(overall_r2)
        }
        
        return metrics
        
    def compare_models(self, results: Dict[str, Dict[str, Any]]) -> pd.DataFrame:
        """
        Create a comparison table of model performances.
        """
        records = []
        for model_name, metrics in results.items():
            record = {'Model': model_name}
            record.update(metrics['overall'])
            records.append(record)
            
        return pd.DataFrame(records).set_index('Model')
        
    def generate_report(self, model_name: str, metrics: Dict[str, Any], output_path: str) -> None:
        """
        Save text report of metrics.
        """
        import os
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            f.write(f"Model Evaluation Report: {model_name}\n")
            f.write("=" * 40 + "\n\n")
            f.write("Overall Metrics:\n")
            for k, v in metrics['overall'].items():
                f.write(f"  {k}: {v:.4f}\n")
            f.write("\nPer-Target Metrics:\n")
            for target, target_metrics in metrics.items():
                if target == 'overall':
                    continue
                f.write(f"  {target}:\n")
                for k, v in target_metrics.items():
                    f.write(f"    {k}: {v:.4f}\n")
                    
        logger.info(f"Report saved to {output_path}")
