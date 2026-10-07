import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activePage: string;
  chatOpen: boolean;
  settingsOpen: boolean;
  units: 'metric' | 'imperial';
  theme: 'dark' | 'light';
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  setPage: (page: string) => void;
  toggleChat: () => void;
  setUnits: (units: 'metric' | 'imperial') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      activePage: '/',
      chatOpen: false,
      settingsOpen: false,
      units: 'metric',
      theme: 'dark',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      collapseSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setPage: (page) => set({ activePage: page }),
      toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
      setUnits: (units) => set({ units }),
    }),
    { name: 'weatherai-preferences', partialize: (state) => ({ units: state.units }) },
  ),
);
