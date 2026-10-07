"""Reload saved models and reproduce the reported holdout scores without refitting."""
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from ml.config import config
from ml.models.base_model import WeatherModel
from ml.pipeline.era5 import sha256
from ml.pipeline.supervised import build_supervised, chronological_masks
from ml.scripts.train import bounded_predictions
from ml.training.evaluator import ModelEvaluator


def evaluate_run(model_dir, data_dir):
    model_dir, data_dir = Path(model_dir), Path(data_dir)
    report = json.loads((model_dir / 'report.json').read_text(encoding='utf-8'))
    data_file = data_dir / 'historical_weather.csv'
    if sha256(data_file) != report['dataset_sha256']:
        raise ValueError('Dataset checksum differs from the training run')
    raw = pd.read_csv(data_file)
    raw['time'] = pd.to_datetime(raw['time'], utc=True)
    X, y, _ = build_supervised(raw.set_index('time'), feature_precision=report.get('feature_precision'))
    test = chronological_masks(X.index, report['validation_start'], report['test_start'])['test']
    evaluator, results = ModelEvaluator(), {}
    for name, record in report['models'].items():
        path = model_dir / record['artifact']
        if sha256(path) != record['artifact_sha256']:
            raise ValueError(f'Artifact checksum differs: {name}')
        model = WeatherModel.load(str(path))
        predictions = bounded_predictions(model, X.loc[test])
        results[name] = evaluator.evaluate(y.loc[test], predictions)
        for target, metrics in results[name].items():
            for metric, value in metrics.items():
                np.testing.assert_allclose(value, record['test'][target][metric], rtol=1e-6, atol=1e-8)
        per_city = evaluator.evaluate_by_city(y.loc[test], predictions)
        if set(per_city) != set(record['test_by_city']):
            raise ValueError(f'Evaluated cities differ from the saved report: {name}')
        for city, targets in per_city.items():
            for target, metrics in targets.items():
                for metric, value in metrics.items():
                    np.testing.assert_allclose(value, record['test_by_city'][city][target][metric], rtol=1e-6, atol=1e-8)
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model-dir', default=config.MODEL_DIR)
    parser.add_argument('--data-dir', default=config.DATA_DIR)
    args = parser.parse_args()
    results = evaluate_run(args.model_dir, args.data_dir)
    print(ModelEvaluator().compare_models(results).to_string())
    print('Verified dataset/artifact checksums and reproduced every saved holdout metric.')


if __name__ == '__main__':
    main()
