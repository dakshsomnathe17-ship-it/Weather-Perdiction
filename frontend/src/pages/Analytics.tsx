import React from 'react';
import { GlassCard } from '@/components/ui';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const mockData = Array.from({ length: 30 }).map((_, i) => ({
  day: i + 1,
  temp: 20 + Math.random() * 10,
  rain: Math.random() * 20
}));

export const Analytics: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
      <h2 className="text-3xl font-bold text-white mb-2">Weather Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <GlassCard padding="p-6" glow>
          <span className="text-surface-400 text-sm">Avg Temperature (30d)</span>
          <div className="text-3xl font-bold text-white mt-2">24.5°C</div>
        </GlassCard>
        <GlassCard padding="p-6">
          <span className="text-surface-400 text-sm">Total Rainfall (30d)</span>
          <div className="text-3xl font-bold text-white mt-2">142 mm</div>
        </GlassCard>
        <GlassCard padding="p-6">
          <span className="text-surface-400 text-sm">Sunny Days</span>
          <div className="text-3xl font-bold text-white mt-2">18 Days</div>
        </GlassCard>
      </div>

      <GlassCard className="h-[400px]" padding="p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Temperature Trends</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
            <Area type="monotone" dataKey="temp" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTemp)" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
};
