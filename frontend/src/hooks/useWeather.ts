import { useQuery } from '@tanstack/react-query';
import { getCurrentWeather, getForecast } from '@/api/weather';

export const useCurrentWeather = (lat: number, lon: number) => {
  return useQuery({
    queryKey: ['weather', 'current', lat, lon],
    queryFn: () => getCurrentWeather(lat, lon),
    staleTime: 10 * 60 * 1000,
    enabled: !!lat && !!lon,
  });
};

export const useForecast = (lat: number, lon: number, days: number = 7) => {
  return useQuery({
    queryKey: ['weather', 'forecast', lat, lon, days],
    queryFn: () => getForecast(lat, lon, days),
    staleTime: 30 * 60 * 1000,
    enabled: !!lat && !!lon,
  });
};
