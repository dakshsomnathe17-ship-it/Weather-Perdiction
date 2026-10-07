import { Link } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import type { ForecastDay } from '@/types';
import { formatTemperature } from '@/utils/format';
import { dayLabel, formatRain } from '@/utils/outlook';
import { useUiStore } from '@/store/uiStore';
import { WeatherSymbol } from './WeatherSymbol';

export function ForecastCards({ forecast }: { forecast: ForecastDay[] }) {
  const units = useUiStore((s) => s.units);
  return (
    <div className="forecast-strip">
      {forecast.map((day) => (
        <Link
          className="forecast-day"
          key={day.date}
          to={`/forecast?day=${day.date}`}
          aria-label={`${dayLabel(day.date, true)}: ${day.weather_description}, high ${formatTemperature(day.temp_max, units)}, low ${formatTemperature(day.temp_min, units)}`}
        >
          <span className="forecast-date">{dayLabel(day.date)}</span>
          <WeatherSymbol code={day.weather_code} size={34} />
          <span className="forecast-temperatures">
            <strong>{formatTemperature(day.temp_max, units)}</strong>
            <span>{formatTemperature(day.temp_min, units)}</span>
          </span>
          <span className="forecast-condition">{day.weather_description}</span>
          <span className="forecast-rain">
            <Droplets size={12} />
            {formatRain(day.precipitation_sum, units)}
          </span>
        </Link>
      ))}
    </div>
  );
}
