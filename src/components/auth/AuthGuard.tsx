import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component that handles session hydration on app startup
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { hydrateSession } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Hydrate session from localStorage on app startup
    const initSession = async () => {
      await hydrateSession();
      setIsHydrated(true);
    };
    initSession();
  }, [hydrateSession]);

  // Show loading spinner while hydrating session
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}