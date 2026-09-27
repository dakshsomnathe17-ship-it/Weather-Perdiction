import { describe, expect, it } from 'vitest';
import { formatCoordinates, geodesicPath, isValidCoordinate, locationAltitude, project, surfaceDistance, unproject, wrapLongitude } from './geo';

describe('WGS84 surface distance', () => {
  it('matches equatorial and meridional reference distances', () => {
    expect(surfaceDistance({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(111319.490793, 3);
    expect(surfaceDistance({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(110574.388558, 3);
    expect(surfaceDistance({ lat: 18.5204, lon: 73.8567 }, { lat: 18.5204, lon: 73.8567 })).toBe(0);
  });
  it('handles the antipode, poles and antimeridian', () => {
    expect(surfaceDistance({ lat: 0, lon: 0 }, { lat: 0, lon: 180 })).toBeCloseTo(20003931.458625, 3);
    expect(surfaceDistance({ lat: 90, lon: 0 }, { lat: 90, lon: 170 })).toBeCloseTo(0);
    expect(surfaceDistance({ lat: 0, lon: 179 }, { lat: 0, lon: -179 })).toBeCloseTo(222638.981586, 3);
    const path = geodesicPath({ lat: 0, lon: 0 }, { lat: .001, lon: 179.999 });
    expect(path).toHaveLength(129);
    expect(path.every(p => isValidCoordinate(p.lat, p.lon))).toBe(true);
    expect(path[path.length - 1].lat).toBeCloseTo(.001, 6);
    expect(path[path.length - 1].lon).toBeCloseTo(179.999, 6);
  });
  it('rejects invalid coordinates', () => {
    expect(() => surfaceDistance({ lat: NaN, lon: 0 }, { lat: 0, lon: 0 })).toThrow(RangeError);
    expect(isValidCoordinate(0, 0)).toBe(true);
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(formatCoordinates(-18.5204, 73.8567)).toBe('18.5204° S, 73.8567° E');
    expect(wrapLongitude(190)).toBe(-170);
  });
});
describe('camera framing and Canvas picking', () => {
  it('fits landmarks, cities, countries and a world-spanning box', () => {
    expect(locationAltitude([18.51, 18.53, 73.85, 73.86])).toBeGreaterThan(1500);
    expect(locationAltitude([-90, 90, -180, 180])).toBe(22000000);
    expect(locationAltitude([99, 100, 0, 1])).toBe(80000);
    expect(locationAltitude()).toBe(80000);
    expect(locationAltitude([18, 19, 73, 74], .5)).toBeGreaterThan(locationAltitude([18, 19, 73, 74], 2));
  });
  it('round trips visible points after arbitrary rotations', () => {
    for (const center of [{ lat: 18.5204, lon: 73.8567 }, { lat: -65, lon: -175 }, { lat: 89.9, lon: 20 }]) {
      for (const [x, y] of [[0, 0], [.2, -.3], [-.7, .6], [.98, 0]]) {
        const p = unproject(x, y, center)!;
        const projected = project(p, center);
        expect(projected.visible).toBe(true);
        expect(projected.x).toBeCloseTo(x, 8);
        expect(projected.y).toBeCloseTo(y, 8);
      }
    }
    expect(unproject(1, 1, { lat: 0, lon: 0 })).toBeNull();
    expect(project({ lat: 0, lon: 180 }, { lat: 0, lon: 0 }).visible).toBe(false);
  });
});
