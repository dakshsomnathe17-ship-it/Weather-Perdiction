import type { Coordinate } from '@/utils/geo';
import type { Location } from '@/types';
export interface GlobeHandle {
  flyTo: (location: Location, altitude?: number) => void;
  zoom: (factor: number) => void;
  reset: () => void;
  rotate: (longitude: number, latitude: number) => void;
}
export interface GlobeRendererProps {
  location: Location | null;
  measurement: Coordinate[];
  path: Coordinate[];
  satellite: boolean;
  labels: boolean;
  onPick: (point: Coordinate, focus?: boolean) => void;
  onHover: (point: Coordinate | null) => void;
  onHeight: (height: number) => void;
  onReady: () => void;
  onFailure: () => void;
  onImageryStatus: (message: string) => void;
  onSatelliteReady: (ready: boolean) => void;
}
