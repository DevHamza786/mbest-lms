/**
 * Laravel Echo Configuration for Real-time WebSocket Communication
 * Configured for Laravel Reverb
 */
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Get API base URL and token
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY || 'app-key';
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || 'localhost';
// IMPORTANT: Reverb port must be 8080, not the frontend dev server port (5173)
const REVERB_PORT = import.meta.env.VITE_REVERB_PORT || '8080';
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME || 'http';

// Debug: Log environment variables
console.log('🔧 Echo Environment Variables:', {
  VITE_REVERB_APP_KEY: REVERB_APP_KEY.substring(0, 10) + '...',
  VITE_REVERB_HOST: REVERB_HOST,
  VITE_REVERB_PORT: REVERB_PORT,
  VITE_REVERB_SCHEME: REVERB_SCHEME,
  VITE_API_BASE_URL: API_BASE_URL,
});

// Validate port is correct
if (REVERB_PORT === '5173' || REVERB_PORT === 5173) {
  console.error('❌ ERROR: VITE_REVERB_PORT is set to 5173 (frontend dev server port)!');
  console.error('❌ It should be 8080 (Reverb server port)');
  console.error('💡 Fix: Set VITE_REVERB_PORT=8080 in your .env file');
}

// Get auth token from localStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('lms.session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      return parsed.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Make Pusher available globally for Echo
(window as any).Pusher = Pusher;

// Create Echo instance configured for Laravel Reverb
let echoInstance: Echo<any> | null = null;

