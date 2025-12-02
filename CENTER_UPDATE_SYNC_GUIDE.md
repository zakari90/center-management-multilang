# Center Update Synchronization Guide

## How Center Updates Are Synchronized

### Current Flow

1. **Local Update**
   - When a center is updated (e.g., name, address, classrooms, working days), it's saved locally with:
     - `status: 'w'` (waiting for sync)
     - `updatedAt: Date.now()` (current timestamp)

2. **Sync Detection**
   - `getSyncTargets()` finds all centers with `status: 'w'` (waiting for sync)
   - These are the centers that need to be synced to the server

3. **Sync Process**
   - `SaveToServer(center)` is called for each waiting center
   - It tries two approaches:
     - **Server Action** (preferred): Direct Prisma access, checks if center exists and updates/creates accordingly
     - **API Route** (fallback): If server action fails, uses HTTP POST/PATCH

4. **Update vs Create**
   - Server action checks if center exists by ID
   - If exists → Updates the center
   - If not exists → Creates new center
   - API route uses POST first, then PATCH if 409 conflict

### Status Values

- `'1'` = Synced with server (up to date)
- `'w'` = Waiting/pending sync (has local changes)
- `'0'` = Marked for deletion (soft delete, pending server sync)

## How to Update a Center

### Method 1: Direct Update (Auto-sync if online)

```typescript
const updatedCenter: Center = {
  ...center,
  name: "New Name",
  classrooms: ["Room A", "Room B"],
  status: 'w',  // Mark as waiting for sync
  updatedAt: Date.now(),  // Update timestamp
};

// Save locally
await centerActions.putLocal(updatedCenter);

// Auto-sync if online
if (isOnline()) {
  try {
    await ServerActionCenters.SaveToServer(updatedCenter);
    await centerActions.markSynced(updatedCenter.id);
    toast.success("Center updated and synced!");
  } catch (error) {
    // Will sync later when online
    toast.info("Updated locally, will sync when online");
  }
}
```

### Method 2: Update and Sync Later

```typescript
// Just update locally - will be synced by manual/automatic sync
const updatedCenter: Center = {
  ...center,
  name: "New Name",
  status: 'w',
  updatedAt: Date.now(),
};

await centerActions.putLocal(updatedCenter);
// Status 'w' means it will be picked up by sync process
```

### Method 3: Manual Sync All Updates

```typescript
// Sync all waiting centers
const result = await ServerActionCenters.Sync();
// This syncs all centers with status 'w'
```

## Best Practices

1. **Always set `status: 'w'` when updating locally**
2. **Always update `updatedAt` timestamp**
3. **Use `putLocal()` to save updates** - it handles both create and update
4. **Check online status before auto-sync** - saves network calls when offline
5. **Handle sync errors gracefully** - center is saved locally, will sync later

## Current Implementation Locations

- **Update handlers**: `src/components/centerPresentation.tsx`
  - `handleSaveClassrooms()` - Updates classrooms
  - `handleSaveWorkingDays()` - Updates working days
  
- **Sync logic**: `src/lib/dexie/centerServerAction.ts`
  - `SaveToServer()` - Handles individual center sync
  - `Sync()` - Handles bulk sync of all waiting centers

- **Local storage**: `src/lib/dexie/dexieActions.ts`
  - `putLocal()` - Save/update center locally
  - `markSynced()` - Mark center as synced (status '1')
  - `getSyncTargets()` - Get centers waiting for sync

