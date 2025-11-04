'use client'

import { useEffect } from "react";

export default function LoadWS(){

    useEffect(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/index.js')
            .then(() => console.log('Service Worker registered'))
            .catch(console.error);
        }
      }, []);

      return <div></div>;
}