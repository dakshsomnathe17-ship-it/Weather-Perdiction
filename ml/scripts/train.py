import argparse
import logging
import os
import pandas as pd
from ml.pipeline.data_cleaning import DataCleaning
from ml.pipeline.feature_engineering import FeatureEngineering
from ml.models.model_registry import registry
from ml.training.trainer import ModelTrainer
from ml.config import config

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Train weather models.")
    parser.add_argument("--model", type=str, default="all", help="Model name or 'all'")
    parser.add_argument("--data-dir", type=str, default=config.DATA_DIR, help="Data directory containing historical_weather.csv")
    parser.add_argument("--output-dir", type=str, default=config.MODEL_DIR, help="Output directory for saved models")
    parser.add_argument("--cv-folds", type=int, default=config.CV_FOLDS, help="Number of cross-validation folds")
    
    args = parser.parse_args()
    
    data_file = os.path.join(args.data_dir, "historical_weather.csv")
    if not os.path.exists(data_file):
        logger.error(f"Data file not found: {data_file}")
        return
        
    logger.info("Loading data...")
    df = pd.read_csv(data_file, parse_dates=['time'])
    df.set_index('time', inplace=True)
    
    logger.info("Cleaning data...")
    cleaner = DataCleaning()
    df_clean = cleaner.clean(df)
    
    logger.info("Engineering features...")
    fe = FeatureEngineering()
    df_features = fe.engineer_features(df_clean)
    
    # Prepare X and y
    # Assumes target columns are in the dataframe as raw values from API.
    # Note: Map target columns to API output names if they differ
    
    # Mapping config.TARGET_COLUMNS to dataset columns where possible
    api_to_target = {
        'temperature_2m': 'temperature',
        'relative_humidity_2m': 'humidity',
        'pressure_msl': 'pressure',
        'wind_speed_10m': 'wind_speed',
        'cloud_cover': 'cloud_cover',
        'precipitation': 'precipitation',
        'visibility': 'visibility'
    }
    
    # Rename columns to match TARGET_COLUMNS
    df_features.rename(columns=api_to_target, inplace=True)
    
    available_targets = [c for c in config.TARGET_COLUMNS if c in df_features.columns]
    
    # Remove targets and non-features from X
    y = df_features[available_targets]
    drop_cols = available_targets + ['city']
    X = df_features.drop(columns=[c for c in drop_cols if c in df_features.columns])
    
    models_to_train = registry.list_models() if args.model == "all" else [args.model]
    
    trainer = ModelTrainer(random_state=config.RANDOM_STATE)
    
    for model_name in models_to_train:
        logger.info(f"Training {model_name}...")
        model = registry.create(model_name)
        
        if args.cv_folds > 1:
            metrics = trainer.cross_validate(model, X, y, cv=args.cv_folds)
        else:
            metrics = trainer.train(model, X, y, validation_split=config.TRAIN_TEST_SPLIT)
            
        model_path = os.path.join(args.output_dir, f"{model_name}.joblib")
        model.save(model_path)
        logger.info(f"Saved {model_name} to {model_path}")
        
        report_path = os.path.join(args.output_dir, f"{model_name}_report.txt")
        trainer.evaluator.generate_report(model_name, metrics, report_path)

if __name__ == "__main__":
    main()
