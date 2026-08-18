import React from 'react';
import { ForecastDay } from '@/types';
import { formatTemperature, getWeatherIcon, formatDate } from '@/utils/format';
import { useUiStore } from '@/store/uiStore';
import { GlassCard } from './GlassCard';

export const ForecastCards: React.FC<{ forecast: ForecastDay[] }> = ({ forecast }) => {
  const units = useUiStore((state) => state.units);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
      {forecast.map((day, idx) => (
        <GlassCard 
          key={idx} 
          hover 
          padding="p-4" 
          className="snap-start min-w-[120px] flex flex-col items-center justify-between gap-3 shrink-0"
        >
          <span className="text-sm text-surface-300 font-medium">
            {idx === 0 ? 'Today' : formatDate(day.date, 'EEE')}
          </span>
          <span className="text-4xl my-2">{getWeatherIcon(day.weather_code)}</span>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">{formatTemperature(day.temp_max, units)}</span>
            <span className="text-surface-400 font-medium">{formatTemperature(day.temp_min, units)}</span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};
