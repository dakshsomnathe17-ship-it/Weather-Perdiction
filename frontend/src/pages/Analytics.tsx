import { CloudRain, Droplets, ThermometerSun } from 'lucide-react';
import { useWeatherStore } from '@/store/weatherStore';
import { useUiStore } from '@/store/uiStore';
import { useForecast } from '@/hooks/useWeather';
import { WeatherState } from '@/components/ui/WeatherState';
import { WeatherSource } from '@/components/ui/WeatherSource';
import { dayLabel, formatRain, summarizeOutlook } from '@/utils/outlook';
import { formatTemperature } from '@/utils/format';

export function Analytics() {
  const location = useWeatherStore((s) => s.selectedLocation),
    units = useUiStore((s) => s.units);
  const query = useForecast(location?.latitude ?? NaN, location?.longitude ?? NaN),
    days = query.data?.forecast ?? [];
  const summary = summarizeOutlook(days);
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEE THE PATTERNS</span>
          <h1>Your week, understood.</h1>
          <p>
            Forecast insights for {location?.name ?? 'your location'} · {days.length || 7} days
            ahead
          </p>
        </div>
        <span className="pill">Forecast insights</span>
      </div>
      {!summary ? (
        <WeatherState
          label="forecast"
          loading={query.isLoading}
          error={query.isError}
          retry={() => void query.refetch()}
        />
      ) : (
        <>
          {query.isError && (
            <p role="alert" className="inline-notice">
              Refresh failed. Insights use the last retrieved forecast.
            </p>
          )}
          <div className="insight-stats">
            <section className="panel insight-stat">
              <ThermometerSun />
              <span>Warmest day</span>
              <strong>{formatTemperature(summary.warmest.temp_max, units)}</strong>
              <p>{dayLabel(summary.warmest.date, true)}</p>
            </section>
            <section className="panel insight-stat">
              <CloudRain />
              <span>Forecast precipitation</span>
              <strong>{formatRain(summary.totalRain, units)}</strong>
              <p>Total across {days.length} days</p>
            </section>
            <section className="panel insight-stat">
              <Droplets />
              <span>Days with precipitation</span>
              <strong>
                {summary.wetDays}
                <small> / {days.length}</small>
              </strong>
              <p>At least {formatRain(1, units)} per day</p>
            </section>
          </div>
          <div className="forecast-details-grid">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">PRECIPITATION OUTLOOK</span>
                  <h2>When to expect a wetter day</h2>
                  <p>Forecast daily totals · {units === 'metric' ? 'millimetres' : 'inches'}</p>
                </div>
              </div>
              <div className="rain-chart" role="list">
                {days.map((day) => (
                  <div className="rain-chart-row" role="listitem" key={day.date}>
                    <span>{dayLabel(day.date)}</span>
                    <div className="rain-track">
                      <span
                        style={{
                          width: `${(day.precipitation_sum / Math.max(1, summary.wettest.precipitation_sum)) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{formatRain(day.precipitation_sum, units)}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel insight-notes">
              <span className="eyebrow">WHAT STANDS OUT</span>
              <h2>Ahead of the weather</h2>
              <div>
                <ThermometerSun size={21} />
                <p>
                  The forecast ranges from a low of{' '}
                  <strong>{formatTemperature(summary.coolest.temp_min, units)}</strong> to a high of{' '}
                  <strong>{formatTemperature(summary.warmest.temp_max, units)}</strong>.
                </p>
              </div>
              <div>
                <CloudRain size={21} />
                <p>
                  {summary.totalRain > 0 ? (
                    <>
                      <strong>{dayLabel(summary.wettest.date)}</strong> has the highest forecast
                      precipitation, at{' '}
                      <strong>{formatRain(summary.wettest.precipitation_sum, units)}</strong>.
                    </>
                  ) : (
                    'No precipitation is forecast in this daily outlook.'
                  )}
                </p>
              </div>
              <p className="subtle">
                These insights summarize the current provider forecast. Forecasts may change as new
                data arrives.
              </p>
            </section>
          </div>
        </>
      )}
      <WeatherSource updatedAt={query.dataUpdatedAt} />
    </div>
  );
}
