// src/components/sync-provider.tsx
"use client"

import { useEffect } from 'react';
import { startSyncEngine } from '@/lib/syncEngine';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start sync engine on mount
    const cleanup = startSyncEngine(30000); // Sync every 30 seconds
    
    return cleanup;
  }, []);

  return <>{children}</>;
}
