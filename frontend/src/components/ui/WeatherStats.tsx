import React from 'react';
import { CurrentWeather } from '@/types';
import { GlassCard } from './GlassCard';
import { Droplets, Wind, Gauge, Sun, Eye, Leaf } from 'lucide-react';
import { getUVLevel, getAQILevel, formatWindSpeed } from '@/utils/format';
import { useUiStore } from '@/store/uiStore';

export const WeatherStats: React.FC<{ current: CurrentWeather }> = ({ current }) => {
  const units = useUiStore((state) => state.units);
  const uv = getUVLevel(current.uv_index);
  const aqi = getAQILevel(current.aqi || 50);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <GlassCard padding="p-4" hover className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-surface-400 mb-1">
          <Droplets className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Humidity</span>
        </div>
        <span className="text-2xl font-bold text-white">{current.humidity}%</span>
        <div className="w-full bg-surface-800 h-1.5 rounded-full mt-auto">
          <div className="bg-accent-cyan h-1.5 rounded-full" style={{ width: `${current.humidity}%` }} />
        </div>
      </GlassCard>

      <GlassCard padding="p-4" hover className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-surface-400 mb-1">
          <Wind className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Wind</span>
        </div>
        <span className="text-2xl font-bold text-white">{formatWindSpeed(current.wind_speed, units)}</span>
        <span className="text-xs text-surface-400 mt-auto">Direction: {current.wind_direction}°</span>
      </GlassCard>

      <GlassCard padding="p-4" hover className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-surface-400 mb-1">
          <Gauge className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Pressure</span>
        </div>
        <span className="text-2xl font-bold text-white">{current.pressure} hPa</span>
      </GlassCard>

      <GlassCard padding="p-4" hover className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-surface-400 mb-1">
          <Sun className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">UV Index</span>
        </div>
        <span className="text-2xl font-bold text-white">{current.uv_index}</span>
        <span className={`text-xs mt-auto font-medium ${uv.color}`}>{uv.label}</span>
      </GlassCard>

      <GlassCard padding="p-4" hover className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-surface-400 mb-1">
          <Eye className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Visibility</span>
        </div>
        <span className="text-2xl font-bold text-white">{Math.round(current.visibility / 1000)} km</span>
      </GlassCard>

      <GlassCard padding="p-4" hover className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-surface-400 mb-1">
          <Leaf className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">AQI</span>
        </div>
        <span className="text-2xl font-bold text-white">{current.aqi || 50}</span>
        <span className={`text-xs mt-auto font-medium ${aqi.color}`}>{aqi.label}</span>
      </GlassCard>
    </div>
  );
};
