import React, { useCallback, useEffect } from 'react';
import { useWeatherStore } from '@/store/weatherStore';
import { SearchBar, WeatherCard, ForecastCards, WeatherStats, LayerControl } from '@/components/ui';
import { Globe } from '@/components/globe';
import { useCurrentWeather, useForecast } from '@/hooks/useWeather';
import { formatCoordinates } from '@/utils/geo';
import { formatTemperature, getWeatherIcon } from '@/utils/format';
import { useUiStore } from '@/store/uiStore';

export const Dashboard: React.FC = () => {
  const { selectedLocation, setLocation, setWeather, setForecast } = useWeatherStore();
  const units = useUiStore((s) => s.units);
  const lat = selectedLocation?.latitude ?? NaN;
  const lon = selectedLocation?.longitude ?? NaN;
  const current = useCurrentWeather(lat, lon);
  const forecast = useForecast(lat, lon);
  useEffect(() => { if (current.data) setWeather(current.data); }, [current.data, setWeather]);
  useEffect(() => { if (forecast.data) setForecast(forecast.data.forecast, forecast.data.hourly); }, [forecast.data, setForecast]);
  const select = useCallback((latitude: number, longitude: number) => {
    setLocation({ name: formatCoordinates(latitude, longitude), country: 'Selected on globe', latitude, longitude });
  }, [setLocation]);
  return (
    <div className="flex flex-col lg:flex-row min-h-full lg:h-full gap-6 relative">
      <div className="w-full lg:w-3/5 min-h-[360px] h-[55vh] lg:h-full relative rounded-2xl overflow-hidden glass z-10 shrink-0 lg:shrink">
        <Globe onLocationSelect={select} location={selectedLocation} weatherSummary={selectedLocation && <>
          <p className="globe-weather-place" title={selectedLocation.displayName ?? selectedLocation.name}>{selectedLocation.name}</p>
          {current.data ? <>
            <p><strong>{formatTemperature(current.data.temperature, units)}</strong> <span aria-hidden="true">{getWeatherIcon(current.data.weather_code)}</span> {current.data.weather_description}</p>
            {forecast.data?.forecast[0] && <small>Today · High {formatTemperature(forecast.data.forecast[0].temp_max, units)} · Low {formatTemperature(forecast.data.forecast[0].temp_min, units)}</small>}
          </> : current.isError ? <p>Weather unavailable. <button onClick={() => current.refetch()}>Retry</button></p> : <p>Loading local weather…</p>}
        </>}><LayerControl /></Globe>
      </div>
      <div className="w-full lg:w-2/5 min-w-0 flex flex-col gap-6 lg:overflow-y-auto lg:pr-2 scrollbar-hide z-20 [&>*]:shrink-0">
        <div className="sticky top-0 z-30 pt-1 pb-4 bg-surface-950/80 backdrop-blur-sm"><SearchBar /></div>
        {selectedLocation && <p className="text-sm text-surface-300" data-testid="selected-location">{selectedLocation.name}{selectedLocation.name !== formatCoordinates(lat, lon) && ` · ${formatCoordinates(lat, lon)}`}</p>}
        {current.isLoading && <p role="status" className="text-surface-300">Loading weather for this location…</p>}
        {current.isError && <div role="alert" className="text-surface-300">Weather is unavailable for this location. Check that the weather service is running. <button className="text-primary-400 underline" onClick={() => current.refetch()}>Retry weather</button></div>}
        {current.data && selectedLocation && <>
          <WeatherCard key={`${lat}:${lon}`} current={current.data} location={selectedLocation} />
          <h3 className="text-white font-semibold text-lg">Current Conditions</h3>
          <WeatherStats current={current.data} />
        </>}
        {forecast.isLoading && <p role="status" className="text-surface-300">Loading forecast…</p>}
        {forecast.isError && <p role="alert" className="text-surface-300">Forecast unavailable. <button className="text-primary-400 underline" onClick={() => forecast.refetch()}>Retry forecast</button></p>}
        {forecast.data && <div className="flex flex-col gap-3 pb-8">
          <h3 className="text-white font-semibold text-lg">7-Day Forecast</h3>
          <ForecastCards forecast={forecast.data.forecast} />
        </div>}
      </div>
    </div>
  );
};
