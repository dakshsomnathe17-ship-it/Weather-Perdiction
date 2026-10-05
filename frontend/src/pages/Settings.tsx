import { ExternalLink, Globe2, SlidersHorizontal, Database } from 'lucide-react';
import { UnitSwitch } from '@/components/layout/Header';

export function Settings() {
  const hasEsri = Boolean(import.meta.env.VITE_ARCGIS_ACCESS_TOKEN);
  return (
    <div className="page-content settings-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE IT YOURS</span>
          <h1>The details that matter.</h1>
          <p>Your preferences and the data behind your weather.</p>
        </div>
      </div>
      <section className="panel settings-section">
        <h2>
          <SlidersHorizontal size={20} />
          Display preferences
        </h2>
        <div className="setting-row">
          <div>
            <h3>Weather units</h3>
            <p>
              Celsius, km/h and mm, or Fahrenheit, mph and inches.
              <br />
              Your choice is saved on this device.
            </p>
          </div>
          <UnitSwitch />
        </div>
      </section>
      <section className="panel settings-section">
        <h2>
          <Globe2 size={20} />
          Your map
        </h2>
        <div className="setting-row">
          <div>
            <h3>Natural Earth + OpenStreetMap</h3>
            <p>A global Earth view with streets and place names as you zoom in.</p>
          </div>
          <span className="pill">Available</span>
        </div>
        <div className="setting-row">
          <div>
            <h3>Esri satellite imagery</h3>
            <p>
              {hasEsri
                ? 'Satellite imagery can be enabled in the Earth map controls.'
                : 'Satellite imagery becomes available after the project’s ArcGIS access token is configured.'}
            </p>
          </div>
          <span className="pill">{hasEsri ? 'Configured' : 'Not configured'}</span>
        </div>
      </section>
      <section className="panel settings-section">
        <h2>
          <Database size={20} />
          Know your sources
        </h2>
        <div className="setting-row">
          <div>
            <h3>Current weather & daily forecasts</h3>
            <p>
              Provided by Open-Meteo. Current conditions refresh on request; forecast data is cached
              for up to 30 minutes.
            </p>
          </div>
          <a className="text-link" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo <ExternalLink size={14} />
          </a>
        </div>
        <div className="setting-row">
          <div>
            <h3>ERA5 model research</h3>
            <p>
              Historical experiments covering eight Indian cities. Model lab scores are recorded
              evaluation results; these models do not power the live weather forecast.
            </p>
          </div>
        </div>
        <div className="source-links">
          <a
            href="https://www.naturalearthdata.com/about/terms-of-use/"
            target="_blank"
            rel="noreferrer"
          >
            Natural Earth · public domain
          </a>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            © OpenStreetMap contributors
          </a>
        </div>
      </section>
    </div>
  );
}
