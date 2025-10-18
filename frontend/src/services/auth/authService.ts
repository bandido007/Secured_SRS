import { apiClient } from '../api/client';
import type { AuthResponse, LoginInput, RegisterInput, User, UserRole } from '../../types';

interface RawLoginRole {
  roleName: UserRole['roleName'];
  roleId?: number | string;
  permissions?: string[];
}

interface RawLoginUser {
  id: string;
  userName: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles: RawLoginRole[];
}

interface RawLoginResponse {
  access?: string;
  refresh?: string;
  user?: RawLoginUser;
  detail?: string;
  response?: {
    message?: string;
  };
}

function parseNumber(value: number | string | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
}

function parseStoredItem<T>(key: string): T | null {
  const stored = localStorage.getItem(key);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`Failed to parse stored item for key ${key}`, error);
    return null;
  }
}

export const authService = {
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<RawLoginResponse>('/auth/login', credentials);
    const data = response.data;

    if (data?.access && data?.refresh && data?.user) {
      const userId = parseNumber(data.user.id);

      const user: User = {
        id: userId,
        username: data.user.userName,
        email: data.user.email,
        firstName: data.user.firstName ?? undefined,
        lastName: data.user.lastName ?? undefined,
      };

      const roles: UserRole[] = data.user.roles.map((role) => {
        const mappedRoleId = parseNumber(role.roleId);
        return {
          id: mappedRoleId,
          userId,
          roleId: mappedRoleId,
          roleName: role.roleName,
          permissions: role.permissions,
        };
      });

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('roles', JSON.stringify(roles));

      return {
        response: {
          status: true,
          message: 'Login successful',
        },
        data: {
          access: data.access,
          refresh: data.refresh,
          user,
          roles,
        },
      };
    }

    return {
      response: {
        status: false,
        message: data?.response?.message ?? data?.detail ?? 'Login failed',
      },
    };
  },

  async register(userData: RegisterInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
  },

  getUser(): User | null {
    return parseStoredItem<User>('user');
  },

  getRoles(): UserRole[] {
    return parseStoredItem<UserRole[]>('roles') ?? [];
  },

  hasRole(roleName: string): boolean {
    const roles = this.getRoles();
    return roles.some((role) => role.roleName === roleName);
  },

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  },

  isLecturer(): boolean {
    return this.hasRole('LECTURER');
  },

  isStudent(): boolean {
    return this.hasRole('STUDENT');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },
};
