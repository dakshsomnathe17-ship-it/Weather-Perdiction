import argparse
import logging
import os
import pandas as pd
from ml.prediction.predictor import WeatherPredictor
from ml.config import config
from ml.models.model_registry import registry
from ml.training.evaluator import ModelEvaluator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Evaluate trained models.")
    parser.add_argument("--model-dir", type=str, default=config.MODEL_DIR, help="Directory containing saved models")
    parser.add_argument("--data-dir", type=str, default=config.DATA_DIR, help="Directory containing test data")
    
    args = parser.parse_args()
    
    # In a real scenario, you'd load a holdout test set. 
    # For this script, we'll try to load models and print their stored metrics if available,
    # or run predictions on a sample.
    
    predictor = WeatherPredictor(args.model_dir)
    evaluator = ModelEvaluator()
    
    results = {}
    for model_name in registry.list_models():
        try:
            model = predictor.load_model(model_name)
            if model.metrics:
                results[model_name] = model.metrics
                logger.info(f"Loaded metrics for {model_name}")
            else:
                logger.warning(f"No metrics found in {model_name}")
        except Exception as e:
            logger.error(f"Could not load {model_name}: {e}")
            
    if results:
        comparison_df = evaluator.compare_models(results)
        print("\nModel Comparison:")
        print("="*80)
        print(comparison_df.to_string())
        print("="*80)
        
        # Save comparison to CSV
        output_csv = os.path.join(args.model_dir, "model_comparison.csv")
        comparison_df.to_csv(output_csv)
        logger.info(f"Saved comparison to {output_csv}")

if __name__ == "__main__":
    main()
