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

    // Handle "nothing to sync" state
    if (pendingOperations.length === 0) {
      console.log('✅ Nothing to sync - all data is up to date');
      return { success: true, successCount: 0, failCount: 0, reason: 'nothing_to_sync' };
    }

    console.log(`📋 Found ${pendingOperations.length} pending operation${pendingOperations.length !== 1 ? 's' : ''}`);

    let successCount = 0;
    let failCount = 0;

    for (const operation of pendingOperations) {
      try {
        await localDb.syncQueue.update(operation.id!, { status: 'syncing' });

        // Map entity names to correct API endpoints
        const entityEndpointMap: Record<string, string> = {
          'users': 'admin/users',      // /api/admin/users
          'center': 'center',          // /api/center (singular)
          'schedules': 'admin/schedule', // /api/admin/schedule
          'students': 'students',      // /api/students
          'teachers': 'teachers',       // /api/teachers
          'receipts': 'receipts',      // /api/receipts
          'subjects': 'subjects',       // /api/subjects
        };
        
        const endpointPath = entityEndpointMap[operation.entity] || operation.entity;
        const endpoint = `/api/${endpointPath}`;
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
          // Note: operation.entity is the Dexie table name (users, students, teachers, etc.)
          if (operation.operation === 'CREATE' && result.id) {
            try {
              const table = localDb.table(operation.entity);
              await table.update(operation.entityId!, { 
                id: result.id,
                syncStatus: 'synced'
              });
            } catch (error) {
              console.warn(`Could not update table ${operation.entity}:`, error);
            }
          } else if (operation.entityId) {
            try {
              const table = localDb.table(operation.entity);
              await table.update(operation.entityId, { syncStatus: 'synced' });
            } catch (error) {
              console.warn(`Could not update table ${operation.entity}:`, error);
            }
          }
          
          successCount++;
          console.log(`✅ Synced ${operation.entity} ${operation.operation}`);
        } else {
          throw new Error(`HTTP ${response?.status}: ${await response?.text()}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails = error instanceof Error ? error.stack : undefined;
        
        console.error(`❌ Sync error for ${operation.entity} (${operation.operation}):`, {
          error: errorMessage,
          details: errorDetails,
          operation: operation.entity,
          entityId: operation.entityId,
          attempts: operation.attempts + 1
        });
        
        failCount++;
        
        const attempts = operation.attempts + 1;
        const maxRetries = 5;

        if (attempts >= maxRetries) {
          await localDb.syncQueue.update(operation.id!, {
            status: 'failed',
            attempts,
            error: errorMessage
          });
          console.error(`🚫 Max retries reached for ${operation.entity} ${operation.operation}. Marked as failed.`);
        } else {
          await localDb.syncQueue.update(operation.id!, {
            status: 'pending',
            attempts,
            error: errorMessage // Store error for debugging
          });
          console.warn(`⚠️ Retry ${attempts}/${maxRetries} for ${operation.entity} ${operation.operation}`);
        }
      }
    }

    if (successCount > 0 || failCount > 0) {
      console.log(`✨ Sync complete: ${successCount} succeeded, ${failCount} failed`);
    }
    return { success: true, successCount, failCount };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('💥 Sync engine error:', {
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    return { success: false, reason: 'error', error: errorMessage };
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