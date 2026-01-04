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

              console.log('[SW] registration state', {
                active: !!registration.active,
                waiting: !!registration.waiting,
                installing: !!registration.installing,
                scope: registration.scope,
                scriptURL:
                  registration.active?.scriptURL ??
                  registration.waiting?.scriptURL ??
                  registration.installing?.scriptURL ??
                  null,
              });

              fetch('/sw.js', { cache: 'no-store' })
                .then(async (r) => {
                  console.log('[SW] /sw.js fetched', {
                    ok: r.ok,
                    status: r.status,
                    contentType: r.headers.get('content-type'),
                  });
                  if (!r.ok) return;
                  const text = await r.text().catch(() => '');
                  console.log('[SW] /sw.js first bytes', text.slice(0, 120));
                })
                .catch((e) => {
                  console.log('[SW] /sw.js fetch failed', e);
                });

              const attachInstalling = (installing: ServiceWorker) => {
                installing.addEventListener('error', (e) => {
                  console.log('[SW] installing error event', e);
                });
                installing.addEventListener('statechange', () => {
                  console.log('[SW] statechange', { state: installing.state });
                  if (installing.state === 'redundant') {
                    console.log('[SW] installing became redundant (likely install failure)');
                  }
                });

                // Some failures do not trigger statechange logs reliably in the page console.
                // Poll a few times to see if it gets stuck.
                let tries = 0;
                const id = window.setInterval(() => {
                  tries += 1;
                  console.log('[SW] installing poll', { state: installing.state });
                  if (installing.state === 'activated' || installing.state === 'redundant' || tries >= 10) {
                    window.clearInterval(id);
                  }
                }, 500);
              };

              if (registration.installing) {
                attachInstalling(registration.installing);
              }

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
                attachInstalling(installing);
                installing.addEventListener('statechange', () => {
                  if (installing.state === 'installed') {
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