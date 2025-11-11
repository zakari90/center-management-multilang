/**
 * @deprecated This file is deprecated. Use `lib/dexie/syncWorker.ts` instead.
 * 
 * Migration guide: See MIGRATION_GUIDE.md
 * 
 * This file will be removed in a future version.
 * Please migrate to the Dexie-based system in `lib/dexie`.
 * 
 * This file now re-exports functions from syncWorker for backward compatibility.
 */
// src/lib/syncEngine.ts
// DEPRECATED: Use lib/dexie/syncWorker.ts instead

// Re-export from new system for backward compatibility
export { syncPendingEntities as syncWithServer } from './dexie/syncWorker';

// Stub functions for backward compatibility
export async function getPendingSyncCount(): Promise<number> {
  const {
    userActions,
    centerActions,
    teacherActions,
    studentActions,
    subjectActions,
    receiptActions,
    scheduleActions,
  } = await import('./dexie/dexieActions');

  try {
    const [
      users,
      centers,
      teachers,
      students,
      subjects,
      receipts,
      schedules,
    ] = await Promise.all([
      userActions.getSyncTargets(),
      centerActions.getSyncTargets(),
      teacherActions.getSyncTargets(),
      studentActions.getSyncTargets(),
      subjectActions.getSyncTargets(),
      receiptActions.getSyncTargets(),
      scheduleActions.getSyncTargets(),
    ]);

    return (
      users.waiting.length +
      centers.waiting.length +
      teachers.waiting.length +
      students.waiting.length +
      subjects.waiting.length +
      receipts.waiting.length +
      schedules.waiting.length +
      users.pending.length +
      centers.pending.length +
      teachers.pending.length +
      students.pending.length +
      subjects.pending.length +
      receipts.pending.length +
      schedules.pending.length
    );
  } catch (error) {
    console.error('Error getting pending sync count:', error);
    return 0;
  }
}

export function startSyncEngine() {
  console.warn('startSyncEngine is deprecated. Use syncPendingEntities from lib/dexie/syncWorker instead.');
  
  // Auto-sync is already handled by syncWorker's online event listener
  // This function is kept for backward compatibility but does nothing
  return () => {
    // Cleanup function (no-op)
  };
}
