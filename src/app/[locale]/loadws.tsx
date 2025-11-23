'use client'

import { useEffect, useRef } from "react";

export default function LoadWS(){
    const hasRegistered = useRef(false);

    useEffect(() => {
        // Prevent double registration (React Strict Mode in development)
        if (hasRegistered.current) return;
        
        if ('serviceWorker' in navigator) {
          hasRegistered.current = true;
          navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(console.error);
        }
      }, []);

      return <div></div>;
}