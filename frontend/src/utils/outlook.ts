import type { ForecastDay } from '@/types';

export function dayLabel(date: string, long = false): string {
  // Provider dates are local calendar days, not UTC instants.
  return new Intl.DateTimeFormat('en', {
    weekday: long ? 'long' : 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date.slice(0, 10)}T12:00:00Z`));
}
export function formatRain(mm: number, units: 'metric' | 'imperial') {
  return units === 'metric' ? `${Number(mm.toFixed(1))} mm` : `${(mm / 25.4).toFixed(2)} in`;
}
export function summarizeOutlook(days: ForecastDay[]) {
  if (!days.length) return null;
  return {
    warmest: days.reduce((a, b) => (a.temp_max >= b.temp_max ? a : b)),
    coolest: days.reduce((a, b) => (a.temp_min <= b.temp_min ? a : b)),
    wettest: days.reduce((a, b) => (a.precipitation_sum >= b.precipitation_sum ? a : b)),
    totalRain: days.reduce((sum, day) => sum + day.precipitation_sum, 0),
    wetDays: days.filter((day) => day.precipitation_sum >= 1).length,
  };
}
