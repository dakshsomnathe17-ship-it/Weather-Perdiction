import { useQuery } from '@tanstack/react-query';
import { searchLocations } from '@/api/weather';
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export const useLocationSearch = (query: string) => {
  const debouncedQuery = useDebounce(query, 300);
  
  return useQuery({
    queryKey: ['location', 'search', debouncedQuery],
    queryFn: () => searchLocations(debouncedQuery),
    enabled: debouncedQuery.length > 2,
    staleTime: 5 * 60 * 1000,
  });
};