export const initializeEcho = (): Echo<any> => {
  if (echoInstance && echoInstance.connector) {
    return echoInstance;
  }

  const token = getToken();
  
  // Don't initialize if no token - return a mock that will fail gracefully
  if (!token) {
    console.warn('⚠️ No auth token found. Echo will not connect until token is available.');
    // Return a mock Echo instance that won't crash but won't connect
    return {
      private: () => ({ listen: () => {}, unsubscribe: () => {} }),
      leave: () => {},
      disconnect: () => {},
      connector: null,
    } as any;
  }

  const isSecure = REVERB_SCHEME === 'https';
  
  // For local development, always use ws (non-secure) unless explicitly https
  const useTLS = isSecure && REVERB_SCHEME === 'https';

  // Build auth endpoint URL
  const baseUrl = API_BASE_URL.replace('/api/v1', '').replace(/\/$/, '');
  const authEndpoint = `${baseUrl}/broadcasting/auth`;

  console.log('🔌 Initializing Echo with:', {
    host: REVERB_HOST,
    port: REVERB_PORT,
    scheme: REVERB_SCHEME,
    protocol: useTLS ? 'wss' : 'ws',
    authEndpoint,
    hasToken: !!token,
  });

  try {
    // Ensure port is a number and correct
    const wsPort = parseInt(String(REVERB_PORT));
    if (isNaN(wsPort) || wsPort === 5173) {
      console.error('❌ Invalid Reverb port:', REVERB_PORT);
      console.error('💡 Reverb port must be 8080, not the frontend dev server port (5173)');
      throw new Error('Invalid Reverb port configuration');
    }
    
    console.log('🔌 Creating Echo instance with:', {
      wsHost: REVERB_HOST,
      wsPort: wsPort,
      wssPort: wsPort,
      protocol: useTLS ? 'wss' : 'ws',
      authEndpoint,
    });
    
    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: REVERB_APP_KEY,
      wsHost: REVERB_HOST,
      wsPort: wsPort,
      wssPort: wsPort,
      forceTLS: useTLS,
      enabledTransports: useTLS ? ['wss'] : ['ws'],
      disableStats: true,
      authEndpoint,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    });
  } catch (error) {
    console.error('❌ Failed to initialize Echo:', error);
    throw error;
  }

  // Add connection error handling
  if (echoInstance && echoInstance.connector && 'pusher' in echoInstance.connector) {
    const pusher = (echoInstance.connector as any).pusher;
    
    pusher.connection.bind('error', (err: any) => {
      console.error('❌ Pusher connection error:', err);
      console.error('Connection details:', {
        host: REVERB_HOST,
        port: REVERB_PORT,
        scheme: REVERB_SCHEME,
        useTLS: useTLS,
        key: REVERB_APP_KEY.substring(0, 10) + '...',
        authEndpoint,
      });
      
      // If it's an auth error, log it specifically
      if (err?.error?.data?.code === 4001 || err?.error?.data?.code === 4004) {
        console.error('🔐 Authentication failed. Check your token and auth endpoint.');
      }
    });

    pusher.connection.bind('state_change', (states: any) => {
      if (states.current !== 'connecting') {
        console.log('🔌 Connection state:', states.previous, '->', states.current);
      }
    });

    pusher.connection.bind('connected', () => {
      console.log('✅ Connected to Reverb WebSocket server');
      console.log('Connection details:', {
        host: REVERB_HOST,
        port: REVERB_PORT,
        scheme: REVERB_SCHEME,
        protocol: useTLS ? 'wss' : 'ws',
      });
    });

    pusher.connection.bind('disconnected', () => {
      console.log('❌ Disconnected from Reverb WebSocket server');
    });

    pusher.connection.bind('unavailable', () => {
      // Only show error if we've tried connecting for a while
      const retryCount = (pusher as any).__reverbRetryCount || 0;
      (pusher as any).__reverbRetryCount = retryCount + 1;
      
      if (retryCount < 3) {
        console.warn(`⚠️ Reverb connection attempt ${retryCount + 1}/3... Retrying...`);
        setTimeout(() => {
          try {
            pusher.connect();
          } catch (e) {
            console.error('Error retrying connection:', e);
          }
        }, 2000);
      } else {
        console.error('❌ Reverb server is unavailable after multiple attempts.');
        console.error('💡 Make sure Reverb is running: php artisan reverb:start');
        console.error('💡 Check that REVERB_APP_KEY matches in both frontend and backend .env');
      }
    });

    pusher.connection.bind('failed', () => {
      console.error('❌ WebSocket connection failed. Check Reverb server and authentication.');
      console.error('💡 Make sure:');
      console.error('   1. Reverb server is running: php artisan reverb:start');
      console.error('   2. REVERB_APP_KEY matches in both frontend and backend .env');
      console.error('   3. You are authenticated (token exists)');
    });

    // Connect after setting up handlers, but only if we have a token
    if (token) {
      // Wait a bit longer to ensure server is ready
      setTimeout(() => {
        const currentState = pusher.connection?.state;
        if (currentState === 'disconnected' || currentState === 'unavailable' || !currentState) {
          console.log('🔄 Attempting to connect to Reverb...');
          console.log('Connection config:', {
            host: REVERB_HOST,
            port: REVERB_PORT,
            scheme: REVERB_SCHEME,
            key: REVERB_APP_KEY.substring(0, 10) + '...',
          });
          try {
            pusher.connect();
          } catch (error) {
            console.error('❌ Error connecting to Reverb:', error);
          }
        } else if (currentState === 'connected') {
          console.log('✅ Already connected to Reverb');
        } else {
          console.log(`⏳ Connection state: ${currentState}`);
        }
      }, 500); // Increased delay to give server time to be ready
    } else {
      console.warn('⚠️ Skipping Echo connection - no auth token available');
    }
  }

  return echoInstance;
};

// Initialize Echo lazily - only when needed
export const echo = (() => {
  // Return a proxy that initializes on first use
  return new Proxy({} as Echo<any>, {
    get(target, prop) {
      if (!echoInstance) {
        echoInstance = initializeEcho();
      }
      const value = (echoInstance as any)[prop];
      if (typeof value === 'function') {
        return value.bind(echoInstance);
      }
      return value;
    },
  });
})();

// Update auth headers when token changes
export const updateEchoAuth = () => {
  const token = getToken();
  if (!token) {
    console.warn('⚠️ No token available for Echo auth update');
    return;
  }

  // If Echo not initialized yet, initialize it now with token
  if (!echoInstance) {
    echoInstance = initializeEcho();
    return;
  }

  if (echo.connector && 'pusher' in echo.connector) {
    const pusher = (echo.connector as any).pusher;
    if (pusher.config && pusher.config.auth) {
      pusher.config.auth.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Updated Echo auth headers');
      
      // If disconnected, try to reconnect
      if (pusher.connection && pusher.connection.state === 'disconnected') {
        console.log('🔄 Attempting to reconnect Echo...');
        pusher.connect();
      }
    }
  }
};

// Reconnect Echo with new token
export const reconnectEcho = () => {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch (e) {
      console.error('Error disconnecting Echo:', e);
    }
  }
  echoInstance = null;
  return initializeEcho();
};

export default echo;

