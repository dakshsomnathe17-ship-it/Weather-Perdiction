import { expect, it } from 'vitest';
import { layerColor, validMapPoints } from './weatherMap';

it('accepts zero-valued weather at zero coordinates and drops malformed points', () => {
  expect(validMapPoints([{ lat: 0, lon: 0, value: 0 }, { lat: 95, lon: 0, value: 1 },
    { lat: 0, lon: 0, value: NaN }, { lat: '0', lon: 0, value: 1 }, null])).toEqual([{ lat: 0, lon: 0, value: 0 }]);
  expect(validMapPoints(undefined)).toEqual([]);
});
it('uses the selected layer scale and clamps outliers', () => {
  expect(layerColor('temperature', -200).equals(layerColor('temperature', -30))).toBe(true);
  expect(layerColor('humidity', 500).equals(layerColor('humidity', 100))).toBe(true);
  expect(layerColor('rainfall', 20).equals(layerColor('wind', 20))).toBe(false);
});
