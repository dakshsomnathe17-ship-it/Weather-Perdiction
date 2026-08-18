import React from 'react';
import { GlassCard } from '@/components/ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockHourly = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  temp: 15 + Math.sin(i / 12 * Math.PI) * 10
}));

export const Forecast: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto h-full pb-20">
      <h2 className="text-3xl font-bold text-white mb-2">Detailed Forecast</h2>
      
      <GlassCard className="h-80 w-full" padding="p-6">
        <h3 className="text-xl font-semibold text-white mb-6">24-Hour Temperature</h3>
        <div className="w-full h-[calc(100%-2rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockHourly}>
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Line type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard padding="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Precipitation Probability</h3>
          <div className="h-40 flex items-end gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const height = Math.random() * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-surface-800 rounded-t-sm h-32 relative flex items-end">
                    <div className="w-full bg-accent-cyan rounded-t-sm" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-xs text-surface-400">Day {i+1}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
        
        <GlassCard padding="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Wind Patterns</h3>
          <div className="h-40 flex items-center justify-center text-surface-400">
            Chart Placeholder
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
