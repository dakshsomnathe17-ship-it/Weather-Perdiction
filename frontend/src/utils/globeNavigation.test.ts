import { expect, it } from 'vitest';
import { Vector3 } from 'three';
import { fitGlobeDistance, GlobeGesture, interpolateOrbit } from './globeNavigation';

it('keeps an antipodal focus flight outside Earth and reaches its destination', () => {
  const from = new Vector3(0, 0, 3.5);
  const to = new Vector3(0, 0, -2.2);
  for (let t = 0; t <= 1; t += 0.01) {
    expect(interpolateOrbit(from, to, t).length()).toBeGreaterThanOrEqual(2.19);
  }
  expect(interpolateOrbit(from, to, 1).distanceTo(to)).toBeLessThan(1e-10);
});
it('fits the whole sphere in both portrait and landscape views', () => {
  for (const aspect of [0.4, 0.7, 1, 2]) {
    const distance = fitGlobeDistance(aspect);
    const vertical = Math.PI / 8;
    const limiting = Math.min(vertical, Math.atan(Math.tan(vertical) * aspect));
    expect(distance * Math.sin(limiting)).toBeGreaterThan(1.1);
  }
});
it('rejects a drag that returns to its starting pixel, as well as a pinch', () => {
  const gesture = new GlobeGesture();
  gesture.down(1, 10, 10);
  gesture.move(1, 90, 90);
  gesture.move(1, 10, 10);
  gesture.up(1);
  expect(gesture.blocked).toBe(true);
  gesture.down(1, 10, 10);
  gesture.down(2, 30, 30);
  gesture.up(2);
  gesture.up(1);
  expect(gesture.blocked).toBe(true);
  gesture.down(1, 10, 10);
  gesture.move(1, 12, 12);
  gesture.up(1);
  expect(gesture.blocked).toBe(false);
});
