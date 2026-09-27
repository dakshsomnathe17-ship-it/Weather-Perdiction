import { create } from 'zustand';
import { CurrentWeather, ForecastDay, HourlyForecast, Location, SearchResult } from '@/types';

interface WeatherState {
  currentWeather: CurrentWeather | null;
  forecast: ForecastDay[];
  hourly: HourlyForecast[];
  selectedLocation: Location | null;
  recentSearches: SearchResult[];
  isLoading: boolean;
  error: string | null;
  setWeather: (current: CurrentWeather) => void;
  setForecast: (forecast: ForecastDay[], hourly: HourlyForecast[]) => void;
  setLocation: (location: Location) => void;
  addRecentSearch: (search: SearchResult) => void;
  clearError: () => void;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  currentWeather: null,
  forecast: [],
  hourly: [],
  selectedLocation: { name: 'Pune', country: 'India', latitude: 18.5204, longitude: 73.8567 },
  recentSearches: [],
  isLoading: false,
  error: null,
  setWeather: (current) => set({ currentWeather: current }),
  setForecast: (forecast, hourly) => set({ forecast, hourly }),
  setLocation: (location) => set({ selectedLocation: location, currentWeather: null, forecast: [], hourly: [], error: null }),
  addRecentSearch: (search) => set((state) => {
    const exists = state.recentSearches.some(s => s.name === search.name && s.latitude === search.latitude);
    if (exists) return state;
    const newSearches = [search, ...state.recentSearches].slice(0, 5);
    return { recentSearches: newSearches };
  }),
  clearError: () => set({ error: null }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
