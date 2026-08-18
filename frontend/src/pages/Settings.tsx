import React from 'react';
import { GlassCard } from '@/components/ui';
import { useUiStore } from '@/store/uiStore';

export const Settings: React.FC = () => {
  const { units, setUnits } = useUiStore();

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">
      <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>

      <GlassCard padding="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Temperature Units</h4>
              <p className="text-sm text-surface-400">Choose between Celsius and Fahrenheit</p>
            </div>
            <div className="flex bg-surface-800 rounded-lg p-1">
              <button
                onClick={() => setUnits('metric')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${units === 'metric' ? 'bg-primary-500 text-white' : 'text-surface-300 hover:text-white'}`}
              >
                Metric (°C)
              </button>
              <button
                onClick={() => setUnits('imperial')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${units === 'imperial' ? 'bg-primary-500 text-white' : 'text-surface-300 hover:text-white'}`}
              >
                Imperial (°F)
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-6 border-t border-surface-700/50">
            <div>
              <h4 className="text-white font-medium">Theme</h4>
              <p className="text-sm text-surface-400">Select application theme</p>
            </div>
            <select className="bg-surface-800 border border-surface-700 text-white px-4 py-2 rounded-lg outline-none">
              <option value="dark">Dark Theme (Default)</option>
              <option value="light">Light Theme</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard padding="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">About WeatherAI</h3>
        <p className="text-surface-300 text-sm leading-relaxed mb-4">
          WeatherAI combines traditional meteorological data with advanced machine learning models
          to provide highly accurate, hyper-local weather predictions.
        </p>
        <div className="text-xs text-surface-500">
          Version 1.0.0 • © 2026 WeatherAI Inc.
        </div>
      </GlassCard>
    </div>
  );
};
