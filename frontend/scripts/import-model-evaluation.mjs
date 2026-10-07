// Import only completed, verified research reports; this never runs live inference.
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [directory, sourceCommit] = process.argv.slice(2);
if (!directory || !/^[a-f0-9]{40}$/.test(sourceCommit ?? '')) {
  throw new Error(
    'Usage: node scripts/import-model-evaluation.mjs <report-directory> <source-commit-sha>',
  );
}
const read = async (name) => JSON.parse(await readFile(resolve(directory, name), 'utf8'));
const [report, verification, examples] = await Promise.all(
  ['report.json', 'verification.json', 'inference_examples.json'].map(read),
);
const sameSet = (a, b) =>
  a.length === b.length && new Set(a).size === a.length && a.every((value) => b.includes(value));
const models = Object.entries(report.models);
if (
  report.status !== 'research_hindcast' ||
  !report.finished_at ||
  report.horizon_hours !== 24 ||
  report.dataset_sha256 !== verification.dataset_sha256 ||
  !verification.reproduced_all_overall_and_city_model_metrics ||
  !verification.fixed_hyperparameters_match_protocol ||
  !sameSet(
    models.map(([id]) => id),
    verification.model_artifact_hashes_verified,
  ) ||
  !sameSet(
    models.map(([id]) => id),
    verification.minimum_history_inference_verified_models,
  ) ||
  !sameSet(report.cities, verification.minimum_history_inference_verified_cities) ||
  !sameSet(
    report.cities,
    examples.map((example) => example.city),
  )
) {
  throw new Error('The report must be complete and verified for every model and city.');
}
const selected = models.reduce((best, item) =>
  item[1].validation.temperature.RMSE < best[1].validation.temperature.RMSE ? item : best,
)[0];
if (selected !== report.selected_model)
  throw new Error('Selected model does not match validation RMSE.');
for (const [id, model] of models) {
  if (!sameSet(Object.keys(model.test_by_city), report.cities))
    throw new Error(`Missing city scores: ${id}`);
  for (const target of Object.keys(report.targets)) {
    if (
      !Number.isFinite(model.test[target].MAE) ||
      !Number.isFinite(report.baselines.test.persistence[target].MAE)
    )
      throw new Error(`Invalid target scores: ${target}`);
  }
}
for (const example of examples) {
  if (
    example.model !== selected ||
    example.status !== 'research_hindcast' ||
    Date.parse(example.valid_time) - Date.parse(example.issue_time) !== 24 * 60 * 60 * 1000
  ) {
    throw new Error(`Invalid historical example: ${example.city}`);
  }
  for (const target of Object.keys(report.targets)) {
    if (
      !Number.isFinite(example.predictions[target]) ||
      !Number.isFinite(example.actual_at_valid_time[target])
    )
      throw new Error(`Incomplete historical example: ${example.city}`);
  }
}
const snapshot = {
  sourceCommit,
  sourcePath: `ml/reports/${basename(resolve(directory))}/report.json`,
  createdAt: report.finished_at,
  status: report.status,
  source: report.source,
  rawRows: report.raw_rows,
  horizon: report.horizon_hours,
  cities: report.cities,
  selectedModel: selected,
  models: models.map(([id, model]) => ({
    id,
    validationRMSE: model.validation.temperature.RMSE,
    test: model.test,
    cities: model.test_by_city,
  })),
  baseline: report.baselines.test.persistence,
  examples,
};
const destination = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/data/model-evaluation.json',
);
await writeFile(destination, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Imported verified ${snapshot.cities.length}-city report: ${snapshot.sourcePath}`);
