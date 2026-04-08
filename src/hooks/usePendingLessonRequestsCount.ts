import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tutorApi } from '@/lib/api/tutor';
import { useSession } from '@/lib/store/authStore';

/**
 * Hook to get real-time pending lesson requests count
 * Updates automatically via polling
 */
export function usePendingLessonRequestsCount() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const session = useSession();
  const location = useLocation();

  useEffect(() => {
    if (!session?.id || session.role !== 'tutor') {
      setPendingCount(0);
      setLoading(false);
      return;
    }

    if (location.pathname.startsWith('/tutor/availability')) {
      setPendingCount(0);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchPendingCount = async () => {
      try {
        // Get pending lesson requests
        const requests = await tutorApi.getLessonRequests({
          status: 'pending',
          per_page: 100, // Get all pending requests
        });
        
        if (!mounted) return;

        setPendingCount(requests.length);
        setLoading(false);
      } catch (error: unknown) {
        console.error('Failed to fetch pending lesson requests count:', error);
        if (mounted) {
          setPendingCount(0);
          setLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchPendingCount();

    // Poll every 30 seconds for updates
    const pollInterval = setInterval(() => {
      if (mounted) {
        fetchPendingCount();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [session?.id, session?.role, location.pathname]);

  return { pendingCount, loading };
}

