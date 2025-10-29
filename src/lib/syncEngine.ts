// src/lib/syncEngine.ts
import { localDb } from './dexie';

let isSyncing = false;

export async function syncWithServer() {
  if (!navigator.onLine) {
    console.log('📡 Offline - sync postponed');
    return { success: false, reason: 'offline' };
  }

  if (isSyncing) {
    console.log('⏳ Sync already in progress');
    return { success: false, reason: 'already_syncing' };
  }

  isSyncing = true;
  console.log('🔄 Starting sync...');

  try {
    const pendingOperations = await localDb.syncQueue
      .where('status')
      .equals('pending')
      .toArray();

    console.log(`📋 Found ${pendingOperations.length} pending operations`);

    let successCount = 0;
    let failCount = 0;

    for (const operation of pendingOperations) {
      try {
        await localDb.syncQueue.update(operation.id!, { status: 'syncing' });

        const endpoint = `/api/${operation.entity}`;
        let response;

        switch (operation.operation) {
          case 'CREATE':
            response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(operation.data),
              credentials: 'include'
            });
            break;

          case 'UPDATE':
            response = await fetch(`${endpoint}/${operation.entityId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(operation.data),
              credentials: 'include'
            });
            break;

          case 'DELETE':
            response = await fetch(`${endpoint}/${operation.entityId}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            break;
        }

        if (response?.ok) {
          const result = await response.json();
          
          // Remove from sync queue
          await localDb.syncQueue.delete(operation.id!);
          
          // Update local record with server ID if CREATE
          if (operation.operation === 'CREATE' && result.id) {
            const table = localDb.table(operation.entity);
            await table.update(operation.entityId!, { 
              id: result.id,
              syncStatus: 'synced'
            });
          } else if (operation.entityId) {
            const table = localDb.table(operation.entity);
            await table.update(operation.entityId, { syncStatus: 'synced' });
          }
          
          successCount++;
          console.log(`✅ Synced ${operation.entity} ${operation.operation}`);
        } else {
          throw new Error(`HTTP ${response?.status}: ${await response?.text()}`);
        }
      } catch (error) {
        console.error(`❌ Sync error for ${operation.entity}:`, error);
        failCount++;
        
        const attempts = operation.attempts + 1;
        const maxRetries = 5;

        if (attempts >= maxRetries) {
          await localDb.syncQueue.update(operation.id!, {
            status: 'failed',
            attempts,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } else {
          await localDb.syncQueue.update(operation.id!, {
            status: 'pending',
            attempts
          });
        }
      }
    }

    console.log(`✨ Sync complete: ${successCount} succeeded, ${failCount} failed`);
    return { success: true, successCount, failCount };
  } catch (error) {
    console.error('💥 Sync engine error:', error);
    return { success: false, reason: 'error', error };
  } finally {
    isSyncing = false;
  }
}

export function startSyncEngine(intervalMs: number = 30000) {
  console.log('🚀 Sync engine started');

  // Sync on online event
  const handleOnline = () => {
    console.log('🌐 Back online - triggering sync');
    syncWithServer();
  };
  
  window.addEventListener('online', handleOnline);
  
  // Periodic sync
  const syncInterval = setInterval(() => {
    syncWithServer();
  }, intervalMs);
  
  // Initial sync
  setTimeout(() => syncWithServer(), 2000);
  
  // Cleanup function
  return () => {
    console.log('🛑 Sync engine stopped');
    window.removeEventListener('online', handleOnline);
    clearInterval(syncInterval);
  };
}

// Export this function so it can be used by components
export async function getPendingSyncCount(): Promise<number> {
  try {
    return await localDb.syncQueue.where('status').equals('pending').count();
  } catch (error) {
    console.error('Error getting pending sync count:', error);
    return 0;
  }
}