'use client';

import { useEffect } from 'react';

export function ServiceWorkerProvider() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[SW] Service Worker registered successfully:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Log when service worker is active
          if (registration.active) {
            console.log('[SW] Service Worker is active');
          }
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      // Handle service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Service Worker controller changed');
      });

      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message from service worker:', event.data);
      });

      // Check if we're online/offline
      window.addEventListener('online', () => {
        console.log('[SW] Browser is online');
      });

      window.addEventListener('offline', () => {
        console.log('[SW] Browser is offline');
      });

      // Log initial online status
      console.log('[SW] Initial online status:', navigator.onLine);
    }
  }, []);

  return null;
}
