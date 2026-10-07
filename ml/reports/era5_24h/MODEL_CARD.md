# ERA5 24-hour model card

Recorded run: 2026-09-28T13:30:30.868346+00:00. Status: **research hindcast**, not deployed.

## Dataset

192,864 hourly records for Pune and Mumbai, 2015-01-01 through 2025-12-31 UTC. All six requested fields have zero missing values. There are 22 validated annual chunks. After the initial 24-hour feature warm-up and final 24-hour target boundary in each city, 192,768 supervised rows remain.

ERA5 was obtained through Open-Meteo with an explicit `models=era5` request, nearest grid cell and no statistical elevation downscaling. It is provider-processed ERA5, not a direct CDS/native GRIB download. Requested coordinates are used as model features; returned grid coordinates describe the source data.

| City | Requested latitude, longitude | Returned ERA5 grid latitude, longitude |
| --- | --- | --- |
| Pune | 18.5204, 73.8567 | 18.5, 73.75 |
| Mumbai | 19.076, 72.8777 | 19.0, 73.0 |

CSV SHA-256: `e4f196f24ef0839f7ea4db27cfc8f52fac7b72384f8a6af37c8e408de73b7583`.

Attribution: Contains modified Copernicus Climate Change Service information; processed by Open-Meteo. [ERA5 dataset DOI](https://doi.org/10.24381/cds.adbb2d47), [Open-Meteo documentation](https://open-meteo.com/en/docs/historical-weather-api), [CC BY 4.0 and API access terms](https://open-meteo.com/en/terms). Full requests, retrieval timestamps, grids, units and raw-response hashes are in [data_manifest.json](data_manifest.json).

## Experiment

43 causal features use observations up to the issue hour: six current variables, geographic coordinates, 1/6/24-hour lags, trailing 6/24-hour means, preceding-day rain, and known target-time calendar encodings. No future imputation or shuffled split is used. Targets are five instantaneous values at +24 hours and total rain over the next 24 hours. Humidity/cloud predictions are bounded to 0–100%; wind/rain to nonnegative values.

| Partition | Available rows | Rows fitted | Issue interval (UTC) |
| --- | ---: | ---: | --- |
| train | 140,160 | 46720 | 2015-01-02T00:00:00+00:00 to 2022-12-30T23:00:00+00:00 |
| validation | 35,040 | evaluation only | 2023-01-01T00:00:00+00:00 to 2024-12-30T23:00:00+00:00 |
| final_train | 175,248 | 58416 | 2015-01-02T00:00:00+00:00 to 2024-12-30T23:00:00+00:00 |
| test | 17,472 | evaluation only | 2025-01-01T00:00:00+00:00 to 2025-12-30T23:00:00+00:00 |

Training fits every third issue hour, retaining both cities; evaluation uses every valid hour. Future targets are purged at partition boundaries. The final fit uses all eligible data through 2024, including the former validation period. Parameters were fixed in advance; no test-based tuning was performed.

**Selected model: lightgbm**, using the lowest 2023–2024 validation temperature RMSE. Selection was kept unchanged after examining the 2025 test results. Random Forest has a slightly lower test error, but the holdout is not used to reselect the model.

## Temperature results

| Model / baseline | Validation RMSE (°C) | Test MAE (°C) | Test RMSE (°C) | Test R² |
| --- | ---: | ---: | ---: | ---: |
| persistence | 0.9965 | 0.6895 | 0.9357 | 0.9468 |
| climatology | 1.5288 | 1.2225 | 1.6647 | 0.8315 |
| random_forest | 0.9581 | 0.6606 | 0.8937 | 0.9514 |
| xgboost | 0.9472 | 0.6672 | 0.8989 | 0.9509 |
| lightgbm | 0.9446 | 0.6647 | 0.8973 | 0.9510 |

Selected-model temperature MAE is 3.6% below persistence on this holdout. This is a descriptive error reduction, not an accuracy percentage or a significance claim.

## Selected-model 2025 results by target

| Target | Units | Model MAE | Persistence MAE | Model RMSE | Persistence RMSE | Model R² |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| temperature | °C | 0.665 | 0.690 | 0.897 | 0.936 | 0.951 |
| humidity | % | 4.154 | 4.451 | 5.806 | 6.377 | 0.913 |
| pressure | hPa | 0.856 | 0.900 | 1.083 | 1.148 | 0.926 |
| wind_speed | km/h | 2.273 | 2.426 | 3.090 | 3.315 | 0.701 |
| cloud_cover | % | 17.033 | 16.124 | 23.939 | 28.956 | 0.694 |
| precipitation_24h | mm over next 24 hours | 3.384 | 3.972 | 9.136 | 11.345 | 0.423 |

**Cloud-cover MAE is worse than persistence**, although RMSE improves. Rainfall errors remain substantial, especially in Mumbai. Results do not establish skill for rare extremes. Complete per-target scores for all models and both baselines are in [report.json](report.json).

| City | Temperature MAE (°C) | Temperature RMSE (°C) | Next-day rain MAE (mm) | Next-day rain RMSE (mm) |
| --- | ---: | ---: | ---: | ---: |
| Pune | 0.745 | 1.004 | 3.001 | 7.566 |
| Mumbai | 0.584 | 0.776 | 3.767 | 10.473 |

## Local artifacts and verification

Artifacts live under `ml/saved_models/era5_24h/` and are excluded from Git. Only compact reports/provenance are committed. A fresh clone needs the download and training commands in the [workflow](../../../docs/ml-workflow.md).

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| random_forest.joblib | 42,453,806 | `f11a377166e6d1cbcae70108eeb16984d3cca782458031f4123bdb8bb3e29caa` |
| xgboost.joblib | 2,046,742 | `7f5a423974c31025696c2cf32a560ebeddcab99a70f1be69ced64c812c658abb` |
| lightgbm.joblib | 1,465,498 | `c515b76f0a6123f685614d178816f1fb096d939d0338fbb7953a595fba54689f` |

Verified: all raw-chunk/dataset/model checksums; 17 ML tests; all models reloaded and every full-holdout metric reproduced; historical CLI inference for Pune and Mumbai. No synthetic samples were used to train these artifacts (unit tests use synthetic fixtures).

Environment: Windows, Python 3.14.7, four CPU threads. Exact dependencies are in [requirements-lock.txt](../../requirements-lock.txt); model parameters and package versions are also embedded in the report. Different platforms, library versions or upstream data revisions may alter results or artifact hashes.

## Limits and intended use

- Offline learning/research for the two evaluated cities and a 24-hour horizon. Not a global, street-level or operational forecast.
- ERA5 is delayed reanalysis. This study does not recreate real-time information availability; live use needs matching recent inputs and an independent operational evaluation.
- No calibrated confidence intervals, rain probabilities, warning system, spatial generalization test, or extreme-event validation.
- Hourly samples and rolling rainfall targets overlap, so errors are temporally correlated. No claim of statistically significant improvement is made.
- The backend ML endpoint is still a placeholder. These artifacts have not been wired into the website, blended with provider forecasts, or put on a retraining schedule.
- No data/model files are automatically uploaded to hosting or GitHub by the training commands.
