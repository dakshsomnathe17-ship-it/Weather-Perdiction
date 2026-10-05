import { CloudRain, Droplets, Thermometer, Wind } from 'lucide-react';
import type { CurrentWeather, ForecastDay } from '@/types';
import { useUiStore } from '@/store/uiStore';
import { formatTemperature, formatWindSpeed } from '@/utils/format';
import { formatRain } from '@/utils/outlook';

export function WeatherStats({ current, today }: { current: CurrentWeather; today?: ForecastDay }) {
  const units = useUiStore((s) => s.units);
  const stats = [
    {
      label: 'Humidity',
      value: `${current.humidity}%`,
      detail: 'Relative humidity',
      icon: Droplets,
    },
    {
      label: 'Wind',
      value: formatWindSpeed(current.wind_speed, units),
      detail: 'At 10 m above ground',
      icon: Wind,
    },
    {
      label: 'Feels like',
      value: formatTemperature(current.feels_like, units),
      detail: 'Apparent temperature',
      icon: Thermometer,
    },
    {
      label: 'Daily precipitation',
      value: today ? formatRain(today.precipitation_sum, units) : '—',
      detail: 'Forecast total · first day',
      icon: CloudRain,
    },
  ];
  return (
    <div className="weather-stats">
      {stats.map(({ label, value, detail, icon: Icon }) => (
        <section className="stat-tile" key={label}>
          <div>
            <Icon size={17} />
            <h3>{label}</h3>
          </div>
          <strong>{value}</strong>
          <p>{detail}</p>
        </section>
      ))}
    </div>
  );
}
