'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface ServiceWorkerUpdateContextType {
  updateAvailable: boolean;
  updateAndReload: () => void;
}

const ServiceWorkerUpdateContext = createContext<ServiceWorkerUpdateContextType>({
  updateAvailable: false,
  updateAndReload: () => {},
});

export const useServiceWorkerUpdate = () => useContext(ServiceWorkerUpdateContext);

export function ServiceWorkerUpdateProvider({ children }: { children: React.ReactNode }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Check for updates when the page loads
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Check for updates
          await registration.update();

          // If there's a waiting worker, an update is available
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setUpdateAvailable(true);
          }

          // Listen for new service workers
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is installed and ready
                  setWaitingWorker(newWorker);
                  setUpdateAvailable(true);
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('Error checking for service worker updates:', error);
      }
    };

    checkForUpdates();

    // Check for updates when the tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for messages from the service worker
    const handleControllerChange = () => {
      // Service worker has been updated and activated
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const updateAndReload = () => {
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting and become active
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // The controllerchange event will trigger a reload
    }
  };

  return (
    <ServiceWorkerUpdateContext.Provider value={{ updateAvailable, updateAndReload }}>
      {children}
    </ServiceWorkerUpdateContext.Provider>
  );
}
