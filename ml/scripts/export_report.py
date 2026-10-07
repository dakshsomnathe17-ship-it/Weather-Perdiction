"""Export a completed run as a model card, provenance, and per-city error chart."""
import argparse
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

from ml.pipeline.era5 import sha256


def export_report(model_dir, output_dir, compare_report=None):
    source, output = Path(model_dir), Path(output_dir)
    report = json.loads((source / 'report.json').read_text(encoding='utf-8'))
    manifest = json.loads((source / 'data_manifest.json').read_text(encoding='utf-8'))
    if report['dataset_sha256'] != manifest['dataset_sha256']:
        raise ValueError('Report and data manifest refer to different datasets')
    for record in report['models'].values():
        if sha256(source / record['artifact']) != record['artifact_sha256']:
            raise ValueError(f"Artifact checksum differs: {record['artifact']}")
    output.mkdir(parents=True, exist_ok=True)
    for filename in ('report.json', 'data_manifest.json', 'protocol.json', 'data_quality.json', 'verification.json', 'inference_examples.json', 'city_geocoding.json'):
        if (source / filename).exists():
            (output / filename).write_bytes((source / filename).read_bytes())

    selected_name = report['selected_model']
    selected = report['models'][selected_name]
    cities = report['cities']
    baseline_cities = report.get('baseline_by_city', {}).get('test', {}).get('persistence')
    missing = sum(sum(chunk['missing'].values()) for chunk in manifest['chunks'])
    lines = [
        '# ERA5 24-hour model card', '',
        f"Run started: {report['created_at']}. Completed: {report.get('finished_at', 'not recorded')}.", '',
        '**Status: research hindcast; not deployed to the website.**', '',
        '## Data and scope', '',
        f"{report['raw_rows']:,} hourly records, {manifest['start']} through {manifest['end']} UTC, "
        f"for {len(cities)} cities: {', '.join(cities)}. "
        f"{len(manifest['chunks'])} annual chunks; {missing:,} missing field values in provider responses. "
        f"{report['usable_rows']:,} complete supervised rows remain after feature/target preparation.", '',
        'Source: ERA5 processed and distributed by Open-Meteo, explicitly selected with `models=era5`. '
        'Requests use the nearest grid cell, UTC, and `elevation=nan` to disable statistical elevation downscaling. '
        'This is not a direct CDS download. The models use requested city coordinates; returned coordinates identify the source grid cells.', '',
        '| City | Requested latitude, longitude | Returned ERA5 grid latitude, longitude |',
        '| --- | --- | --- |',
    ]
    for city in cities:
        chunks = [c for c in manifest['chunks'] if Path(c['path'].replace('\\', '/')).name.startswith(city.lower() + '_')]
        request = chunks[0]['request']
        grids = sorted({(c['grid_latitude'], c['grid_longitude']) for c in chunks})
        grid_text = '; '.join(f'{lat}, {lon}' for lat, lon in grids)
        lines.append(f"| {city} | {request['latitude']}, {request['longitude']} | {grid_text} |")
    lines += [
        '', f"CSV SHA-256: `{report['dataset_sha256']}`.", '',
        'Attribution: Contains modified Copernicus Climate Change Service information; processed by Open-Meteo. '
        '[ERA5 dataset DOI](https://doi.org/10.24381/cds.adbb2d47), '
        '[Open-Meteo documentation](https://open-meteo.com/en/docs/historical-weather-api), '
        '[CC BY 4.0 and API access terms](https://open-meteo.com/en/terms). '
        'Full requests, dates, units and checksums are in [data_manifest.json](data_manifest.json).', '',
        '## Evaluation protocol', '',
        f"{len(report['features'])} features use observations up to the issue hour: six current variables, coordinates, "
        '1/6/24-hour lags, trailing 6/24-hour means, preceding-day rainfall, and known target-time calendar encodings. '
        'Targets are five instantaneous values at +24 hours and the next 24-hour precipitation sum. '
        'Humidity/cloud predictions are bounded to 0–100%; wind/rain to nonnegative values.', '',
        '| Partition | Rows | Rows used for fitting | First issue (UTC) | Last issue (UTC) |',
        '| --- | ---: | ---: | --- | --- |',
    ]
    for split, record in report['splits'].items():
        fit_rows = f"{record['fit_rows']:,}" if record['fit_rows'] is not None else 'evaluation only'
        lines.append(f"| {split} | {record['rows']:,} | {fit_rows} | {record['first_issue']} | {record['last_issue']} |")
    lines += [
        '', f"Fits use one in every {report['train_stride_hours']} issue hours with all cities retained; evaluation is hourly. "
        'Future targets are purged at partition boundaries. The final models refit through 2024, including the earlier validation period. '
        'No random split, future imputation, or test-based hyperparameter tuning is used.', '',
        f"**Selected model: {selected_name}**, based on validation temperature RMSE. The selection is retained after examining test results.", '',
        'Baselines are persistence (current instantaneous values / preceding-day rainfall) and training-only city/month/hour climatology. '
        'Both the model and baseline are scored separately for each city.', '',
    ]
    if (source / 'protocol.json').exists():
        protocol = json.loads((source / 'protocol.json').read_text(encoding='utf-8'))
        lines += [f"Prior evaluation context: {protocol['prior_holdout_context']}. "
                  'This expansion reuses the fixed earlier parameters and date splits; it is not a new independent audit of previously evaluated cities. '
                  'See [protocol.json](protocol.json).', '']
        if protocol.get('numerical_remediation'):
            lines += [f"Numerical correction: {protocol['numerical_remediation']}", '']
    if report.get('feature_precision') is not None:
        lines += [f"Feature contract v2 rounds numeric features to {report['feature_precision']} decimal places during "
                  'training and inference. This prevents rolling-sum roundoff from sending identical observation windows '
                  'down different tree branches. Older artifacts retain their original feature contract.', '']
    lines += ['## Temperature results', '',
              '| Model / baseline | Validation RMSE (°C) | Test MAE (°C) | Test RMSE (°C) | Test R² |',
              '| --- | ---: | ---: | ---: | ---: |']
    records = [(name, report['baselines']['validation'][name], report['baselines']['test'][name])
               for name in ('persistence', 'climatology')]
    records += [(name, r['validation'], r['test']) for name, r in report['models'].items()]
    for name, validation, test in records:
        v, t = validation['temperature'], test['temperature']
        lines.append(f"| {name} | {v['RMSE']:.4f} | {t['MAE']:.4f} | {t['RMSE']:.4f} | {t['R2']:.4f} |")
    lines += ['', '## Selected-model test results', '',
              '| Target | Units | Model MAE | Persistence MAE | Model RMSE | Persistence RMSE | Model R² |',
              '| --- | --- | ---: | ---: | ---: | ---: | ---: |']
    worse = []
    for target, units in report['targets'].items():
        model, baseline = selected['test'][target], report['baselines']['test']['persistence'][target]
        lines.append(f"| {target} | {units} | {model['MAE']:.3f} | {baseline['MAE']:.3f} | "
                     f"{model['RMSE']:.3f} | {baseline['RMSE']:.3f} | {model['R2']:.3f} |")
        if model['MAE'] > baseline['MAE']:
            worse.append(target)
    if worse:
        lines += ['', f"**MAE is worse than persistence for: {', '.join(worse)}.**"]
    lines += ['', '## Results by city', '',
              '| City | Temperature MAE (°C) | Persistence MAE (°C) | Temperature RMSE (°C) | Rain MAE (mm) | Persistence rain MAE (mm) |',
              '| --- | ---: | ---: | ---: | ---: | ---: |']
    for city in cities:
        model = selected['test_by_city'][city]
        temp_base = f"{baseline_cities[city]['temperature']['MAE']:.3f}" if baseline_cities else 'not recorded'
        rain_base = f"{baseline_cities[city]['precipitation_24h']['MAE']:.3f}" if baseline_cities else 'not recorded'
        lines.append(f"| {city} | {model['temperature']['MAE']:.3f} | {temp_base} | "
                     f"{model['temperature']['RMSE']:.3f} | {model['precipitation_24h']['MAE']:.3f} | {rain_base} |")
    if baseline_cities:
        make_chart(report, output / 'city_errors.png')
        lines += ['', '![Selected model versus persistence by city; lower MAE is better](city_errors.png)']
    if compare_report:
        previous = json.loads(Path(compare_report).read_text(encoding='utf-8'))
        if (previous['test_start'], previous['horizon_hours']) != (report['test_start'], report['horizon_hours']):
            raise ValueError('Comparison requires the same test start and forecast horizon')
        prior_name = previous['selected_model']
        prior_scores = previous['models'][prior_name]['test_by_city']
        shared = [city for city in cities if city in prior_scores]
        lines += ['', '## Comparison with the earlier run', '',
                  f"Earlier run: {len(previous['cities'])} cities, selected model {prior_name}. "
                  f"Expanded run: {len(cities)} cities, selected model {selected_name}. "
                  'Each selection uses its own validation scores. These are descriptive results on the shared 2025 city observations, '
                  'not a test-based model selection or a significance claim.', '',
                  '| City | Earlier temperature MAE (°C) | Expanded temperature MAE (°C) | Earlier rain MAE (mm) | Expanded rain MAE (mm) |',
                  '| --- | ---: | ---: | ---: | ---: |']
        for city in shared:
            old, new = prior_scores[city], selected['test_by_city'][city]
            lines.append(f"| {city} | {old['temperature']['MAE']:.3f} | {new['temperature']['MAE']:.3f} | "
                         f"{old['precipitation_24h']['MAE']:.3f} | {new['precipitation_24h']['MAE']:.3f} |")
    lines += ['', 'All target/model/city scores, both baselines, row counts, parameters and environment versions are in [report.json](report.json).', '',
              '## Local artifacts', '', '| Artifact | Bytes | SHA-256 |', '| --- | ---: | --- |']
    for record in report['models'].values():
        lines.append(f"| {record['artifact']} | {record['artifact_bytes']:,} | `{record['artifact_sha256']}` |")
    lines += ['', f"Artifacts and test predictions are saved in `{source.as_posix()}` and excluded from Git. "
              'Only compact reports and provenance are versioned. See [run instructions](../../../docs/ml-workflow.md). '
              'Reproduce the full holdout scores with `ml.scripts.evaluate` before using a restored artifact.', '',
              f"Recorded environment: Python {report['python']}. Exact package versions are in "
              '[requirements-lock.txt](../../requirements-lock.txt). Different environments or provider revisions may change results.', '',
              '## Limits', '',
              '- This is an offline reanalysis hindcast, not an operational forecast evaluation. ERA5 availability is delayed.',
              '- Scope covers these city grid cells and a 24-hour horizon, not all of India, arbitrary locations, or street-level conditions.',
              '- Hourly errors and overlapping rainfall windows are correlated. No statistical significance or calibrated confidence is claimed.',
              '- Precipitation is an amount, not a rain probability. Extreme-event skill has not been assessed.',
              '- Models are not connected to the website or a live retraining job. The backend ML endpoint remains a placeholder.', '']
    if (source / 'verification.json').exists():
        lines += ['## Verification', '',
                  'See [verification.json](verification.json) for completed checks and '
                  f'[inference_examples.json](inference_examples.json) for historical predictions and actual values for all {len(cities)} cities. '
                  'These examples use the minimum 25-hour observation history and are checked against the stored holdout predictions.', '']
    (output / 'MODEL_CARD.md').write_text('\n'.join(lines), encoding='utf-8')
    return output / 'MODEL_CARD.md'


