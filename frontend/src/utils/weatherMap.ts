
import { isValidCoordinate } from './geo';

export interface WeatherMapPoint { lat: number; lon: number; value: number; }
export interface WeatherMapData { layer: string; points: WeatherMapPoint[]; }
export const LAYER_SCALES: Record<string, { min: number; max: number; unit: string; low: string; high: string }> = {
  temperature: { min: -30, max: 45, unit: '°C', low: '#2563eb', high: '#ef4444' },
  rainfall: { min: 0, max: 30, unit: 'mm', low: '#bae6fd', high: '#4338ca' },
  clouds: { min: 0, max: 100, unit: '%', low: '#64748b', high: '#ffffff' },
  humidity: { min: 0, max: 100, unit: '%', low: '#fef3c7', high: '#0891b2' },
  wind: { min: 0, max: 100, unit: 'km/h', low: '#a7f3d0', high: '#7c3aed' },
  pressure: { min: 960, max: 1040, unit: 'hPa', low: '#a855f7', high: '#fbbf24' },
  uv: { min: 0, max: 12, unit: 'UV', low: '#84cc16', high: '#db2777' },
  aqi: { min: 0, max: 300, unit: 'AQI', low: '#22c55e', high: '#991b1b' },
};
export function validMapPoints(points: unknown): WeatherMapPoint[] {
  if (!Array.isArray(points)) return [];
  return points.filter((p): p is WeatherMapPoint => p !== null && typeof p === 'object'
    && isValidCoordinate(p.lat, p.lon) && Number.isFinite(p.value));
}
export function layerColor(layer: string, value: number): string {
  const scale = LAYER_SCALES[layer] ?? LAYER_SCALES.temperature;
  const weight = Math.min(1, Math.max(0, (value - scale.min) / (scale.max - scale.min)));
  const channels = [1, 3, 5].map((offset) => Math.round(parseInt(scale.low.slice(offset, offset + 2), 16) * (1 - weight) + parseInt(scale.high.slice(offset, offset + 2), 16) * weight));
  return '#' + channels.map((channel) => channel.toString(16).padStart(2, '0')).join('');
}
