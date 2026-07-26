import { useState, useEffect } from 'react';
import { commonApi } from '@/lib/api/common';
import { useSession } from '@/lib/store/authStore';

/**
 * Hook to get real-time unread messages count
 * Updates automatically via fast 3-second polling and window focus/custom events
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
        if (mounted) {
          setUnreadCount(0);
          setLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchUnreadCount();

    // Fast poll every 3 seconds for real-time sidebar badge updates
    const pollInterval = setInterval(() => {
      if (mounted) {
        fetchUnreadCount();
      }
    }, 3000);

    // Listen for custom trigger event when messages are read/received
    const handleCustomUpdate = () => {
      if (mounted) {
        fetchUnreadCount();
      }
    };

    window.addEventListener('lms:unread_messages_updated', handleCustomUpdate);
    window.addEventListener('focus', handleCustomUpdate);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('lms:unread_messages_updated', handleCustomUpdate);
      window.removeEventListener('focus', handleCustomUpdate);
    };
  }, [session?.id]);

  return { unreadCount, loading };
}
