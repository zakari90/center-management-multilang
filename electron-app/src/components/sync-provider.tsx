import { ReactNode } from 'react';

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  // Placeholder for offline sync functionality
  return <>{children}</>;
}

