import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Droplets } from 'lucide-react';
import { useWeatherStore } from '@/store/weatherStore';
import { useUiStore } from '@/store/uiStore';
import { useForecast } from '@/hooks/useWeather';
import { WeatherState } from '@/components/ui/WeatherState';
import { WeatherSource } from '@/components/ui/WeatherSource';
import { WeatherSymbol } from '@/components/ui/WeatherSymbol';
import { ForecastChart } from '@/components/ui/ForecastChart';
import { dayLabel, formatRain } from '@/utils/outlook';
import { formatTemperature } from '@/utils/format';

export function Forecast() {
  const location = useWeatherStore((s) => s.selectedLocation),
    units = useUiStore((s) => s.units);
  const query = useForecast(location?.latitude ?? NaN, location?.longitude ?? NaN);
  const [params, setParams] = useSearchParams();
  const days = query.data?.forecast ?? [],
    selected = days.find((d) => d.date === params.get('day')) ?? days[0];
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE PLANNING GOES A LONG WAY</span>
          <h1>The days ahead.</h1>
          <p>{location?.name ?? 'Your location'} · Daily forecast in local calendar dates</p>
        </div>
        <span className="pill">
          <CalendarDays size={14} />
          {days.length || 7}-day outlook
        </span>
      </div>
      {!days.length ? (
        <WeatherState
          label="forecast"
          loading={query.isLoading}
          error={query.isError}
          retry={() => void query.refetch()}
        />
      ) : (
        <>
          {query.isError && (
            <p className="inline-notice" role="alert">
              Refresh failed. Showing the last retrieved forecast.
            </p>
          )}
          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">TEMPERATURE TREND</span>
                <h2>A view of the week</h2>
              </div>
              <div className="chart-legend">
                <span>
                  <i className="warm-dot" />
                  Daily high
                </span>
                <span>
                  <i className="cool-dot" />
                  Daily low
                </span>
              </div>
            </div>
            <ForecastChart days={days} />
          </section>
          <div className="forecast-details-grid">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Daily forecast</h2>
                  <p>Select a day for a closer look.</p>
                </div>
              </div>
              <div className="daily-list">
                {days.map((day) => (
                  <button
                    className={`daily-row ${selected.date === day.date ? 'selected' : ''}`}
                    aria-pressed={selected.date === day.date}
                    key={day.date}
                    onClick={() => setParams({ day: day.date }, { replace: true })}
                  >
                    <span>{dayLabel(day.date)}</span>
                    <WeatherSymbol code={day.weather_code} size={25} />
                    <span className="daily-description">{day.weather_description}</span>
                    <strong>
                      {formatTemperature(day.temp_max, units)}{' '}
                      <span className="subtle">/ {formatTemperature(day.temp_min, units)}</span>
                    </strong>
                    <span className="rain-value">
                      <Droplets size={12} />
                      {formatRain(day.precipitation_sum, units)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <section className="panel day-detail" aria-label="Selected day details">
              <span className="eyebrow">A CLOSER LOOK</span>
              <h2>{dayLabel(selected.date, true)}</h2>
              <WeatherSymbol code={selected.weather_code} size={66} />
              <h3>{selected.weather_description}</h3>
              <dl>
                <div>
                  <dt>High</dt>
                  <dd>{formatTemperature(selected.temp_max, units)}</dd>
                </div>
                <div>
                  <dt>Low</dt>
                  <dd>{formatTemperature(selected.temp_min, units)}</dd>
                </div>
                <div>
                  <dt>Precipitation total</dt>
                  <dd>{formatRain(selected.precipitation_sum, units)}</dd>
                </div>
              </dl>
              <p className="subtle">
                Daily totals describe the full day. They don’t indicate the timing or probability of
                rain.
              </p>
            </section>
          </div>
        </>
      )}
      <WeatherSource updatedAt={query.dataUpdatedAt} />
    </div>
  );
}
