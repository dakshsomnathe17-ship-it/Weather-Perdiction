import { useState } from 'react';
import { ArrowUpRight, FlaskConical, Check, Database } from 'lucide-react';
import report from '@/data/model-evaluation.json';

const modelNames: Record<string, string> = {
  random_forest: 'Random Forest',
  xgboost: 'XGBoost',
  lightgbm: 'LightGBM',
};
const targets = [
  ['temperature', 'Temperature', '°C'],
  ['humidity', 'Humidity', '%'],
  ['pressure', 'Pressure', 'hPa'],
  ['wind_speed', 'Wind speed', 'km/h'],
  ['cloud_cover', 'Cloud cover', '%'],
  ['precipitation_24h', 'Next 24h precipitation', 'mm'],
] as const;
const modelCard = `https://github.com/dakshsomnathe17-ship-it/Weather-Perdiction/blob/${report.sourceCommit}/${report.sourcePath.replace(/report\.json$/, 'MODEL_CARD.md')}`;
const exampleTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
    hour12: false,
  }).format(new Date(value));

export function MLDashboard() {
  const [city, setCity] = useState(report.cities[0]);
  const [cityFilter, setCityFilter] = useState('');
  const selected = report.models.find((m) => m.id === report.selectedModel)!;
  const selectedName = modelNames[selected.id];
  const example = report.examples.find((e) => e.city === city)!;
  const visibleCities = report.cities.filter((name) =>
    name.toLowerCase().includes(cityFilter.trim().toLowerCase()),
  );
  const scoreScale =
    Math.max(0.1, ...Object.values(selected.cities).map((scores) => scores.temperature.MAE)) * 1.1;
  const worseTargets = targets
    .filter(([key]) => selected.test[key].MAE > report.baseline[key].MAE)
    .map(([, label]) => label.toLowerCase());
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE SCIENCE BEHIND THE EXPERIMENT</span>
          <h1>Weather, with a learning curve.</h1>
          <p>
            ERA5 research · {report.cities.length} Indian cities · {report.horizon}-hour prediction
            horizon
          </p>
        </div>
        <span className="pill research-pill">
          <FlaskConical size={14} />
          Historical evaluation
        </span>
      </div>
      <div className="research-notice">
        <FlaskConical size={22} />
        <div>
          <strong>Research models, evaluated on the past.</strong>
          <p>
            These scores compare predictions with ERA5 reanalysis in 2025. The website’s current
            weather and forecast come from Open-Meteo; these models are not serving live
            predictions.
          </p>
        </div>
      </div>
      <div className="research-facts">
        <span>
          <Database size={17} />
          <strong>{report.rawRows.toLocaleString('en')}</strong> hourly records
        </span>
        <span>
          <strong>2015–2022</strong> initial training
        </span>
        <span>
          <strong>2023–2024</strong> validation
        </span>
        <span>
          <strong>2025</strong> evaluation
        </span>
      </div>
      <div className="model-grid">
        {report.models.map((model) => (
          <section
            key={model.id}
            className={`panel model-card ${model.id === report.selectedModel ? 'chosen' : ''}`}
          >
            <div>
              <span className="eyebrow">24-HOUR MODEL</span>
              {model.id === report.selectedModel && (
                <span className="pill">
                  <Check size={13} />
                  Selected
                </span>
              )}
            </div>
            <h2>{modelNames[model.id]}</h2>
            <strong className="model-score">
              {model.test.temperature.MAE.toFixed(3)}
              <span> °C</span>
            </strong>
            <p>Temperature mean absolute error</p>
            <dl>
              <div>
                <dt>Test RMSE</dt>
                <dd>{model.test.temperature.RMSE.toFixed(3)} °C</dd>
              </div>
              <div>
                <dt>Validation RMSE</dt>
                <dd>{model.validationRMSE.toFixed(3)} °C</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>
      <p className="subtle">
        Lower error is better. {selectedName} was selected using validation temperature RMSE, then
        refitted through 2024. Persistence temperature MAE:{' '}
        {report.baseline.temperature.MAE.toFixed(3)} °C. Research metrics retain their original
        units.
      </p>
      <div className="lab-results-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{selectedName.toUpperCase()} · 2025</span>
              <h2>Error by city</h2>
              <p>Temperature mean absolute error in °C</p>
            </div>
          </div>
          <label className="city-filter">
            Find a city
            <input
              type="search"
              aria-label="Filter evaluated cities"
              placeholder="Search evaluated cities"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </label>
          <p className="city-filter-count" role="status">
            {visibleCities.length} of {report.cities.length} evaluated cities
          </p>
          <div className="city-scores">
            {visibleCities.map((name) => {
              const score = selected.cities[name as keyof typeof selected.cities].temperature.MAE;
              return (
                <div key={name}>
                  <span>{name}</span>
                  <div className="score-track">
                    <span style={{ width: `${(score / scoreScale) * 100}%` }} />
                  </div>
                  <strong>{score.toFixed(3)}°</strong>
                </div>
              );
            })}
          </div>
          {!visibleCities.length && (
            <p className="subtle">No evaluated cities match. Try another city name.</p>
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{selectedName.toUpperCase()} VS PERSISTENCE</span>
              <h2>Across weather variables</h2>
              <p>2025 mean absolute error · lower is better</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="weather-table">
              <thead>
                <tr>
                  <th scope="col">Variable</th>
                  <th scope="col">Model</th>
                  <th scope="col">Baseline</th>
                </tr>
              </thead>
              <tbody>
                {targets.map(([key, label, unit]) => (
                  <tr key={key}>
                    <th scope="row">
                      {label}
                      <small>{unit}</small>
                    </th>
                    <td>{selected.test[key].MAE.toFixed(2)}</td>
                    <td>{report.baseline[key].MAE.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-note">
            {worseTargets.length > 0 && (
              <>Higher MAE than persistence: {worseTargets.join(', ')}. </>
            )}
            Performance varies by variable and location.
          </p>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">RECORDED EXAMPLE · {selectedName.toUpperCase()}</span>
            <h2>A past prediction, revisited</h2>
            <p>
              Issued {exampleTime(example.issue_time)} UTC · Valid {exampleTime(example.valid_time)}{' '}
              UTC
            </p>
          </div>
          <div className="city-select">
            <label htmlFor="research-city">City</label>
            <select id="research-city" value={city} onChange={(e) => setCity(e.target.value)}>
              {report.cities.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="example-grid">
          {targets.map(([key, label, unit]) => (
            <div key={key}>
              <span>{label}</span>
              <strong>
                {example.predictions[key].toFixed(1)} <small>{unit}</small>
              </strong>
              <p>
                ERA5 actual: {example.actual_at_valid_time[key].toFixed(1)} {unit}
              </p>
            </div>
          ))}
        </div>
        <p className="table-note">
          Precipitation is the sum over the next 24 hours. Other variables are evaluated at the
          valid time. This is one historical example, not a live forecast.
        </p>
      </section>
      <div className="research-footer">
        <p>
          Contains modified Copernicus Climate Change Service information; ERA5 processed by
          Open-Meteo.{' '}
          <a href="https://doi.org/10.24381/cds.adbb2d47" target="_blank" rel="noreferrer">
            ERA5 dataset
          </a>{' '}
          ·{' '}
          <a href="https://open-meteo.com/en/terms" target="_blank" rel="noreferrer">
            Attribution & terms
          </a>
        </p>
        <a className="text-link" href={modelCard} target="_blank" rel="noreferrer">
          Method, limitations & full report <ArrowUpRight size={15} />
        </a>
      </div>
    </div>
  );
}
