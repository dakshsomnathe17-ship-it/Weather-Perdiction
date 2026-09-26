import { describe, expect, it } from 'vitest';
import { Group, Mesh, SphereGeometry, Vector3 } from 'three';
import { isValidCoordinate, latLonToVector3, vector3ToLatLon, worldPointToLatLon } from './geo';

describe('geographic picking', () => {
  it.each([[0, 0], [0, -90], [37.7749, -122.4194], [-33.8688, 151.2093], [89.999, 179.999], [-89.999, -179.999]])(
    'round-trips latitude %s longitude %s', (lat, lon) => {
      const point = vector3ToLatLon(latLonToVector3(lat, lon, 2));
      expect(point.lat).toBeCloseTo(lat, 6);
      expect(point.lon).toBeCloseTo(lon, 6);
    },
  );
  it('agrees with Three.js equirectangular sphere UVs, including the seam', () => {
    const sphere = new SphereGeometry(1, 32, 16);
    const position = sphere.getAttribute('position');
    const uv = sphere.getAttribute('uv');
    for (let i = 33; i < position.count - 33; i++) {
      const expected = latLonToVector3(uv.getY(i) * 180 - 90, uv.getX(i) * 360 - 180, 1);
      expect(expected.distanceTo(new Vector3().fromBufferAttribute(position, i))).toBeLessThan(1e-6);
    }
    sphere.dispose();
  });
  it('undoes parent and mesh rotations, translations and scales without mutating the hit', () => {
    const system = new Group();
    system.position.set(2, -3, 4);
    system.rotation.set(0.3, 2.1, -0.4);
    system.scale.setScalar(1.8);
    const earth = new Mesh();
    earth.rotation.y = -0.7;
    system.add(earth);
    system.updateMatrixWorld(true);
    const local = latLonToVector3(19.076, 72.8777, 1);
    const world = earth.localToWorld(local.clone());
    const original = world.clone();
    const coordinate = worldPointToLatLon(world, earth);
    expect(coordinate.lat).toBeCloseTo(19.076, 6);
    expect(coordinate.lon).toBeCloseTo(72.8777, 6);
    expect(world.equals(original)).toBe(true);
  });
  it('handles poles and rejects degenerate input', () => {
    expect(vector3ToLatLon(new Vector3(0, 1, 0)).lat).toBe(90);
    expect(vector3ToLatLon(new Vector3(0, -1, 0)).lat).toBe(-90);
    expect(() => vector3ToLatLon(new Vector3())).toThrow(RangeError);
    expect(isValidCoordinate(0, 0)).toBe(true);
    expect(isValidCoordinate(NaN, 0)).toBe(false);
    expect(isValidCoordinate(91, 0)).toBe(false);
  });
});
