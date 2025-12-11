import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Manages scroll position on route changes and hash navigation.
 * - Scrolls to top when path/search changes
 * - If hash is present, scrolls to the element with matching id
 * - Uses smooth scrolling and disables browser's automatic restoration
 */
export function ScrollManager() {
  const location = useLocation();

  // Disable browser's automatic scroll restoration
  useEffect(() => {
    const { scrollRestoration } = window.history as History & {
      scrollRestoration?: string;
    };
    const hadManual = scrollRestoration === 'manual';
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if ('scrollRestoration' in window.history && !hadManual) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Scroll to top or to hash target on navigation
  useEffect(() => {
    const scrollToHash = () => {
      const hash = location.hash?.replace('#', '');
      if (hash) {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true;
        }
      }
      return false;
    };

    // Delay to ensure new route content is rendered
    const id = window.requestAnimationFrame(() => {
      if (!scrollToHash()) {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    });
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.hash]);

  return null;
}


