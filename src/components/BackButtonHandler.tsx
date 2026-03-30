import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logger } from "@/utils/logger";

/**
 * BackButtonHandler
 *
 * This component handles the mobile back button behavior for WebView-based APKs.
 * It "primes" the history stack to prevent the app from closing on the first back-press
 * and provides a global mechanism for intercepting the back button.
 */
const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Sentinel management for mobile WebViews
    const SENTINEL_STATE = { sentinel: true };
    const DASHBOARD_PATHS = ['/', '/parent-dashboard', '/teacher-dashboard', '/admin-dashboard'];
    const LOGIN_PATHS = ['/login', '/login-parent', '/login-admin'];

    const ensureSentinel = () => {
      // If history length is 1, push a sentinel so back button has something to pop
      if (window.history.length <= 1) {
        window.history.pushState(SENTINEL_STATE, "");
      }
    };

    ensureSentinel();

    const handlePopState = (event: PopStateEvent) => {
      // Let sidebar and other UI elements handle their own popstate
      if (event.state?.sidebarOpen || event.state?.menuOpen) {
        return;
      }

      // If we popped into the sentinel or there's no more history,
      // re-push sentinel and force stay in app
      if (event.state?.sentinel || window.history.length <= 1) {
        // Prevent closing by pushing state back
        window.history.pushState(SENTINEL_STATE, "");

        // Use React Router location instead of window.location for HashRouter compatibility
        const currentPath = location.pathname;
        if (!DASHBOARD_PATHS.includes(currentPath) && !LOGIN_PATHS.includes(currentPath)) {
          navigate("/");
        }
      }

      logger.debug("Back button intercepted", location.pathname, event.state);
    };

    window.addEventListener('popstate', handlePopState);

    // Periodically check history length - some Android WebViews behave oddly
    const interval = setInterval(ensureSentinel, 2000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
    };
  }, [navigate, location]);

  return null;
};

export default BackButtonHandler;
