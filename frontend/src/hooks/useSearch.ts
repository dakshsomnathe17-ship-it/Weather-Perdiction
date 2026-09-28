import { useQuery } from '@tanstack/react-query';
import { searchLocations } from '@/api/weather';

// Nominatim forbids autocomplete. The caller changes query only on form submission.
export const useLocationSearch = (query: string) => useQuery({
  queryKey: ['location', 'nominatim', query],
  queryFn: ({ signal }) => searchLocations(query, signal),
  enabled: query.trim().length >= 2,
  staleTime: 24 * 60 * 60 * 1000,
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});
