import client from './client';
import { CurrentWeather, ForecastDay, WeatherData, SearchResult } from '@/types';
import { validMapPoints, type WeatherMapData } from '@/utils/weatherMap';

type CurrentResponse = Omit<CurrentWeather, 'weather_description'> & { description: string; weather_description?: string };
type ForecastResponse = Omit<ForecastDay, 'weather_description'> & { description: string; weather_description?: string };
type SearchResponse = Omit<SearchResult, 'latitude' | 'longitude'> & { lat: number; lon: number };

export const getCurrentWeather = async (lat: number, lon: number, signal?: AbortSignal): Promise<WeatherData['current']> => {
  const { data } = await client.get<CurrentResponse>('/weather/current', { params: { lat, lon }, signal });
  return { ...data, weather_description: data.weather_description ?? data.description };
};
export const getForecast = async (lat: number, lon: number, days = 7, signal?: AbortSignal): Promise<{ forecast: ForecastDay[]; hourly: WeatherData['hourly'] }> => {
  const { data } = await client.get<{ forecast: ForecastResponse[]; hourly?: WeatherData['hourly'] }>('/weather/forecast', { params: { lat, lon, days }, signal });
  return { forecast: data.forecast.map((day) => ({ ...day, weather_description: day.weather_description ?? day.description })), hourly: data.hourly ?? [] };
};
export const getHistory = async (lat: number, lon: number, startDate: string, endDate: string) => {
  const { data } = await client.get('/weather/history', { params: { lat, lon, start_date: startDate, end_date: endDate } });
  return data;
};
export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  const { data } = await client.get<SearchResponse[]>('/weather/search', { params: { q: query } });
  return data.map(({ lat, lon, ...location }) => ({ ...location, latitude: lat, longitude: lon }));
};
export const getMapData = async (layer: string, signal?: AbortSignal): Promise<WeatherMapData> => {
  const { data } = await client.get<WeatherMapData>('/weather/map', {
    params: { layer, bounds: '-180,-90,180,90' }, signal,
  });
  return { layer, points: validMapPoints(data.points) };
};
