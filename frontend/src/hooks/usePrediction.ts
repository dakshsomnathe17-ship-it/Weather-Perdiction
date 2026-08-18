import { useQuery } from '@tanstack/react-query';
import { getPrediction, getModelStatus } from '@/api/predictions';

export const usePrediction = (lat: number, lon: number, targetDate: string) => {
  return useQuery({
    queryKey: ['prediction', lat, lon, targetDate],
    queryFn: () => getPrediction(lat, lon, targetDate),
    enabled: !!lat && !!lon && !!targetDate,
  });
};

export const useModelStatus = () => {
  return useQuery({
    queryKey: ['modelStatus'],
    queryFn: getModelStatus,
  });
};
