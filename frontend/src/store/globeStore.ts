import { create } from 'zustand';
import { WeatherLayer } from '@/types';

interface GlobeState {
  cameraPosition: [number, number, number];
  zoomLevel: number;
  activeLayers: WeatherLayer[];
  selectedPoint: [number, number] | null;
  isRotating: boolean;
  showClouds: boolean;
  showAtmosphere: boolean;
  setCamera: (pos: [number, number, number]) => void;
  setZoom: (zoom: number) => void;
  toggleLayer: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setSelectedPoint: (point: [number, number] | null) => void;
  toggleRotation: () => void;
}

const defaultLayers: WeatherLayer[] = [
  { id: 'temperature', name: 'Temperature', icon: 'Thermometer', active: false, opacity: 0.8 },
  { id: 'rainfall', name: 'Rainfall', icon: 'CloudRain', active: false, opacity: 0.8 },
  { id: 'clouds', name: 'Cloud Cover', icon: 'Cloud', active: false, opacity: 0.8 },
  { id: 'humidity', name: 'Humidity', icon: 'Droplets', active: false, opacity: 0.8 },
  { id: 'wind', name: 'Wind Speed', icon: 'Wind', active: false, opacity: 0.8 },
  { id: 'pressure', name: 'Pressure', icon: 'Gauge', active: false, opacity: 0.8 },
  { id: 'uv', name: 'UV Index', icon: 'Sun', active: false, opacity: 0.8 },
  { id: 'aqi', name: 'AQI', icon: 'Leaf', active: false, opacity: 0.8 },
];

export const useGlobeStore = create<GlobeState>((set) => ({
  cameraPosition: [0, 0, 5],
  zoomLevel: 1,
  activeLayers: defaultLayers,
  selectedPoint: null,
  isRotating: true,
  showClouds: true,
  showAtmosphere: true,
  setCamera: (pos) => set({ cameraPosition: pos }),
  setZoom: (zoom) => set({ zoomLevel: zoom }),
  toggleLayer: (id) => set((state) => ({
    activeLayers: state.activeLayers.map(l => l.id === id ? { ...l, active: !l.active } : l)
  })),
  setLayerOpacity: (id, opacity) => set((state) => ({
    activeLayers: state.activeLayers.map(l => l.id === id ? { ...l, opacity } : l)
  })),
  setSelectedPoint: (point) => set({ selectedPoint: point }),
  toggleRotation: () => set((state) => ({ isRotating: !state.isRotating }))
}));
