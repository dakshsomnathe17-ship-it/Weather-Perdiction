"""Reproducible 24-hour ERA5 hindcast study with an untouched final year."""
import argparse
import importlib.metadata
import json
import logging
import platform
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from ml.models.base_model import WeatherModel
from ml.models.model_registry import registry
from ml.pipeline.era5 import sha256
from ml.pipeline.supervised import UNITS, build_supervised, chronological_masks, seasonal_baseline
from ml.training.evaluator import ModelEvaluator

LOG = logging.getLogger(__name__)


def bounded_predictions(model, X):
    predictions = model.predict(X)
    for name in ('humidity', 'cloud_cover'):
        predictions[name] = predictions[name].clip(0, 100)
    for name in ('wind_speed', 'precipitation_24h'):
        predictions[name] = predictions[name].clip(lower=0)
    return predictions


def run(args):
    data_dir, output = Path(args.data_dir), Path(args.output_dir)
    output.mkdir(parents=True, exist_ok=True)
    if (output / 'report.json').exists():
        raise ValueError('Output contains a completed run; choose a new --output-dir')
    manifest = json.loads((data_dir / 'manifest.json').read_text(encoding='utf-8'))
    data_file = data_dir / 'historical_weather.csv'
    if manifest['model'] != 'era5' or sha256(data_file) != manifest['dataset_sha256']:
        raise ValueError('ERA5 provenance/hash verification failed')
    raw = pd.read_csv(data_file)
    raw['time'] = pd.to_datetime(raw['time'], utc=True)
    raw = raw.set_index('time')
    X, y, persistence = build_supervised(raw)
    masks = chronological_masks(X.index, args.validation_start, args.test_start)
    # One row every N issue hours, retaining every city; evaluation remains hourly.
    issue = X.index.get_level_values('time')
    stride = ((issue - issue.min()) / pd.Timedelta(hours=1)).astype(int) % args.train_stride == 0
    for split, mask in masks.items():
        if not mask.any():
            raise ValueError(f'Empty {split} split')
    evaluator = ModelEvaluator()
    report = {'created_at': datetime.now(timezone.utc).isoformat(), 'status': 'research_hindcast',
              'source': manifest['source'], 'dataset_sha256': manifest['dataset_sha256'],
              'raw_rows': len(raw), 'usable_rows': len(X), 'features': list(X), 'targets': UNITS,
              'cities': manifest['cities'], 'horizon_hours': 24, 'train_stride_hours': args.train_stride,
              'validation_start': args.validation_start, 'test_start': args.test_start,
              'selection_rule': 'lowest validation temperature RMSE; test scores do not select/tune models',
              'limitations': ['ERA5 reanalysis hindcast, not an operational forecast evaluation',
                             'Only the listed cities and 24-hour horizon are evaluated',
                             'ERA5 is delayed; live deployment needs matching recent inputs and separate validation',
                             'No calibrated rain probability or confidence intervals'],
              'python': platform.python_version(),
              'packages': {p: importlib.metadata.version(p) for p in ('numpy', 'pandas', 'scikit-learn', 'xgboost', 'lightgbm', 'joblib')},
              'splits': {}, 'baselines': {}, 'models': {}}
    for split, mask in masks.items():
        indices = issue[mask]
        report['splits'][split] = {'rows': int(mask.sum()), 'fit_rows': int((mask & stride).sum()) if 'train' in split else None,
                                  'first_issue': indices.min().isoformat(), 'last_issue': indices.max().isoformat(),
                                  'last_target': (indices.max() + pd.Timedelta(hours=24)).isoformat()}
    for split, cutoff in [('validation', args.validation_start), ('test', args.test_start)]:
        mask = masks[split]
        climatology = seasonal_baseline(raw, X.index[mask], cutoff)
        report['baselines'][split] = {'persistence': evaluator.evaluate(y.loc[mask], persistence.loc[mask]),
                                     'climatology': evaluator.evaluate(y.loc[mask], climatology)}
    params = {'random_forest': dict(n_estimators=96, max_depth=14, min_samples_leaf=10, max_features=.85, n_jobs=args.jobs),
              'xgboost': dict(n_estimators=240, max_depth=6, n_jobs=args.jobs),
              'lightgbm': dict(n_estimators=240, max_depth=8, n_jobs=args.jobs)}
    names = registry.list_models() if args.model == 'all' else [args.model]
    # Validation selects the model before final refits or any test metrics are read.
    for name in names:
        started = time.perf_counter()
        model = registry.create(name, **params[name])
        mask = masks['train'] & stride
        LOG.info('Validation fit %s: %s rows, %s features', name, int(mask.sum()), len(X.columns))
        model.train(X.loc[mask], y.loc[mask])
        metrics = evaluator.evaluate(y.loc[masks['validation']], bounded_predictions(model, X.loc[masks['validation']]))
        report['models'][name] = {'parameters': model.parameters, 'validation': metrics,
                                'validation_fit_seconds': round(time.perf_counter() - started, 2)}
        LOG.info('%s validation temperature MAE %.3f C', name, metrics['temperature']['MAE'])
        (output / 'progress.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    report['selected_model'] = min(names, key=lambda n: report['models'][n]['validation']['temperature']['RMSE'])
    for name in names:
        started = time.perf_counter()
        model = registry.create(name, **params[name])
        fit = masks['final_train'] & stride
        LOG.info('Final fit %s: %s rows', name, int(fit.sum()))
        model.train(X.loc[fit], y.loc[fit])
        test_X, truth = X.loc[masks['test']], y.loc[masks['test']]
        predictions = bounded_predictions(model, test_X)
        metrics = evaluator.evaluate(truth, predictions)
        model.metrics = metrics
        model.metadata = {'horizon_hours': 24, 'cities': manifest['cities'], 'dataset_sha256': manifest['dataset_sha256'],
                          'feature_contract': 'utc_issue_hour_with_24h_causal_history_v1',
                          'trained_until': report['splits']['final_train']['last_target'],
                          'status': 'research_hindcast', 'prediction_bounds': {'humidity': [0, 100], 'cloud_cover': [0, 100], 'wind_speed': [0, None], 'precipitation_24h': [0, None]}}
        model_path = output / f'{name}.joblib'
        model.save(str(model_path))
        reloaded = WeatherModel.load(str(model_path))
        np.testing.assert_allclose(bounded_predictions(reloaded, test_X.iloc[:16]), predictions.iloc[:16], rtol=1e-6)
        per_city = {}
        for city in manifest['cities']:
            select = truth.index.get_level_values('city') == city
            per_city[city] = evaluator.evaluate(truth.loc[select], predictions.loc[select])
        record = report['models'][name]
        record.update(test=metrics, test_by_city=per_city, artifact=model_path.name,
                      artifact_sha256=sha256(model_path), artifact_bytes=model_path.stat().st_size,
                      final_fit_seconds=round(time.perf_counter() - started, 2))
        prediction_file = output / f'{name}_test_predictions.csv'
        pd.concat([truth.add_prefix('actual_'), predictions.add_prefix('predicted_')], axis=1).to_csv(prediction_file)
        LOG.info('%s holdout temperature MAE %.3f C; artifact %s', name, metrics['temperature']['MAE'], model_path)
        (output / 'progress.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    (output / 'report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    (output / 'data_manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'selected_model': report['selected_model'], 'report': str(output / 'report.json')}, indent=2))
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', default='ml/data/era5')
    parser.add_argument('--output-dir', default='ml/saved_models/era5_24h')
    parser.add_argument('--model', choices=['all', *registry.list_models()], default='all')
    parser.add_argument('--validation-start', default='2023-01-01')
    parser.add_argument('--test-start', default='2025-01-01')
    parser.add_argument('--train-stride', type=int, default=3)
    parser.add_argument('--jobs', type=int, default=4)
    args = parser.parse_args()
    if args.train_stride < 1 or not 1 <= args.jobs <= 12:
        parser.error('train-stride must be positive and jobs must be between 1 and 12')
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
    run(args)


if __name__ == '__main__':
    main()
