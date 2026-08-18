import React from 'react';
import { GlassCard } from '@/components/ui';
import { BrainCircuit, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export const MLDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-primary-400" />
          AI Models
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['Random Forest', 'XGBoost', 'LightGBM'].map((model, i) => (
          <GlassCard key={i} padding="p-6" hover>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">{model}</h3>
              {i === 0 ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-surface-400 bg-surface-800 px-2 py-1 rounded-full">
                  <AlertCircle className="w-3 h-3" /> Standby
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-xs text-surface-400 block">MAE</span>
                <span className="text-lg font-bold text-white">1.24</span>
              </div>
              <div>
                <span className="text-xs text-surface-400 block">RMSE</span>
                <span className="text-lg font-bold text-white">1.56</span>
              </div>
              <div>
                <span className="text-xs text-surface-400 block">R² Score</span>
                <span className="text-lg font-bold text-white">0.92</span>
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors">
              <Play className="w-4 h-4" /> Train Model
            </button>
          </GlassCard>
        ))}
      </div>

      <GlassCard padding="p-6" className="mt-6">
        <h3 className="text-xl font-semibold text-white mb-6">Prediction Playground</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm text-surface-300 mb-1">Target Date</label>
              <input type="date" className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-2 text-white outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm text-surface-300 mb-1">Location Coordinates</label>
              <input type="text" placeholder="e.g. 37.7749, -122.4194" className="w-full bg-surface-900 border border-surface-700 rounded-lg px-4 py-2 text-white outline-none focus:border-primary-500" />
            </div>
            <button className="px-6 py-2 bg-accent-violet hover:bg-violet-400 text-white font-medium rounded-lg transition-colors">
              Generate Prediction
            </button>
          </div>
          <div className="flex-1 bg-surface-900/50 rounded-xl border border-surface-700 p-6 flex items-center justify-center text-surface-500">
            Results will appear here
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
