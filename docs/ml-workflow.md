# ERA5 training and evaluation

The training experiments fit Random Forest, XGBoost, and LightGBM on hourly 2015–2025 ERA5 data. The expanded run covers Pune, Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Hyderabad, and Ahmedabad. Each model predicts six weather quantities 24 hours ahead. The [eight-city model card](../ml/reports/era5_india_8_24h/MODEL_CARD.md) records the expanded results; the [original two-city model card](../ml/reports/era5_24h/MODEL_CARD.md) remains available for comparison.

## Data and attribution

Data comes from the [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api), explicitly requesting `models=era5`. This is ERA5 processed and distributed by Open-Meteo, not a direct CDS download or an archive of native GRIB fields. The API provides converted units and derived fields such as relative humidity and wind speed. We request UTC, the nearest ERA5 grid cell, and `elevation=nan` to disable statistical elevation downscaling. Requested city coordinates and returned grid coordinates are both preserved in the manifest.

Attribution: Contains modified Copernicus Climate Change Service information; processed by Open-Meteo. Source: [ERA5 hourly single-level reanalysis, DOI 10.24381/cds.adbb2d47](https://doi.org/10.24381/cds.adbb2d47). The API data is provided under CC BY 4.0; [Open-Meteo access terms](https://open-meteo.com/en/terms) also apply. The free API is for non-commercial use. Keep this attribution when sharing derived data or results.

Direct [Copernicus CDS access](https://cds.climate.copernicus.eu/how-to-api) requires a personal token and acceptance of the dataset terms. This pipeline uses the documented Open-Meteo route and needs no CDS token. Never commit credentials.

## Run from the repository root

The recorded environment is Windows, Python 3.14.7, four training threads. `ml/requirements-lock.txt` records the exact installed packages, including pytest. The broader `ml/requirements.txt` is unpinned and may produce different results.

PowerShell:

```powershell
python -m venv ml/.venv
& ml/.venv/Scripts/python.exe -m pip install -r ml/requirements-lock.txt
& ml/.venv/Scripts/python.exe -m ml.scripts.download_era5 --cities india --start-date 2015-01-01 --end-date 2025-12-31 --output-dir ml/data/era5_india_8
& ml/.venv/Scripts/python.exe -m ml.scripts.train --data-dir ml/data/era5_india_8 --output-dir ml/saved_models/era5_india_8_24h --jobs 4
& ml/.venv/Scripts/python.exe -m ml.scripts.evaluate --data-dir ml/data/era5_india_8 --model-dir ml/saved_models/era5_india_8_24h
& ml/.venv/Scripts/python.exe -m ml.scripts.predict --history ml/data/era5_india_8/historical_weather.csv --model-dir ml/saved_models/era5_india_8_24h --city Delhi --at 2025-07-15T12:00:00Z
& ml/.venv/Scripts/python.exe -m ml.scripts.export_report --model-dir ml/saved_models/era5_india_8_24h --output-dir ml/reports/era5_india_8_24h --compare-report ml/reports/era5_24h/report.json
& ml/.venv/Scripts/python.exe -m pytest tests/test_ml -q
```

On Linux/macOS, use `ml/.venv/bin/python` after creating the environment. That platform has not been validated for this recorded run. On an existing completed run, skip download/train and use evaluate/predict. For another training run, choose a fresh `--output-dir`; completed reports are protected from overwriting.

The downloader resumes validated yearly JSON chunks, retries temporary provider errors, and fails on incomplete timelines or incorrect units. It writes the CSV plus a manifest containing exact requests, retrieved timestamps, units, grid coordinates, missing-value counts, and SHA-256 hashes. Provider revisions can change a fresh download; retain the original raw cache and manifest to reproduce a recorded dataset.

`--cities india` expands to the eight configured cities listed above, not all locations in India. The CLI defaults still target the original Pune/Mumbai scope in `ml/data/era5` and `ml/saved_models/era5_24h`; explicit directories keep the expanded run separate. New training uses feature contract v2, while the original two-city artifacts retain v1 and its recorded scores. The expanded download reuses the original 22 cached Pune/Mumbai chunks unchanged. The old `ml.scripts.ingest_data` CLI delegates to this downloader; the former unpinned ingestion module is retired.

## Feature and target contract

Each issue hour uses six observed quantities: 2 m temperature (°C), relative humidity (%), mean sea-level pressure (hPa), 10 m wind speed (km/h), cloud cover (%), and preceding-hour precipitation (mm). Features include those current values, coordinates, 1/6/24-hour lags, trailing 6/24-hour means, trailing 24-hour rain, and known target-time hour/season encodings: 43 numeric features.

The model predicts temperature, humidity, pressure, wind speed, and cloud cover at `issue + 24 hours`, plus precipitation accumulated over `(issue, issue + 24 hours]`. Precipitation output is an amount, not a probability.

Cleaning retains separate cities at the same timestamp, rejects conflicting duplicates and invalid coordinates, and marks physically invalid observations as missing. There is no future filling, global median imputation, or quantile-based clipping of observed extremes. Each city is reindexed hourly before lagging. Rows with incomplete features or targets are excluded. A history prediction needs all observations from `issue - 24 hours` through `issue`: 25 consecutive hourly records. Inference uses the same feature code and output bounds as evaluation.

New training runs use feature contract v2: numeric features are rounded to 10 decimal places in both training and inference. This removes rolling-sum roundoff that can otherwise change a tree branch when the same final 25 hours are extracted from a longer history. The precision is stored in each report and model. The evaluator/predictor preserve the original behavior for earlier artifacts without this metadata. The eight-city run was refitted with v2 after detecting this discrepancy; model hyperparameters and data splits were unchanged.

## Evaluation protocol

- Initial training: 2015–2022; validation: 2023–2024; test year: 2025.
- Any training/validation issue whose target reaches the next partition is excluded (24-hour boundary purge). Cities at the same time stay in the same partition.
- Fit every third issue hour with all cities retained; evaluate every usable hour. `--train-stride 1` enables hourly fitting for a new experiment.
- Select the model using validation temperature RMSE; refit each model through 2024, then score 2025. No hyperparameter search or test-based selection was performed.
- Compare with persistence (current instantaneous values and preceding-day rainfall) and training-only city/month/hour climatology.
- Report MAE, RMSE, and R² separately for each target, plus per-city model and baseline scores. Do not average errors with different units or report an unsupported accuracy percentage.

The eight-city experiment keeps the original hyperparameters and date splits. Pune/Mumbai 2025 results were already examined during the earlier experiment, so this expansion is not an independent audit of those two cities. No model is selected or retuned using the expanded test scores.

`ml.scripts.evaluate` verifies the dataset and model checksums, reloads each artifact, recomputes all overall and per-city model metrics, and checks them against the saved report. It does not refit the models. `ml.scripts.export_report` creates a model card and a per-city temperature/rainfall error chart from a completed run after verifying artifact hashes.

## Outputs

| Path | Contents |
| --- | --- |
| `ml/data/era5/raw/` | Cached annual provider responses and request metadata |
| `ml/data/era5/historical_weather.csv` | Combined hourly data |
| `ml/data/era5/manifest.json` | Dataset provenance and hashes |
| `ml/saved_models/era5_24h/*.joblib` | Three fitted multi-output models |
| `ml/saved_models/era5_24h/*_test_predictions.csv` | Actual and predicted 2025 targets |
| `ml/saved_models/era5_24h/report.json` | Parameters, splits, versions, scores, model hashes |
| `ml/reports/era5_24h/` | Versioned report, manifest, and model card for this run |

Raw data and binaries are intentionally ignored by Git. A fresh clone must download/train before evaluation or inference. Load only trusted joblib artifacts; serialization uses pickle. No weekly retraining job or live model integration is installed by this experiment.

The expanded run has the same file layout under `ml/data/era5_india_8/`, `ml/saved_models/era5_india_8_24h/`, and `ml/reports/era5_india_8_24h/`. Both runs are retained.

## Practical limits

ERA5 is reanalysis: these results measure prediction of future reanalysis values using earlier reanalysis values. They are not a historical simulation of real-time data availability. Recent ERA5 data arrives with a delay, so these models cannot supply today's operational forecast from this input source. Live deployment needs a separately validated source with matching units/history and a proper API integration.

These models are evaluated only at the listed city grid cells. They are not validated for arbitrary globe locations, other forecast horizons, extreme-weather warnings, confidence intervals, rain probability, terrain-resolved conditions, or street-level accuracy. Hourly errors and overlapping rain windows are correlated; reported metrics are descriptive, without statistical significance claims. The backend ML endpoint remains a placeholder and does not load these trained artifacts.
