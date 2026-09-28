import React from 'react';
import { CurrentWeather } from '@/types';
import { GlassCard } from './GlassCard';
import { Droplets, Wind, Gauge, Sun, Eye, Leaf } from 'lucide-react';
import { getUVLevel, getAQILevel, formatWindSpeed } from '@/utils/format';
import { useUiStore } from '@/store/uiStore';

export const WeatherStats: React.FC<{ current: CurrentWeather }> = ({ current }) => {
  const units = useUiStore((state) => state.units);
  const uv = current.uv_index == null ? null : getUVLevel(current.uv_index);
  const aqi = current.aqi == null ? null : getAQILevel(current.aqi);
  const items = [
    { label: 'Humidity', icon: Droplets, value: `${current.humidity}%` },
    { label: 'Wind', icon: Wind, value: formatWindSpeed(current.wind_speed, units), detail: current.wind_direction == null ? undefined : `Direction: ${current.wind_direction}°` },
    { label: 'Pressure', icon: Gauge, value: current.pressure == null ? '—' : `${current.pressure} hPa` },
    { label: 'UV Index', icon: Sun, value: current.uv_index ?? '—', detail: uv?.label, color: uv?.color },
    { label: 'Visibility', icon: Eye, value: current.visibility == null ? '—' : `${Math.round(current.visibility / 1000)} km` },
    { label: 'AQI', icon: Leaf, value: current.aqi ?? '—', detail: aqi?.label, color: aqi?.color },
  ];
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {items.map(({ label, icon: Icon, value, detail, color }) => <GlassCard key={label} padding="p-4" hover className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-surface-400 mb-1"><Icon className="w-4 h-4" /><span className="text-xs uppercase tracking-wider">{label}</span></div>
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className={`text-xs mt-auto ${color ?? 'text-surface-400'}`}>{value === '—' ? 'Not reported' : detail}</span>
    </GlassCard>)}
  </div>;
};
