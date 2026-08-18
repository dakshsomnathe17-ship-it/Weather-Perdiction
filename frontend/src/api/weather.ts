import client from './client';
import { WeatherData, SearchResult } from '@/types';

export const getCurrentWeather = async (lat: number, lon: number): Promise<WeatherData['current']> => {
  const { data } = await client.get(`/weather/current?lat=${lat}&lon=${lon}`);
  return data;
};

export const getForecast = async (lat: number, lon: number, days: number = 7): Promise<{ forecast: WeatherData['forecast'], hourly: WeatherData['hourly'] }> => {
  const { data } = await client.get(`/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`);
  return data;
};

export const getHistory = async (lat: number, lon: number, startDate: string, endDate: string) => {
  const { data } = await client.get(`/weather/history?lat=${lat}&lon=${lon}&start=${startDate}&end=${endDate}`);
  return data;
};

export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  const { data } = await client.get(`/weather/search?q=${encodeURIComponent(query)}`);
  return data;
};

export const getMapData = async (layer: string, bounds: any) => {
  const { data } = await client.post('/map/data', { layer, bounds });
  return data;
};
