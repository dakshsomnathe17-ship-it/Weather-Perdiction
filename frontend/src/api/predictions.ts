import client from './client';
import { Prediction } from '@/types';

export const getPrediction = async (lat: number, lon: number, targetDate: string): Promise<Prediction> => {
  const { data } = await client.get(`/predictions?lat=${lat}&lon=${lon}&date=${targetDate}`);
  return data;
};

export const getModelStatus = async () => {
  const { data } = await client.get('/ml/status');
  return data;
};

export const triggerTraining = async (config: any) => {
  const { data } = await client.post('/ml/train', config);
  return data;
};
