import { create } from 'zustand';
import { ChatMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string;
  suggestedQuestions: string[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  sessionId: uuidv4(),
  suggestedQuestions: [
    'Will it rain tomorrow?',
    'Compare Delhi and Mumbai weather',
    'What\'s the temperature in Tokyo?',
    'Should I carry an umbrella today?'
  ],
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: uuidv4(), timestamp: new Date() }]
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] })
}));
