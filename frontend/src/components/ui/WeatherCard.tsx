import type { CurrentWeather, ForecastDay, Location } from '@/types';
import { formatTemperature } from '@/utils/format';
import { useUiStore } from '@/store/uiStore';
import { ArrowDown, ArrowUp, MapPin } from 'lucide-react';
import { WeatherSymbol } from './WeatherSymbol';

export function WeatherCard({
  current,
  location,
  today,
}: {
  current: CurrentWeather;
  location: Location;
  today?: ForecastDay;
}) {
  const units = useUiStore((s) => s.units);
  return (
    <section
      className={`weather-hero ${current.weather_code >= 51 ? 'rainy' : ''}`}
      aria-label="Current weather"
    >
      <div className="hero-cloud cloud-one" />
      <div className="hero-cloud cloud-two" />
      <div className="hero-top">
        <span className="eyebrow">CURRENT WEATHER</span>
        <span className="pill">
          <span className="source-dot" />
          Current conditions
        </span>
      </div>
      <div className="hero-location">
        <h2>{location.name}</h2>
        <p>
          <MapPin size={13} />
          {[location.state, location.country].filter(Boolean).join(', ')}
        </p>
      </div>
      <div className="hero-temperature">
        <strong>{formatTemperature(current.temperature, units)}</strong>
        <WeatherSymbol code={current.weather_code} size={96} night={current.is_day === false} />
      </div>
      <p className="hero-condition">{current.weather_description}</p>
      <div className="hero-bottom">
        <span>
          Feels like <strong>{formatTemperature(current.feels_like, units)}</strong>
        </span>
        {today && (
          <span className="high-low">
            <ArrowUp size={14} />
            {formatTemperature(today.temp_max, units)}
            <ArrowDown size={14} />
            {formatTemperature(today.temp_min, units)}
          </span>
        )}
      </div>
    </section>
  );
}
