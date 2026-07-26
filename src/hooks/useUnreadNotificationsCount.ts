import { useState, useEffect } from 'react';
import { commonApi } from '@/lib/api/common';
import { useSession } from '@/lib/store/authStore';

/**
 * Hook to get real-time unread notifications count
 * Updates automatically via fast 3-second polling & custom event triggers
 */
export function useUnreadNotificationsCount() {
  const [unreadCount, setUnreadCountState] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const session = useSession();

  // Expose setter function that can be used to update the count
  const setUnreadCount = (value: number | ((prev: number) => number)) => {
    setUnreadCountState(value);
  };

  useEffect(() => {
    if (!session?.id) {
      setUnreadCountState(0);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchUnreadCount = async () => {
      try {
        const count = await commonApi.notifications.getUnreadCount();
        
        if (!mounted) return;

        setUnreadCountState(count);
        setLoading(false);
      } catch (error) {
        if (mounted) {
          setUnreadCountState(0);
          setLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchUnreadCount();

    // Fast poll every 3 seconds for real-time unread badge updates
    const pollInterval = setInterval(() => {
      if (mounted) {
        fetchUnreadCount();
      }
    }, 3000);

    const handleCustomUpdate = () => {
      if (mounted) {
        fetchUnreadCount();
      }
    };

    window.addEventListener('lms:data_updated', handleCustomUpdate);
    window.addEventListener('focus', handleCustomUpdate);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('lms:data_updated', handleCustomUpdate);
      window.removeEventListener('focus', handleCustomUpdate);
    };
  }, [session?.id]);

  return { unreadCount, loading, setUnreadCount };
}
