import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { authService } from '../services/auth/authService';

interface AuthState {
  user: User | null;
  roles: UserRole[];
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null, roles: UserRole[]) => void;
  logout: () => void;
  checkAuth: () => void;

  // Role helpers
  hasRole: (roleName: string) => boolean;
  isAdmin: () => boolean;
  isLecturer: () => boolean;
  isStudent: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  roles: [],
  isAuthenticated: false,
  isLoading: true,

  setUser: (user, roles) => {
    set({ user, roles, isAuthenticated: !!user, isLoading: false });
  },

  logout: () => {
    authService.logout();
    set({ user: null, roles: [], isAuthenticated: false });
  },

  checkAuth: () => {
    const user = authService.getUser();
    const roles = authService.getRoles();
    const isAuthenticated = authService.isAuthenticated();

    set({ user, roles, isAuthenticated, isLoading: false });
  },

  hasRole: (roleName: string) => {
    const { roles } = get();
    return roles.some(role => role.roleName === roleName);
  },

  isAdmin: () => get().hasRole('ADMIN'),
  isLecturer: () => get().hasRole('LECTURER'),
  isStudent: () => get().hasRole('STUDENT'),
}));
