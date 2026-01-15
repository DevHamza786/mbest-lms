/**
 * Authentication API Service
 */
import { apiClient } from './client';
import { Session, LoginCredentials, SignupData } from '@/lib/types/auth';

export interface LoginResponse {
  user: Session;
  token: string;
}

export interface RegisterResponse {
  user: Session;
  token: string;
}

export const authApi = {
  async register(data: SignupData): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      '/auth/register',
      {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.confirmPassword,
        role: data.role,
      },
      false
    );

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      return response.data;
    }

    throw new Error(response.message || 'Registration failed');
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      {
        email: credentials.email,
        password: credentials.password,
      },
      false
    );

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {}, true);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lms.session');
      }
    }
  },

  async me(): Promise<Session> {
    const response = await apiClient.get<any>('/auth/me', {}, true);

    if (response.success && response.data) {
      // Handle nested structure: response.data.data or response.data.user or response.data
      const userData = response.data.data || response.data.user || response.data;
      return {
        id: String(userData.id),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar || null,
      };
    }

    throw new Error(response.message || 'Failed to get user info');
  },
};

