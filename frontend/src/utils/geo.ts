import { Geodesic } from 'geographiclib-geodesic';

export interface Coordinate { lat: number; lon: number; }
export type Bounds = [number, number, number, number]; // south, north, west, east
export const WGS84_RADIUS = 6378137;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const wrapLongitude = (lon: number) => ((lon + 180) % 360 + 360) % 360 - 180;
export function isValidCoordinate(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}
export function formatCoordinates(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(4)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(4)}° ${lon < 0 ? 'W' : 'E'}`;
}
export function surfaceDistance(a: Coordinate, b: Coordinate): number {
  if (!isValidCoordinate(a.lat, a.lon) || !isValidCoordinate(b.lat, b.lon)) throw new RangeError('Invalid coordinates');
  return Geodesic.WGS84.Inverse(a.lat, a.lon, b.lat, b.lon).s12!;
}
export function geodesicPath(a: Coordinate, b: Coordinate, segments = 128): Coordinate[] {
  const line = Geodesic.WGS84.InverseLine(a.lat, a.lon, b.lat, b.lon);
  return Array.from({ length: segments + 1 }, (_, i) => {
    const point = line.Position(line.s13 * i / segments);
    return { lat: point.lat2!, lon: point.lon2! };
  });
}
export function locationAltitude(bounds?: Bounds, aspect = 1): number {
  if (!bounds || bounds.some((v) => !Number.isFinite(v))) return 80000;
  const [south, north, west, east] = bounds;
  if (!isValidCoordinate(south, west) || !isValidCoordinate(north, east) || south > north) return 80000;
  const latitude = (south + north) / 2;
  const span = east >= west ? east - west : east + 360 - west;
  const width = span > 180 ? WGS84_RADIUS * Math.PI * Math.cos(latitude * Math.PI / 180) : surfaceDistance({ lat: latitude, lon: west }, { lat: latitude, lon: east });
  const height = surfaceDistance({ lat: south, lon: west }, { lat: north, lon: west });
  return clamp(Math.max(height, width / Math.max(0.2, aspect)) * 1.8, 1500, 22000000);
}

// Orthographic projection for the Canvas fallback. Coordinates are geographic degrees.
export function project(point: Coordinate, center: Coordinate) {
  const rad = Math.PI / 180;
  const lat = point.lat * rad, lat0 = center.lat * rad, dl = (point.lon - center.lon) * rad;
  return { x: Math.cos(lat) * Math.sin(dl), y: Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * Math.cos(lat) * Math.cos(dl), visible: Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * Math.cos(lat) * Math.cos(dl) >= 0 };
}
export function unproject(x: number, y: number, center: Coordinate): Coordinate | null {
  const rho = Math.hypot(x, y);
  if (rho > 1) return null;
  if (rho < 1e-10) return { ...center };
  const lat0 = center.lat * Math.PI / 180, c = Math.asin(rho);
  return { lat: Math.asin(Math.cos(c) * Math.sin(lat0) + y * Math.sin(c) * Math.cos(lat0) / rho) * 180 / Math.PI,
    lon: wrapLongitude(center.lon + Math.atan2(x * Math.sin(c), rho * Math.cos(lat0) * Math.cos(c) - y * Math.sin(lat0) * Math.sin(c)) * 180 / Math.PI) };
}
