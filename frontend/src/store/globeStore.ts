import { create } from 'zustand';
import { WeatherLayer } from '@/types';

interface GlobeState {
  activeLayers: WeatherLayer[];
  toggleLayer: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
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
  activeLayers: defaultLayers,
  toggleLayer: (id) => set((state) => ({
    activeLayers: state.activeLayers.map(l => l.id === id ? { ...l, active: !l.active } : l)
  })),
  setLayerOpacity: (id, opacity) => set((state) => ({
    activeLayers: state.activeLayers.map(l => l.id === id ? { ...l, opacity } : l)
  })),
}));
