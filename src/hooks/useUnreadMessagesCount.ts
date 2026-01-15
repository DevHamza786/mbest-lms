import { useState, useEffect } from 'react';
import { commonApi } from '@/lib/api/common';
import { useSession } from '@/lib/store/authStore';

/**
 * Hook to get real-time unread messages count
 * Updates automatically via polling and when component remounts
 */
export function useUnreadMessagesCount() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const session = useSession();

  useEffect(() => {
    if (!session?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchUnreadCount = async () => {
      try {
        const threads = await commonApi.messages.getThreads();
        
        if (!mounted) return;

        // Calculate total unread count from all threads
        const totalUnread = threads.reduce((sum, thread) => {
          return sum + (thread.unread_count || 0);
        }, 0);

        setUnreadCount(totalUnread);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
        if (mounted) {
          setUnreadCount(0);
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

  return { unreadCount, loading };
}
