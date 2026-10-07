"""Audit a downloaded dataset and reproduce a completed ERA5 run and history examples."""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from ml.pipeline.data_cleaning import DataCleaning
from ml.pipeline.era5 import VARIABLES, sha256, validate_response
from ml.prediction.predictor import WeatherPredictor
from ml.scripts.evaluate import evaluate_run


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding='utf-8')


def inspect_dataset(data_dir, previous_dir=None):
    data_dir = Path(data_dir)
    manifest = json.loads((data_dir / 'manifest.json').read_text(encoding='utf-8'))
    data_file = data_dir / manifest['dataset_file']
    if sha256(data_file) != manifest['dataset_sha256']:
        raise ValueError('Dataset checksum mismatch')
    previous = {}
    if previous_dir:
        old = json.loads((Path(previous_dir) / 'manifest.json').read_text(encoding='utf-8'))
        previous = {Path(c['path'].replace('\\', '/')).name: c['sha256'] for c in old['chunks']}
    reused = 0
    for chunk in manifest['chunks']:
        path = data_dir / chunk['path'].replace('\\', '/')
        if sha256(path) != chunk['sha256']:
            raise ValueError(f'Raw chunk checksum mismatch: {path.name}')
        envelope = json.loads(path.read_text(encoding='utf-8'))
        if envelope['request'] != chunk['request']:
            raise ValueError(f'Raw request mismatch: {path.name}')
        validate_response(envelope['response'], chunk['request']['start_date'], chunk['request']['end_date'])
        if path.name in previous:
            if chunk['sha256'] != previous[path.name]:
                raise ValueError(f'Previously acquired chunk changed: {path.name}')
            reused += 1
    if previous and reused != len(previous):
        raise ValueError('The expanded dataset does not retain every previous chunk')
    raw = pd.read_csv(data_file)
    raw['time'] = pd.to_datetime(raw['time'], utc=True)
    raw = raw.set_index('time')
    if set(raw['city']) != set(manifest['cities']) or len(raw) != manifest['rows']:
        raise ValueError('Dataset coverage differs from the manifest')
    expected = pd.date_range(manifest['start'], pd.Timestamp(manifest['end']) + pd.Timedelta(hours=23), freq='h', tz='UTC')
    cities = {}
    for city, group in raw.groupby('city', sort=False):
        group = group.sort_index()
        if not group.index.equals(expected):
            raise ValueError(f'Incomplete or duplicated timeline: {city}')
        invalid = int((~np.isfinite(group[VARIABLES])).sum().sum())
        clean_invalid = int(DataCleaning().clean(group)[VARIABLES].isna().sum().sum())
        if invalid or clean_invalid:
            raise ValueError(f'Missing or physically invalid observations: {city}')
        cities[city] = dict(rows=len(group), first_hour=group.index.min().isoformat(), last_hour=group.index.max().isoformat(), missing_hours=0, nonfinite_values=invalid, missing_or_invalid_after_cleaning=clean_invalid,
                            range={v: dict(min=float(group[v].min()), max=float(group[v].max())) for v in VARIABLES})
    quality = dict(checked_at=datetime.now(timezone.utc).isoformat(), dataset_sha256=manifest['dataset_sha256'], source=manifest['source'], rows=len(raw), chunks_verified=len(manifest['chunks']), original_chunks_reused_unchanged=reused, cities=cities)
    return quality, raw


def verify_run(model_dir, data_dir, previous_dir=None, issue_time='2025-07-15T12:00:00Z'):
    model_dir = Path(model_dir)
    report = json.loads((model_dir / 'report.json').read_text(encoding='utf-8'))
    quality, raw = inspect_dataset(data_dir, previous_dir)
    write_json(model_dir / 'data_quality.json', quality)
    # Release the full observations while the evaluator constructs its feature matrix.
    del raw
    evaluate_run(model_dir, data_dir)
    raw = pd.read_csv(Path(data_dir) / 'historical_weather.csv')
    raw['time'] = pd.to_datetime(raw['time'], utc=True)
    raw = raw.set_index('time')
    issue = pd.Timestamp(issue_time)
    history = raw.loc[(raw.index >= issue - pd.Timedelta(hours=24)) & (raw.index <= issue)]
    del raw
    examples = []
    for name, record in report['models'].items():
        predictor = WeatherPredictor(str(model_dir))
        expected = pd.read_csv(model_dir / f'{name}_test_predictions.csv')
        expected['time'] = pd.to_datetime(expected['time'], utc=True)
        expected = expected.loc[expected['time'] == issue].set_index('city')
        for city in report['cities']:
            result = predictor.predict_history(name, history, city)
            for target, value in result['predictions'].items():
                np.testing.assert_allclose(value, expected.loc[city, f'predicted_{target}'], rtol=1e-6, atol=1e-8)
            if name == report['selected_model']:
                result['actual_at_valid_time'] = {target: float(expected.loc[city, f'actual_{target}']) for target in report['targets']}
                examples.append(result)
        del predictor, expected
    protocol = json.loads((model_dir / 'protocol.json').read_text(encoding='utf-8'))
    for field in ('cities', 'validation_start', 'test_start', 'horizon_hours', 'train_stride_hours', 'feature_precision'):
        if report[field] != protocol[field]:
            raise ValueError(f'Run differs from the recorded protocol: {field}')
    if set(report['models']) != set(protocol['models']):
        raise ValueError('Model coverage differs from the recorded protocol')
    selected = min(report['models'], key=lambda name: report['models'][name]['validation']['temperature']['RMSE'])
    if report['selected_model'] != selected:
        raise ValueError('Model selection differs from validation temperature RMSE')
    for name, record in report['models'].items():
        if record['parameters'] != protocol['models'][name]:
            raise ValueError(f'Model parameters changed from the recorded protocol: {name}')
    verification = dict(verified_at=datetime.now(timezone.utc).isoformat(), dataset_sha256=report['dataset_sha256'], raw_chunk_hashes_verified=quality['chunks_verified'], model_artifact_hashes_verified=list(report['models']), reproduced_all_overall_and_city_model_metrics=True, minimum_history_inference_verified_cities=report['cities'], minimum_history_inference_verified_models=list(report['models']), inference_issue_time=issue.isoformat(), fixed_hyperparameters_match_protocol=True, feature_precision=report['feature_precision'])
    write_json(model_dir / 'inference_examples.json', examples)
    write_json(model_dir / 'verification.json', verification)
    return verification


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', required=True)
    parser.add_argument('--model-dir')
    parser.add_argument('--previous-data-dir')
    args = parser.parse_args()
    if args.model_dir:
        result = verify_run(args.model_dir, args.data_dir, args.previous_data_dir)
        print(json.dumps(result, indent=2))
    else:
        result, _ = inspect_dataset(args.data_dir, args.previous_data_dir)
        write_json(Path(args.data_dir) / 'data_quality.json', result)
        print(f"Verified {result['rows']:,} rows, {len(result['cities'])} cities and {result['chunks_verified']} raw chunks.")


if __name__ == '__main__':
    main()
