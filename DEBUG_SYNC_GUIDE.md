# Debug Sync Button - User Guide

## Overview

The Debug Sync Button is a comprehensive debugging tool for monitoring and troubleshooting the offline sync system. It provides detailed insights into the sync queue and allows you to manually control sync operations.

## Location

The Debug Sync Button is located in the site header (top right), next to the regular Sync button.

## Features

### 1. **Real-time Statistics**
   - **Total**: Total number of operations in sync queue
   - **Pending**: Operations waiting to be synced
   - **Failed**: Operations that failed to sync
   - **Syncing**: Operations currently being synced

### 2. **Manual Sync Control**
   - **Sync Now**: Manually trigger sync of all pending operations
   - **Refresh Queue**: Reload the sync queue to see latest status
   - **Retry Failed**: Reset failed operations to pending and retry
   - **Clear Failed**: Remove all failed operations from queue

### 3. **Detailed Operation View**
   Each operation shows:
   - **Operation type**: CREATE (➕), UPDATE (✏️), or DELETE (🗑️)
   - **Entity**: The data type (users, students, teachers, etc.)
   - **Status**: Pending, Syncing, or Failed
   - **Entity ID**: The ID of the item
   - **Attempts**: Number of sync attempts
   - **Timestamp**: When the operation was created
   - **Error message**: If the operation failed

### 4. **Console Logging**
   Click the info button (ℹ️) on any operation to log full details to the browser console, including:
   - Complete data payload
   - Error stack trace (if failed)
   - All metadata

### 5. **Sync Result Display**
   After each sync, see:
   - Success/failure status
   - Number of items synced
   - Number of items failed
   - Reason for failure (if any)

## Common Debugging Scenarios

### Scenario 1: Operations Not Syncing

**Problem**: Items created offline aren't syncing when back online

**Debug steps:**
1. Click "Debug Sync" button
2. Check the "Pending" count - should show items waiting
3. Click "Sync Now" to manually trigger sync
4. Watch for errors in the operation list
5. Check browser console for detailed error messages

**Common causes:**
- Server is down or unreachable
- Authentication expired
- Invalid data format
- API endpoint mismatch

### Scenario 2: Failed Operations

**Problem**: Some operations are marked as "Failed"

**Debug steps:**
1. Click on failed operations to view error messages
2. Click info button (ℹ️) to see full details in console
3. Common errors:
   - **401 Unauthorized**: Session expired, user needs to login again
   - **404 Not Found**: API endpoint doesn't exist
   - **422 Validation Error**: Data format is invalid
   - **500 Server Error**: Backend issue

**Solutions:**
- **Retry Failed**: If it was a temporary issue
- **Clear Failed**: If the data is corrupt or no longer needed
- Fix the underlying issue and retry

### Scenario 3: Duplicate Sync Attempts

**Problem**: Same operation appears multiple times

**Debug steps:**
1. Check the "Attempts" field on operations
2. Operations retry up to 5 times before being marked as failed
3. If attempts > 3, there's likely a persistent issue

**Solution:**
- Investigate the error message
- Fix the root cause
- Clear failed operations
- Recreate the data if needed

### Scenario 4: User Created Offline Not Syncing

**Problem**: User created offline not appearing on server

**Debug steps:**
1. Open Debug Sync panel
2. Look for operation with:
   - Entity: "users"
   - Operation: CREATE (➕)
   - Status: Check if pending, syncing, or failed
3. If status is "Failed":
   - Click info button to see error
   - Common issue: Password hashing might be different offline vs online
4. Check entity ID - if it starts with "temp_", it's an offline-created item

**Solution:**
```javascript
// In browser console:
(await localDb.syncQueue.where('entity').equals('users').toArray())
// This shows all user operations in queue
```

### Scenario 5: Checking What's in Sync Queue

**Problem**: Want to see all pending operations

**Debug steps:**
1. Click "Debug Sync"
2. Scroll through the operation list
3. Click "View Sync Queue (Console)" in the regular Sync button dropdown
4. Or in browser console:
```javascript
// Get all operations
(await localDb.syncQueue.toArray())

// Get only pending
(await localDb.syncQueue.where('status').equals('pending').toArray())

// Get only failed
(await localDb.syncQueue.where('status').equals('failed').toArray())
```

## Advanced Debugging

### Console Commands

Open browser DevTools (F12) and use these commands:

```javascript
// Import the database
const { localDb } = await import('@/lib/dexie')

// View all sync queue operations
await localDb.syncQueue.toArray()

// View operations by status
await localDb.syncQueue.where('status').equals('pending').toArray()
await localDb.syncQueue.where('status').equals('failed').toArray()

// View operations by entity
await localDb.syncQueue.where('entity').equals('users').toArray()
await localDb.syncQueue.where('entity').equals('students').toArray()

// Count operations
await localDb.syncQueue.count()
await localDb.syncQueue.where('status').equals('pending').count()

// Clear all failed operations
await localDb.syncQueue.where('status').equals('failed').delete()

// Clear entire sync queue (CAUTION!)
await localDb.syncQueue.clear()

// View all local users
await localDb.users.toArray()

// View all local students
await localDb.students.toArray()
```

### Checking Network Requests

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Click "Sync Now"
4. Watch for API requests
5. Click on requests to see:
   - Request payload
   - Response status
   - Error messages

### Checking IndexedDB Directly

1. Open DevTools → Application → IndexedDB
2. Expand "CenterManagementDB"
3. Click on "syncQueue" table
4. View all operations
5. Click on individual operations to see full data

## Best Practices

1. **Regular Monitoring**: Check sync status regularly when working offline
2. **Before Going Offline**: Ensure no pending operations
3. **After Coming Online**: Click "Sync Now" to immediately sync changes
4. **Failed Operations**: Investigate immediately - don't let them pile up
5. **Console Logging**: Use console commands for deep debugging
6. **Clear Failed**: Only after understanding why they failed

## Troubleshooting Tips

### Sync Stuck on "Syncing"

If an operation is stuck in "syncing" status:
1. Wait 30 seconds (it might be processing)
2. If still stuck, refresh the page
3. The sync engine will reset stuck operations on page load

### Can't Login After Offline Changes

If authentication fails after creating users offline:
1. Check if users are in sync queue
2. Sync users first
3. Then try logging in

### Data Mismatch Between Local and Server

If local and server data don't match:
1. Clear local database (CAUTION - will lose offline changes)
2. Or manually sync all pending operations
3. Or import data from server (when implemented)

## Emergency Commands

### Clear Everything and Start Fresh

```javascript
const { localDb } = await import('@/lib/dexie')

// Clear sync queue
await localDb.syncQueue.clear()

// Clear all local data (CAUTION!)
await localDb.users.clear()
await localDb.students.clear()
await localDb.teachers.clear()
await localDb.receipts.clear()
await localDb.subjects.clear()
await localDb.schedules.clear()
```

### Reset Failed Operations

```javascript
const { localDb } = await import('@/lib/dexie')

// Get all failed operations
const failed = await localDb.syncQueue.where('status').equals('failed').toArray()

// Reset to pending
for (const op of failed) {
  await localDb.syncQueue.update(op.id, { 
    status: 'pending', 
    attempts: 0,
    error: undefined
  })
}
```

## Support

If you encounter issues not covered in this guide:
1. Check browser console for errors
2. Use Debug Sync panel to view operation details
3. Export sync queue data for analysis
4. Check network connectivity
5. Verify API endpoints are accessible

