import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'academic' | 'darkModern' | 'highContrast';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'academic',
      setTheme: (theme: ThemeType) => set({ theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
