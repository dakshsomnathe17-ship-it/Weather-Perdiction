import * as THREE from 'three';

export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

export function vector3ToLatLon(vec3: THREE.Vector3): { lat: number; lon: number } {
  if (!Number.isFinite(vec3.lengthSq()) || vec3.lengthSq() === 0) {
    throw new RangeError('A geographic position must be a finite, nonzero vector');
  }
  const normalizedVec = vec3.clone().normalize();
  const lat = (Math.asin(THREE.MathUtils.clamp(normalizedVec.y, -1, 1)) * 180) / Math.PI;
  let lon = (Math.atan2(normalizedVec.z, -normalizedVec.x) * 180) / Math.PI;
  lon -= 180;
  if (lon < -180) lon += 360;
  return { lat, lon };
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Raycast points are world-space; texture UVs and weather coordinates are Earth-local. */
export function worldPointToLatLon(point: THREE.Vector3, earth: THREE.Object3D) {
  earth.updateWorldMatrix(true, false);
  return vector3ToLatLon(earth.worldToLocal(point.clone()));
}

export function isValidCoordinate(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

export function formatCoordinates(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(2)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(2)}° ${lon < 0 ? 'W' : 'E'}`;
}

export const CONTINENT_PATHS = {
  // Simplified paths for demonstration
  northAmerica: [[50, -100], [60, -120], [70, -100], [60, -80], [30, -90], [10, -80], [15, -100]],
  southAmerica: [[10, -70], [0, -80], [-50, -70], [-20, -40], [0, -50]],
  europe: [[40, -10], [60, 0], [70, 30], [50, 40], [40, 20]],
  africa: [[30, -10], [30, 30], [10, 50], [-30, 30], [0, 10]],
  asia: [[40, 40], [70, 60], [70, 150], [20, 120], [10, 80]],
  australia: [[-10, 120], [-10, 140], [-30, 150], [-40, 140], [-30, 110]],
  antarctica: [[-70, -180], [-70, 0], [-70, 180], [-90, 180], [-90, -180]]
};
