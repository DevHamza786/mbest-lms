import { create } from 'zustand';
import { Session, AuthState, LoginCredentials, SignupData } from '@/lib/types/auth';
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from '@/lib/utils/storage';
import { authApi } from '@/lib/api';

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  hydrateSession: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.login(credentials);
      
      // Map backend user to frontend session format
      const session: Session = {
        id: String(response.user.id),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as any,
        avatar: response.user.avatar,
      };
      
      // Store session with token in localStorage
      const sessionWithToken = { ...session, token: response.token };
      setStorageItem(STORAGE_KEYS.SESSION, sessionWithToken);
      
      // Ensure token is set in API client (authApi.login already does this, but ensure it's done)
      const { apiClient } = await import('@/lib/api');
      apiClient.setToken(response.token);
      
      set({ session, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false 
      });
      throw error;
    }
  },

  signup: async (data: SignupData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.register(data);
      
      // Map backend user to frontend session format
      const session: Session = {
        id: String(response.user.id),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as any,
        avatar: response.user.avatar,
      };
      
      // Store session with token in localStorage
      const sessionWithToken = { ...session, token: response.token };
      setStorageItem(STORAGE_KEYS.SESSION, sessionWithToken);
      
      // Ensure token is set in API client (authApi.register already does this, but ensure it's done)
      const { apiClient } = await import('@/lib/api');
      apiClient.setToken(response.token);
      
      set({ session, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Signup failed',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token from API client
      const { apiClient } = await import('@/lib/api');
      apiClient.setToken(null);
      // Remove session from localStorage
      removeStorageItem(STORAGE_KEYS.SESSION);
      set({ session: null, error: null });
    }
  },

  hydrateSession: async () => {
    const stored = getStorageItem<any>(STORAGE_KEYS.SESSION);
    if (stored && stored.token) {
      // Set token in API client first
      const { apiClient } = await import('@/lib/api');
      apiClient.setToken(stored.token);
      
      // Try to get current user from API to verify token is still valid
      try {
        const user = await authApi.me();
        const session: Session = {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role as any,
          avatar: user.avatar,
        };
        // Update stored session with fresh data
        const sessionWithToken = { ...session, token: stored.token };
        setStorageItem(STORAGE_KEYS.SESSION, sessionWithToken);
        set({ session });
      } catch (error) {
        // If API call fails (token expired/invalid), use stored session as fallback
        // but still set the token in case it's a network issue
        const session: Session = {
          id: String(stored.id),
          name: stored.name,
          email: stored.email,
          role: stored.role,
          avatar: stored.avatar,
        };
        set({ session });
        console.warn('Failed to verify session with API, using stored session:', error);
      }
    } else {
      // No stored session, ensure API client has no token
      const { apiClient } = await import('@/lib/api');
      apiClient.setToken(null);
      set({ session: null });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const session = useAuthStore(state => state.session);
  return !!session;
};

/**
 * Hook to get current user session
 */
export const useSession = () => {
  return useAuthStore(state => state.session);
};

/**
 * Hook to check if user has specific role
 */
export const useHasRole = (role: string | string[]) => {
  const session = useAuthStore(state => state.session);
  if (!session) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(session.role);
};