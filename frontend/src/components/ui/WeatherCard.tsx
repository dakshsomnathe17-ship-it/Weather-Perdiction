import React from 'react';
import { GlassCard } from './GlassCard';
import { AnimatedNumber } from './AnimatedNumber';
import { CurrentWeather, Location } from '@/types';
import { getWeatherIcon, formatDate } from '@/utils/format';
import { useUiStore } from '@/store/uiStore';
import { MapPin, Droplets, Wind } from 'lucide-react';

interface WeatherCardProps {
  current: CurrentWeather;
  location: Location;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ current, location }) => {
  const units = useUiStore((state) => state.units);
  const isMetric = units === 'metric';

  return (
    <GlassCard className="relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 to-transparent opacity-50 z-0"></div>
      
      <div className="relative z-10 flex flex-col h-full gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-400" />
              {location.name}
            </h2>
            <p className="text-surface-300 text-sm">{location.country}</p>
          </div>
          <p className="text-surface-400 text-xs">{formatDate(new Date())}</p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            <div className="text-6xl font-bold text-white flex items-start">
              <AnimatedNumber value={current.temperature} />
              <span className="text-3xl mt-1 text-surface-200">{isMetric ? '°C' : '°F'}</span>
            </div>
            <p className="text-surface-300 mt-1 capitalize text-lg">
              {current.weather_description}
            </p>
          </div>
          <div className="text-7xl drop-shadow-2xl filter">
            {getWeatherIcon(current.weather_code)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-surface-700/50">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-accent-cyan" />
            <div className="flex flex-col">
              <span className="text-xs text-surface-400">Humidity</span>
              <span className="text-sm font-semibold">{current.humidity}%</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-accent-emerald" />
            <div className="flex flex-col">
              <span className="text-xs text-surface-400">Wind</span>
              <span className="text-sm font-semibold">{current.wind_speed} {isMetric ? 'km/h' : 'mph'}</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
