'use client'

import { useEffect, useRef } from "react";

export default function LoadWS(){
    const hasRegistered = useRef(false);

    useEffect(() => {
        // Prevent double registration (React Strict Mode in development)
        if (hasRegistered.current) return;
        
        if ('serviceWorker' in navigator) {
          hasRegistered.current = true;
          const onControllerChange = () => {
            console.log('[SW] controllerchange -> reloading to be controlled');
            window.location.reload();
          };

          navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

          navigator.serviceWorker
            .register('/sw.js', { updateViaCache: 'none' })
            .then((registration) => {
              console.log('Service Worker registered');

              const trySkipWaiting = () => {
                if (registration.waiting) {
                  console.log('[SW] sending SKIP_WAITING to waiting worker');
                  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
              };

              // If there's already a waiting SW (common after deploy), activate it.
              trySkipWaiting();

              registration.addEventListener('updatefound', () => {
                console.log('[SW] updatefound');
                const installing = registration.installing;
                if (!installing) return;
                installing.addEventListener('statechange', () => {
                  console.log('[SW] statechange', { state: installing.state });
                  if (installing.state === 'redundant') {
                    console.log('[SW] installing became redundant (likely install failure)');
                  }
                  if (installing.state === 'installed') {
                    // New SW installed; if there's an existing controller, it will be waiting.
                    trySkipWaiting();
                  }
                });
              });

              // Ensure we fetch the latest SW after deployments
              registration.update().catch((error) => {
                console.error('Error updating Service Worker:', error);
              });
            })
            .catch((error) => {
              console.error('Service Worker registration failed:', error);
            });

          return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          };
        }
      }, []);

      return <div></div>;
}