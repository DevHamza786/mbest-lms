import { useState, useEffect } from 'react';
import { tutorApi } from '@/lib/api/tutor';
import { useSession } from '@/lib/store/authStore';

/**
 * Hook to get real-time pending assignments count (submissions needing grading)
 * Updates automatically via polling
 */
export function usePendingAssignmentsCount() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const session = useSession();

  useEffect(() => {
    if (!session?.id || session.role !== 'tutor') {
      setPendingCount(0);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchPendingCount = async () => {
      try {
        // Get assignments to get statistics (including pending_grading count)
        const response = await tutorApi.getAssignments({
          per_page: 1, // We only need the statistics, not the actual data
        });
        
        if (!mounted) return;

        // Use the statistics if available
        const count = response.statistics?.pending_grading || 0;
        setPendingCount(count);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch pending assignments count:', error);
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
  }, [session?.id, session?.role]);

  return { pendingCount, loading };
}

