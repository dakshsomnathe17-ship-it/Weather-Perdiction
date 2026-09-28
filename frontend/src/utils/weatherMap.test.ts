import { expect, it } from 'vitest';
import { layerColor, validMapPoints } from './weatherMap';

it('accepts zero-valued weather at zero coordinates and drops malformed points', () => {
  expect(validMapPoints([{ lat: 0, lon: 0, value: 0 }, { lat: 95, lon: 0, value: 1 },
    { lat: 0, lon: 0, value: NaN }, { lat: '0', lon: 0, value: 1 }, null])).toEqual([{ lat: 0, lon: 0, value: 0 }]);
  expect(validMapPoints(undefined)).toEqual([]);
});
it('uses the selected layer scale and clamps outliers', () => {
  expect(layerColor('temperature', -200)).toBe(layerColor('temperature', -30));
  expect(layerColor('humidity', 500)).toBe(layerColor('humidity', 100));
  expect(layerColor('rainfall', 20)).not.toBe(layerColor('wind', 20));
});
