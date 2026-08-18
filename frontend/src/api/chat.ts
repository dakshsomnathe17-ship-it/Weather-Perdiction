import client from './client';
import { ChatMessage } from '@/types';

export const sendMessage = async (sessionId: string, message: string): Promise<ChatMessage> => {
  const { data } = await client.post(`/chat/${sessionId}`, { message });
  return data;
};

export const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const { data } = await client.get(`/chat/${sessionId}/history`);
  return data;
};
