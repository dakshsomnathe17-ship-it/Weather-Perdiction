import { useQuery } from '@tanstack/react-query';
import { getMapData } from '@/api/weather';
import type { WeatherLayer } from '@/types';

export function useMapLayer(layer: WeatherLayer) {
  return useQuery({
    queryKey: ['weather-map', layer.id],
    queryFn: ({ signal }) => getMapData(layer.id, signal),
    enabled: layer.active,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
