// Service Worker shim
// If anything registers /sw.js as the SW script, delegate to the real SW.

/* eslint-disable no-restricted-globals */

try {
  importScripts('/custom-sw.js');
} catch (e) {
  // If importScripts fails (shouldn't), at least avoid crashing silently.
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
}