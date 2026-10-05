import { describe, expect, it } from 'vitest';
import { dayLabel, formatRain, summarizeOutlook } from './outlook';
import type { ForecastDay } from '@/types';

describe('forecast summaries', () => {
  const makeDay = (date: string, high: number, low: number, rain: number): ForecastDay => ({
    date,
    temp_max: high,
    temp_min: low,
    precipitation_sum: rain,
    weather_code: 0,
    weather_description: 'Clear sky',
  });
  it('uses calendar dates even when the API serializes them as midnight datetimes', () => {
    expect(dayLabel('2026-10-04T00:00:00', true)).toBe('Sunday, Oct 4');
    expect(dayLabel('2026-10-04')).toBe('Sun, Oct 4');
  });
  it('handles no data, negative temperatures, traces of rain and the wet-day threshold', () => {
    expect(summarizeOutlook([])).toBeNull();
    const days = [
      makeDay('2026-10-04', -4, -8, 0.2),
      makeDay('2026-10-05', -2, -6, 1),
      makeDay('2026-10-06', -5, -10, 4),
    ];
    expect(summarizeOutlook(days)).toEqual({
      warmest: days[1],
      coolest: days[2],
      wettest: days[2],
      totalRain: 5.2,
      wetDays: 2,
    });
    expect(days[0].temp_max).toBe(-4);
  });
  it('converts precipitation amounts without calling them probabilities', () => {
    expect(formatRain(25.4, 'imperial')).toBe('1.00 in');
    expect(formatRain(0, 'metric')).toBe('0 mm');
  });
});
