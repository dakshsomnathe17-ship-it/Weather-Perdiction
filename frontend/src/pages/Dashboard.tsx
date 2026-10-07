import { useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe2, RefreshCw, FlaskConical } from 'lucide-react';
import { useWeatherStore } from '@/store/weatherStore';
import { WeatherCard, ForecastCards, WeatherStats, LayerControl } from '@/components/ui';
import { WeatherState } from '@/components/ui/WeatherState';
import { WeatherSource } from '@/components/ui/WeatherSource';
import { Globe } from '@/components/globe';
import { useCurrentWeather, useForecast } from '@/hooks/useWeather';
import { formatCoordinates } from '@/utils/geo';
import { formatTemperature, getWeatherIcon } from '@/utils/format';
import { useUiStore } from '@/store/uiStore';

export function Dashboard() {
  const { selectedLocation: location, setLocation, setWeather, setForecast } = useWeatherStore();
  const units = useUiStore((s) => s.units);
  const lat = location?.latitude ?? NaN,
    lon = location?.longitude ?? NaN;
  const current = useCurrentWeather(lat, lon),
    forecast = useForecast(lat, lon);
  useEffect(() => {
    if (current.data) setWeather(current.data);
  }, [current.data, setWeather]);
  useEffect(() => {
    if (forecast.data) setForecast(forecast.data.forecast, forecast.data.hourly);
  }, [forecast.data, setForecast]);
  const select = useCallback(
    (latitude: number, longitude: number) => {
      setLocation({
        name: formatCoordinates(latitude, longitude),
        country: 'Selected on globe',
        latitude,
        longitude,
      });
    },
    [setLocation],
  );
  const days = forecast.data?.forecast ?? [];
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE EVERYDAY OUTLOOK</span>
          <h1>Your weather, at a glance.</h1>
          <p>Know what’s outside. See what’s coming.</p>
        </div>
        <button
          className="button secondary refresh-button"
          disabled={current.isFetching || forecast.isFetching}
          onClick={() => {
            void current.refetch();
            void forecast.refetch();
          }}
        >
          <RefreshCw size={15} className={current.isFetching ? 'spin' : ''} />
          Refresh weather
        </button>
      </div>
      <div className="overview-grid">
        <div className="conditions-column">
          {current.data && location ? (
            <>
              <WeatherCard current={current.data} location={location} today={days[0]} />
              <WeatherStats current={current.data} today={days[0]} />
              {current.isError && (
                <p role="alert" className="inline-notice">
                  Refresh failed. Showing the last retrieved conditions.
                </p>
              )}
            </>
          ) : (
            <WeatherState
              loading={current.isLoading}
              error={current.isError}
              retry={() => void current.refetch()}
            />
          )}
        </div>
        <section className="map-panel" aria-labelledby="map-heading">
          <div className="panel-heading">
            <div>
              <Globe2 size={17} />
              <h2 id="map-heading">Explore the weather</h2>
            </div>
            <span className="subtle">Interactive Earth</span>
          </div>
          <div className="overview-globe">
            <Globe
              onLocationSelect={select}
              location={location}
              weatherSummary={
                location && (
                  <>
                    <p
                      className="globe-weather-place"
                      title={location.displayName ?? location.name}
                    >
                      {location.name}
                    </p>
                    {current.data ? (
                      <>
                        <p>
                          <strong>{formatTemperature(current.data.temperature, units)}</strong>{' '}
                          <span aria-hidden="true">
                            {getWeatherIcon(current.data.weather_code)}
                          </span>{' '}
                          {current.data.weather_description}
                        </p>
                        {days[0] && (
                          <small>
                            Daily outlook · High {formatTemperature(days[0].temp_max, units)} · Low{' '}
                            {formatTemperature(days[0].temp_min, units)}
                          </small>
                        )}
                      </>
                    ) : current.isError ? (
                      <p>
                        Weather unavailable.{' '}
                        <button onClick={() => current.refetch()}>Retry</button>
                      </p>
                    ) : (
                      <p>Loading local weather…</p>
                    )}
                  </>
                )
              }
            >
              <LayerControl />
            </Globe>
          </div>
        </section>
      </div>
      <section className="panel forecast-panel" aria-labelledby="week-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PLAN YOUR WEEK</span>
            <h2 id="week-heading">{days.length || 7}-day forecast</h2>
          </div>
          <Link className="text-link" to="/forecast">
            Daily details <ArrowRight size={15} />
          </Link>
        </div>
        {days.length ? (
          <ForecastCards forecast={days} />
        ) : (
          <WeatherState
            label="forecast"
            loading={forecast.isLoading}
            error={forecast.isError}
            retry={() => void forecast.refetch()}
          />
        )}
        {forecast.isError && days.length > 0 && (
          <p className="inline-notice" role="alert">
            Refresh failed. Showing the last retrieved forecast.
          </p>
        )}
      </section>
      <div className="overview-footer">
        <WeatherSource updatedAt={current.dataUpdatedAt} />
        <Link to="/ml" className="research-link">
          <FlaskConical size={16} />
          <span>Explore our ERA5 model research</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
