import { useQuery } from '@tanstack/react-query';
import { getCurrentWeather, getForecast } from '@/api/weather';
import { isValidCoordinate } from '@/utils/geo';

export const useCurrentWeather = (lat: number, lon: number) => useQuery({
  queryKey: ['weather', 'current', lat, lon],
  queryFn: ({ signal }) => getCurrentWeather(lat, lon, signal),
  staleTime: 10 * 60 * 1000,
  enabled: isValidCoordinate(lat, lon),
});
export const useForecast = (lat: number, lon: number, days = 7) => useQuery({
  queryKey: ['weather', 'forecast', lat, lon, days],
  queryFn: ({ signal }) => getForecast(lat, lon, days, signal),
  staleTime: 30 * 60 * 1000,
  enabled: isValidCoordinate(lat, lon),
});
