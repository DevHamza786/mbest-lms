import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store/authStore';
import { getPortalRoot, isPortalPath } from '@/features/navigation/config';
import { UserRole } from '@/lib/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo 
}: ProtectedRouteProps) {
  const { session } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If no session, redirect to sign in
    if (!session) {
      navigate('/auth/signin', { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }

    // If specific roles are required, check permission
    if (allowedRoles && !allowedRoles.includes(session.role)) {
      // Redirect to their correct portal
      const correctPortal = getPortalRoot(session.role);
      navigate(correctPortal, { replace: true });
      return;
    }

    // If user is trying to access a different role's portal, redirect them
    if (!isPortalPath(location.pathname, session.role)) {
      const correctPortal = getPortalRoot(session.role);
      // Only redirect if they're trying to access another portal, not auth pages
      if (location.pathname.match(/^\/(admin|tutor|student|parent)/)) {
        navigate(correctPortal, { replace: true });
        return;
      }
    }

    // If user has a custom redirect destination
    if (redirectTo) {
      navigate(redirectTo, { replace: true });
      return;
    }
  }, [session, allowedRoles, redirectTo, navigate, location.pathname]);

  // Don't render anything while checking authentication
  if (!session) {
    return null;
  }

  // Don't render if user doesn't have permission
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for role-based route protection
 */
export function withRoleProtection(
  Component: React.ComponentType,
  allowedRoles?: UserRole[]
) {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook to check if current user can access a specific role's features
 */
export function useCanAccess(role: UserRole | UserRole[]): boolean {
  const { session } = useAuthStore();
  
  if (!session) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(session.role);
}

/**
 * Hook to redirect to appropriate portal based on user role
 */
export function useRoleRedirect() {
  const { session } = useAuthStore();
  const navigate = useNavigate();

  const redirectToPortal = () => {
    if (session) {
      const portalRoot = getPortalRoot(session.role);
      navigate(portalRoot, { replace: true });
    }
  };

  return redirectToPortal;
}