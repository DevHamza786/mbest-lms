import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { parentApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * SubscriptionGuard - Redirects parents to subscription page if they don't have an active subscription
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // Check subscription status
        const subscription = await parentApi.getMySubscription();
        
        // Handle undefined or null subscription
        if (!subscription) {
          // No subscription - redirect to subscription page
          if (!location.pathname.includes('/parent/subscription')) {
            navigate('/parent/subscription', { replace: true });
            toast({
              title: 'Subscription Required',
              description: 'Please select and pay for a subscription package to access the parent portal.',
              variant: 'default',
            });
          }
          setHasAccess(location.pathname.includes('/parent/subscription'));
          setIsChecking(false);
          return;
        }
        
        // If subscription is active
        if (subscription.status === 'active' && subscription.package) {
          // If on subscription page and subscription is active, redirect to dashboard
          if (location.pathname.includes('/parent/subscription')) {
            navigate('/parent', { replace: true });
            // Don't set hasAccess here - let the next render handle it
            setIsChecking(false);
            return;
          }
          // Allow access to all other routes
          setHasAccess(true);
        } else {
          // Subscription not active - redirect to subscription page
          if (!location.pathname.includes('/parent/subscription')) {
            navigate('/parent/subscription', { replace: true });
            if (subscription.status === 'pending') {
              toast({
                title: 'Payment Pending',
                description: 'Your payment is pending approval. You will be notified once approved.',
                variant: 'default',
              });
            } else {
              toast({
                title: 'Subscription Required',
                description: 'Please select and pay for a subscription package to access the parent portal.',
                variant: 'default',
              });
            }
          }
          // Allow access only to subscription page
          setHasAccess(location.pathname.includes('/parent/subscription'));
        }
      } catch (error: any) {
        console.error('Subscription check error:', error);
        // On error, only redirect if not already on subscription page
        if (!location.pathname.includes('/parent/subscription')) {
          navigate('/parent/subscription', { replace: true });
          toast({
            title: 'Subscription Required',
            description: 'Please select and pay for a subscription package to access the parent portal.',
            variant: 'default',
          });
        }
        setHasAccess(location.pathname.includes('/parent/subscription'));
      } finally {
        setIsChecking(false);
      }
    };

    checkSubscription();
  }, [location.pathname, navigate, toast]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect, so don't render children
  }

  return <>{children}</>;
}
