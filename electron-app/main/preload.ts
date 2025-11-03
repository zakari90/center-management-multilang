import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  apiRequest: (method: string, url: string, data?: any, headers?: Record<string, string>) =>
    ipcRenderer.invoke('api-request', { method, url, data, headers }),
  getServerPort: () => ipcRenderer.invoke('get-server-port'),
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      apiRequest: (method: string, url: string, data?: any, headers?: Record<string, string>) => Promise<any>;
      getServerPort: () => Promise<number>;
    };
  }
}

