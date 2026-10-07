import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ForecastDay } from '@/types';
import { useUiStore } from '@/store/uiStore';
import { dayLabel } from '@/utils/outlook';

export function ForecastChart({ days }: { days: ForecastDay[] }) {
  const units = useUiStore((s) => s.units),
    unit = units === 'metric' ? '°C' : '°F';
  const convert = (v: number) => Math.round(units === 'metric' ? v : (v * 9) / 5 + 32);
  const data = days.map((d) => ({
    date: dayLabel(d.date),
    High: convert(d.temp_max),
    Low: convert(d.temp_min),
  }));
  return (
    <div
      className="forecast-chart"
      role="img"
      aria-label={`Daily high and low temperatures in ${unit}. Exact values are listed in the daily forecast below.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 16, bottom: 0, left: -20 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id="temperature-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4bd72" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#f4bd72" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ffffff0d" strokeDasharray="4 5" />
          <XAxis
            dataKey="date"
            stroke="#99aac2"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            minTickGap={24}
            dy={8}
          />
          <YAxis
            stroke="#99aac2"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}°`}
            domain={['dataMin - 3', 'dataMax + 3']}
          />
          <Tooltip
            contentStyle={{
              background: '#18273c',
              border: '1px solid #344761',
              borderRadius: 12,
              color: '#f4f7fb',
              fontSize: 13,
            }}
            formatter={(value: number, name: string) => [`${value}${unit}`, name]}
          />
          <Area
            dataKey="High"
            type="monotone"
            stroke="#f4bd72"
            strokeWidth={2.5}
            fill="url(#temperature-fill)"
            isAnimationActive={false}
            dot={{ r: 4, fill: '#f4bd72', stroke: '#172337', strokeWidth: 2 }}
          />
          <Line
            dataKey="Low"
            type="monotone"
            stroke="#81b7eb"
            strokeWidth={2}
            strokeDasharray="5 4"
            isAnimationActive={false}
            dot={{ r: 3, fill: '#81b7eb', strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
