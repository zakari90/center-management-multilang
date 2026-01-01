'use client'

import { useEffect, useRef } from "react";

export default function LoadWS(){
    const hasRegistered = useRef(false);

    useEffect(() => {
        // Prevent double registration (React Strict Mode in development)
        if (hasRegistered.current) return;
        
        if ('serviceWorker' in navigator) {
          hasRegistered.current = true;
          navigator.serviceWorker
            .register('/sw.js', { updateViaCache: 'none' })
            .then((registration) => {
              console.log('Service Worker registered');
              // Ensure we fetch the latest SW after deployments
              registration.update().catch(() => {});
            })
            .catch((error) => {
              console.error('Service Worker registration failed:', error);
            });
        }
      }, []);

      return <div></div>;
}