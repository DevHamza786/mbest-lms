import { create } from 'zustand';
import { Session, AuthState, LoginCredentials, SignupData } from '@/lib/types/auth';
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from '@/lib/utils/storage';
import { fakeLogin, fakeSignup } from '@/lib/mocks/auth';

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  hydrateSession: () => void;
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
      const session = await fakeLogin(credentials.email, credentials.password);
      
      // Store session in localStorage
      setStorageItem(STORAGE_KEYS.SESSION, session);
      
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
      const session = await fakeSignup(data);
      
      // Store session in localStorage
      setStorageItem(STORAGE_KEYS.SESSION, session);
      
      set({ session, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Signup failed',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    removeStorageItem(STORAGE_KEYS.SESSION);
    set({ session: null, error: null });
  },

  hydrateSession: () => {
    const session = getStorageItem<Session>(STORAGE_KEYS.SESSION);
    if (session) {
      set({ session });
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