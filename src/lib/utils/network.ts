export function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }
  
  export function waitForOnline(): Promise<void> {
    return new Promise((resolve) => {
      if (isOnline()) {
        resolve();
        return;
      }
      
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };
      
      window.addEventListener('online', handleOnline);
    });
  }
  