def make_chart(report, path):
    cities = report['cities']
    selected = report['models'][report['selected_model']]['test_by_city']
    baseline = report['baseline_by_city']['test']['persistence']
    y = np.arange(len(cities))
    fig, axes = plt.subplots(1, 2, figsize=(11, max(5.5, len(cities) * .42 + 1.5)), layout='constrained')
    for axis, target, label in zip(axes, ('temperature', 'precipitation_24h'), ('Temperature MAE (°C)', 'Next-24-hour rain MAE (mm)')):
        axis.barh(y - .19, [selected[c][target]['MAE'] for c in cities], .36, label=report['selected_model'], color='#2563eb')
        axis.barh(y + .19, [baseline[c][target]['MAE'] for c in cities], .36, label='Persistence', color='#94a3b8')
        axis.set_yticks(y, cities)
        axis.invert_yaxis()
        axis.set_xlabel(label)
        axis.set_axisbelow(True)
        axis.grid(axis='x', alpha=.2)
        axis.spines[['top', 'right']].set_visible(False)
    handles, labels = axes[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc='outside lower center', ncols=2, frameon=False)
    fig.suptitle('2025 ERA5 holdout · selected model vs persistence\nLower error is better; offline reanalysis experiment', fontsize=13)
    fig.savefig(path, dpi=160)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model-dir', required=True)
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--compare-report', help='Optional earlier report for descriptive shared-city comparisons')
    args = parser.parse_args()
    print(export_report(args.model_dir, args.output_dir, args.compare_report))


if __name__ == '__main__':
    main()
