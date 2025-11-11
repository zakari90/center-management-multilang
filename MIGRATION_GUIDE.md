# Migration Guide: Moving to Dexie-Based Offline Storage

## Overview

This guide helps you migrate from the old `offlineStore` (localStorage-based) system to the new Dexie-based system in `lib/test`.

## Key Changes

### 1. Storage System
- **Old**: `offlineStore` (localStorage)
- **New**: `dexieActions` (IndexedDB via Dexie)

### 2. Status Values
- **Old**: `'pending' | 'synced' | 'failed'`
- **New**: `'w' | '1' | '0'` (waiting | synced | marked for deletion)

### 3. Sync System
- **Old**: `syncEngine.ts` (localStorage-based)
- **New**: `syncWorker.ts` (Dexie-based)

## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { addOfflineRecord, getAllOfflineRecords } from '@/lib/offlineStore';
import { addStudentOffline } from '@/lib/offlineApi';
import { syncWithServer } from '@/lib/syncEngine';
```

**After:**
```typescript
import { studentActions } from '@/lib/test/dexieActions';
import { saveStudentToLocalDb } from '@/lib/utils/saveToLocalDb';
import { syncPendingEntities } from '@/lib/test/syncWorker';
```

### Step 2: Update Save Operations

**Before:**
```typescript
await addStudentOffline(studentData, managerId);
```

**After:**
```typescript
await saveStudentToLocalDb({
  ...studentData,
  managerId,
});

// Trigger sync if online
if (navigator.onLine) {
  await syncPendingEntities();
}
```

### Step 3: Update Read Operations

**Before:**
```typescript
const students = await getAllOfflineRecords('students');
const student = await findOfflineRecord('students', (r) => r.id === id);
```

**After:**
```typescript
const students = await studentActions.getAll();
const student = await studentActions.getLocal(id);

// Filter by manager
const managerStudents = students.filter(s => s.managerId === managerId);
```

### Step 4: Update Sync Operations

**Before:**
```typescript
await syncWithServer();
```

**After:**
```typescript
await syncPendingEntities();
```

### Step 5: Update Status Checks

**Before:**
```typescript
if (record.syncStatus === 'pending') {
  // Handle pending
}
```

**After:**
```typescript
if (record.status === 'w') {
  // Handle waiting for sync
}
```

## Entity-Specific Migrations

### Users (Admins/Managers)

**Before:**
```typescript
import { registerUserOffline } from '@/lib/offlineRegistration';
await registerUserOffline(formData);
```

**After:**
```typescript
import { saveManagerToLocalDb } from '@/lib/utils/saveManagerToLocalDb';
await saveManagerToLocalDb({
  email: formData.email,
  name: formData.name,
  role: formData.role,
}, formData.password);
```

### Students

**Before:**
```typescript
import { addStudentOffline } from '@/lib/offlineApi';
await addStudentOffline(studentData, managerId);
```

**After:**
```typescript
import { saveStudentToLocalDb } from '@/lib/utils/saveToLocalDb';
await saveStudentToLocalDb({
  ...studentData,
  managerId,
});
```

### Teachers

**Before:**
```typescript
import { addTeacherOffline } from '@/lib/offlineApi';
await addTeacherOffline(teacherData, managerId);
```

**After:**
```typescript
import { saveTeacherToLocalDb } from '@/lib/utils/saveToLocalDb';
await saveTeacherToLocalDb({
  ...teacherData,
  managerId,
});
```

### Centers

**Before:**
```typescript
import { addCenterOffline } from '@/lib/offlineApi';
await addCenterOffline(centerData, adminId);
```

**After:**
```typescript
import { saveCenterToLocalDb } from '@/lib/utils/saveToLocalDb';
await saveCenterToLocalDb({
  ...centerData,
  adminId,
});
```

### Subjects

**Before:**
```typescript
import { addSubjectOffline } from '@/lib/offlineApi';
await addSubjectOffline(subjectData, centerId);
```

**After:**
```typescript
import { saveSubjectToLocalDb } from '@/lib/utils/saveToLocalDb';
await saveSubjectToLocalDb({
  ...subjectData,
  centerId,
});
```

### Receipts

**Before:**
```typescript
import { addReceiptOffline } from '@/lib/offlineApi';
await addReceiptOffline(receiptData, managerId);
```

**After:**
```typescript
import { saveReceiptToLocalDb } from '@/lib/utils/saveToLocalDb';
await saveReceiptToLocalDb({
  ...receiptData,
  managerId,
});
```

### Schedules

**Before:**
```typescript
import { addScheduleOffline } from '@/lib/offlineApi';
await addScheduleOffline(scheduleData, managerId);
```

**After:**
```typescript
import { saveScheduleToLocalDb } from '@/lib/utils/saveToLocalDb';
await saveScheduleToLocalDb({
  ...scheduleData,
  managerId,
});
```

## Deprecated Files

The following files are deprecated and should no longer be used:
- `src/lib/offlineStore.ts` - Use `lib/test/dexieActions.ts` instead
- `src/lib/offlineApi.ts` - Use `lib/utils/saveToLocalDb.ts` instead
- `src/lib/syncEngine.ts` - Use `lib/test/syncWorker.ts` instead
- `src/lib/offlineRegistration.ts` - Use `lib/utils/saveManagerToLocalDb.ts` instead
- `src/lib/offlineFirstDataManager.ts` - Use `lib/test/dexieActions.ts` instead

## Benefits of New System

1. **Better Performance**: IndexedDB is faster than localStorage
2. **More Storage**: IndexedDB can store much more data
3. **Structured Queries**: Dexie provides powerful query capabilities
4. **Type Safety**: Full TypeScript support
5. **Consistent IDs**: MongoDB-compatible ObjectId format
6. **Unified Sync**: Single sync worker for all entities
7. **Better Error Handling**: Improved error handling and retry logic

## Testing

After migration, test the following:
1. ✅ Create entities offline
2. ✅ Read entities from localDb
3. ✅ Update entities offline
4. ✅ Delete entities offline
5. ✅ Sync when online
6. ✅ Handle sync errors
7. ✅ Auto-sync on connection restore

## Support

For questions or issues, refer to:
- `src/lib/test/README.md` - Detailed documentation
- `src/lib/test/dbSchema.ts` - Entity definitions
- `src/lib/test/dexieActions.ts` - CRUD operations
- `src/lib/test/syncWorker.ts` - Sync logic

