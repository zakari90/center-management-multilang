# Codebase Cleanup Summary

## Overview

The codebase has been cleaned up to use a unified Dexie-based offline storage system located in `lib/test`. All duplicate and conflicting offline storage systems have been deprecated.

## Completed Tasks

### ✅ 1. Extended syncWorker.ts
- **File**: `src/lib/test/syncWorker.ts`
- **Changes**: 
  - Added `syncPendingEntities()` function that syncs all entity types
  - Added individual sync functions for each entity:
    - `syncPendingUsers()` - Syncs admins and managers
    - `syncPendingCenters()` - Syncs centers
    - `syncPendingTeachers()` - Syncs teachers
    - `syncPendingStudents()` - Syncs students
    - `syncPendingSubjects()` - Syncs subjects
    - `syncPendingReceipts()` - Syncs receipts
    - `syncPendingSchedules()` - Syncs schedules
  - Auto-syncs when connection is restored
  - Handles conflicts (already exists errors)
  - Marks entities as synced after successful sync

### ✅ 2. Created Utility Functions
- **File**: `src/lib/utils/saveToLocalDb.ts`
- **Functions**:
  - `saveCenterToLocalDb(centerData)` - Save center to Dexie
  - `saveTeacherToLocalDb(teacherData)` - Save teacher to Dexie
  - `saveStudentToLocalDb(studentData)` - Save student to Dexie
  - `saveSubjectToLocalDb(subjectData)` - Save subject to Dexie
  - `saveReceiptToLocalDb(receiptData)` - Save receipt to Dexie
  - `saveScheduleToLocalDb(scheduleData)` - Save schedule to Dexie
- **Pattern**: All functions save with status `'w'` (waiting for sync)

### ✅ 3. Updated Components
- **File**: `src/components/login-form.tsx`
  - Updated to use `syncPendingEntities()` instead of `syncPendingUsers()`
  - Uses `saveManagerToLocalDb()` for saving users
- **File**: `src/components/all-users-table.tsx`
  - Updated to use `syncPendingEntities()` instead of `syncPendingUsers()`
  - Uses `saveManagerToLocalDb()` for creating managers
- **File**: `src/lib/actions.ts`
  - Updated `triggerSync()` to use `syncPendingEntities()`

### ✅ 4. Added Documentation
- **File**: `src/lib/test/README.md`
  - Comprehensive documentation of the Dexie-based system
  - Usage examples for all operations
  - Best practices
- **File**: `MIGRATION_GUIDE.md`
  - Step-by-step migration guide
  - Before/after code examples
  - Entity-specific migration instructions

### ✅ 5. Added Deprecation Notices
- **Files**: 
  - `src/lib/offlineStore.ts` - Deprecated
  - `src/lib/offlineApi.ts` - Deprecated
  - `src/lib/syncEngine.ts` - Deprecated
- **Action**: Added `@deprecated` JSDoc comments with migration instructions

## Pending Tasks

### ⏳ 3. Update apiClient.ts
- **Status**: In Progress
- **Action**: Update `apiClient.ts` to use Dexie actions instead of `offlineStore`
- **Impact**: High - This will affect many components that use `apiClient`

### ⏳ 4. Update Remaining Components
- **Status**: Pending
- **Action**: Update all components to use Dexie actions
- **Files to update**:
  - Student creation forms
  - Teacher creation forms
  - Center creation forms
  - Receipt creation forms
  - Schedule creation forms
  - List/table components

### ⏳ 5. Remove Old System
- **Status**: Pending
- **Action**: Remove deprecated files after migration is complete
- **Files to remove**:
  - `src/lib/offlineStore.ts`
  - `src/lib/offlineApi.ts`
  - `src/lib/syncEngine.ts`
  - `src/lib/offlineRegistration.ts`
  - `src/lib/offlineFirstDataManager.ts`

### ⏳ 6. Update syncEngine References
- **Status**: Pending
- **Action**: Find and update all references to `syncEngine` to use `syncWorker`
- **Files to check**:
  - `src/lib/apiClient.ts`
  - `src/components/*.tsx`
  - `src/app/**/*.tsx`

## Architecture

### New System (Dexie-Based)
```
lib/test/
  ├── dbSchema.ts          # Database schema and entity definitions
  ├── dexieActions.ts      # CRUD operations for all entities
  └── syncWorker.ts        # Sync all entities to server

lib/utils/
  ├── saveToLocalDb.ts     # Utility functions to save entities
  └── saveManagerToLocalDb.ts  # Special utility for users
```

### Old System (Deprecated)
```
lib/
  ├── offlineStore.ts      # ❌ Deprecated
  ├── offlineApi.ts        # ❌ Deprecated
  ├── syncEngine.ts        # ❌ Deprecated
  ├── offlineRegistration.ts  # ❌ Deprecated
  └── offlineFirstDataManager.ts  # ❌ Deprecated
```

## Benefits

1. **Unified System**: Single source of truth for offline storage
2. **Better Performance**: IndexedDB is faster than localStorage
3. **More Storage**: IndexedDB can store much more data
4. **Type Safety**: Full TypeScript support
5. **Consistent IDs**: MongoDB-compatible ObjectId format
6. **Unified Sync**: Single sync worker for all entities
7. **Better Error Handling**: Improved error handling and retry logic

## Migration Status

- ✅ Core infrastructure (syncWorker, utilities)
- ✅ User management (login, user creation)
- ⏳ Student management
- ⏳ Teacher management
- ⏳ Center management
- ⏳ Subject management
- ⏳ Receipt management
- ⏳ Schedule management

## Next Steps

1. Update `apiClient.ts` to use Dexie actions
2. Update all form components to use new utilities
3. Update all list/table components to use Dexie actions
4. Test all offline functionality
5. Remove deprecated files
6. Update documentation

## Testing Checklist

- [ ] Create entities offline
- [ ] Read entities from localDb
- [ ] Update entities offline
- [ ] Delete entities offline
- [ ] Sync when online
- [ ] Handle sync errors
- [ ] Auto-sync on connection restore
- [ ] Handle conflicts (already exists)
- [ ] Test all entity types
- [ ] Test user authentication offline

## Notes

- The old system is still functional but deprecated
- New code should use the Dexie-based system
- Migration should be done gradually
- Test thoroughly after each migration
- Keep backup of old code until migration is complete

