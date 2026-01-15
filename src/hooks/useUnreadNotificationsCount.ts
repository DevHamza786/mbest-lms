import { useState, useEffect } from 'react';
import { commonApi } from '@/lib/api/common';
import { useSession } from '@/lib/store/authStore';

/**
 * Hook to get real-time unread notifications count
 * Updates automatically via polling
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
        console.error('Failed to fetch unread notifications count:', error);
        if (mounted) {
          setUnreadCountState(0);
          setLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchUnreadCount();

    // Poll every 30 seconds for updates
    const pollInterval = setInterval(() => {
      if (mounted) {
        fetchUnreadCount();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [session?.id]);

  return { unreadCount, loading, setUnreadCount };
}

