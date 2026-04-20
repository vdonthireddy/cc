import { create } from 'zustand';

export type Role = 'STUDENT' | 'PARENT' | 'COUNSELOR' | 'ADMIN';

interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
  studentId?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User | null) => void;
  setInitialized: (val: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user) => set({ user, isAuthenticated: !!user }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
