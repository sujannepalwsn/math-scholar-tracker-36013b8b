import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    // 1. Prime the history stack
    // When a WebView starts, history.length is 1. If the user presses the back button,
    // the WebView sees no history and tells the app to close.
    // By pushing a dummy state, we ensure canGoBack() is true.
    const primeHistory = () => {
      if (window.history.length <= 1) {
        window.history.pushState({ app_initialized: true }, "");
      }
    };

    primeHistory();

    // 2. Global back button listener
    const handlePopState = (event: PopStateEvent) => {
      // If the sidebar is handling its own popstate (see Sidebar.tsx),
      // we let it do its thing.
      if (event.state?.sidebarOpen) {
        return;
      }

      // If we are at the very beginning of our primed history,
      // we might want to prevent going further back if we want to stay in the app,
      // but usually the default browser behavior is what we want for navigation.

      console.log("Navigation intercepted by BackButtonHandler", location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate, location]);

  return null;
};

export default BackButtonHandler;
