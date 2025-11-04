# Offline-First, Online-Optimistic Sync System

## Overview

This system provides a complete offline-first, online-optimistic sync solution for your app's data (todos, notes, or any other data type). The architecture provides clear separation of concerns:

- **DexieActions**: Manages all IndexedDB operations with status tracking
- **ServerAction**: Handles all API calls and network error handling
- **SyncManager**: Coordinates sync operations between local and server

## Status System

Items have three possible status values:

- **`"1"`** (synced): Successfully saved to server
- **`"w"` (waiting)**: Pending sync to server (created/edited while offline)
- **`"0"` (pending delete)**: Marked for deletion, will be removed on next sync

## Architecture

### File Structure

```
src/lib/
├── syncable-item.ts      # Generic syncable item interface
├── dexieActions.ts       # IndexedDB operations (local storage)
├── serverAction.ts       # API calls (network operations)
├── syncManager.ts        # Sync coordination and high-level functions
└── syncUsageExample.ts  # Usage examples
```

### Key Components

#### 1. DexieActions (`src/lib/dexieActions.ts`)

Manages all local IndexedDB operations:

- `getAllItems()`: Get all items (synced + waiting, excludes pending delete)
- `createItemWaiting()`: Create item with status "w"
- `createItemSynced()`: Create item with status "1"
- `updateItem()`: Update existing item
- `deleteItem()`: Delete item immediately
- `markForDeletion()`: Mark item as "0" (pending delete)
- `getWaitingItems()`: Get all items waiting to sync
- `getPendingDeleteItems()`: Get all items pending deletion
- `getStatusCounts()`: Get counts by status

#### 2. ServerAction (`src/lib/serverAction.ts`)

Handles all server API calls:

- `createItem()`: POST to server
- `updateItem()`: PUT to server
- `deleteItem()`: DELETE from server
- `fetchItems()`: GET from server
- `isOnline()`: Check network status
- `isNetworkError()`: Check if error is network-related

#### 3. SyncManager (`src/lib/syncManager.ts`)

Coordinates sync operations:

- `syncAll()`: Sync all pending items (waiting "w" and pending delete "0")
- `getSyncStatus()`: Get sync status summary
- `addOrEditItem()`: High-level function to add/edit with automatic sync handling
- `deleteItem()`: High-level function to delete with automatic sync handling

## Usage

### Basic Operations

#### Add/Edit an Item

```typescript
import { addOrEditItem } from '@/lib/syncManager';

// Add a new todo
const todo = await addOrEditItem('/api/todos', {
  title: 'Buy groceries',
  completed: false
});

// Update existing todo
const updated = await addOrEditItem('/api/todos', {
  title: 'Buy groceries and milk'
}, todo.id);
```

**Flow:**
1. Tries to save to server first
2. If successful: creates local entry with status "1" (synced)
3. If fails (offline/network error): creates local entry with status "w" (waiting)

#### Delete an Item

```typescript
import { deleteItem } from '@/lib/syncManager';

await deleteItem('/api/todos', todoId);
```

**Flow:**
- If status "w" (not synced): deletes immediately from local DB
- If status "1" (synced): marks as "0" (pending delete), will be removed on next sync

#### Get All Items

```typescript
import { DexieActions } from '@/lib/dexieActions';

// Get all items (synced + waiting)
const items = await DexieActions.getAllItems();

// Get only waiting items
const waiting = await DexieActions.getWaitingItems();

// Get only synced items
const synced = await DexieActions.getItemsByStatus('1');
```

#### Manual Sync

```typescript
import { SyncManager } from '@/lib/syncManager';

const result = await SyncManager.syncAll('/api/todos');
console.log(`Synced: ${result.synced}, Failed: ${result.failed}, Deleted: ${result.deleted}`);
```

**What it does:**
- Scans all items with status "w" → POSTs them to server → updates status to "1"
- Scans all items with status "0" → DELETEs them from server → removes from local DB

### Automatic Sync Setup

```typescript
import { setupAutoSync } from '@/lib/syncUsageExample';

// Setup auto-sync (syncs every 30 seconds and on online event)
const cleanup = setupAutoSync('/api/todos', 30000);

// Later, to stop auto-sync:
cleanup();
```

### React Hook Example

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { DexieActions } from '@/lib/dexieActions';
import { SyncManager } from '@/lib/syncManager';
import { addOrEditItem, deleteItem } from '@/lib/syncManager';

export function useTodos() {
  const todos = useLiveQuery(() => DexieActions.getAllItems()) || [];
  const status = useLiveQuery(() => SyncManager.getSyncStatus());
  
  const addTodo = async (data: any) => {
    return await addOrEditItem('/api/todos', data);
  };
  
  const updateTodo = async (id: string, data: any) => {
    return await addOrEditItem('/api/todos', data, id);
  };
  
  const removeTodo = async (id: string) => {
    await deleteItem('/api/todos', id);
  };
  
  const syncTodos = async () => {
    return await SyncManager.syncAll('/api/todos');
  };
  
  return {
    todos: todos as TodoItem[],
    status,
    addTodo,
    updateTodo,
    removeTodo,
    syncTodos
  };
}
```

## Data Model

All syncable items must extend `SyncableItem`:

```typescript
import { SyncableItem } from '@/lib/syncable-item';

interface TodoItem extends SyncableItem {
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
}

interface NoteItem extends SyncableItem {
  title: string;
  content: string;
  tags?: string[];
}
```

## UI Considerations

### Displaying Items

The UI should always show both synced and waiting items:

```typescript
const items = await DexieActions.getAllItems(); // Includes both "1" and "w"
```

### Sync Status Indicator

Show sync status to users:

```typescript
const status = await SyncManager.getSyncStatus();
// status.waiting = number of items waiting to sync
// status.pendingDelete = number of items pending deletion
```

### Sync Button

Provide a manual sync button:

```typescript
const handleSync = async () => {
  const result = await SyncManager.syncAll('/api/todos');
  if (result.success) {
    toast.success(`Synced ${result.synced} items`);
  } else {
    toast.error(`Sync failed: ${result.errors.join(', ')}`);
  }
};
```

## API Endpoint Requirements

Your API endpoints should follow REST conventions:

- **POST** `/api/items` - Create new item
- **PUT** `/api/items/:id` - Update existing item
- **DELETE** `/api/items/:id` - Delete item
- **GET** `/api/items` - Fetch all items (optional, for initial sync)

All endpoints should:
- Return JSON responses
- Include the item ID in the response (for POST)
- Handle authentication via cookies/credentials

## Error Handling

The system automatically handles:
- Network errors (offline, timeout, server unreachable)
- Server errors (400, 500, etc.)
- Partial sync failures (some items succeed, some fail)

All errors are logged and returned in the sync result for UI display.

## Best Practices

1. **Always use `addOrEditItem()` and `deleteItem()`** - These handle the sync logic automatically
2. **Show sync status in UI** - Let users know how many items are waiting to sync
3. **Provide manual sync option** - Users should be able to trigger sync manually
4. **Handle sync errors gracefully** - Show errors to users but don't block the UI
5. **Use React hooks with `useLiveQuery`** - For reactive UI updates when data changes

## Migration from Old System

If you're migrating from the old sync system:

1. The old system used `syncStatus: 'pending' | 'synced' | 'failed'`
2. The new system uses `status: '1' | 'w' | '0'`
3. You'll need to migrate existing data or start fresh

## Testing

### Test Offline Behavior

1. Open DevTools → Network → Offline
2. Add/edit an item → Should be saved with status "w"
3. Go online → Should sync automatically
4. Check status → Should be "1"

### Test Delete Behavior

1. Add item while online → Status "1"
2. Delete item → Status becomes "0"
3. Go offline → Item still visible (status "0")
4. Go online → Item should be deleted from server and local

### Test Sync

1. Add multiple items offline → All have status "w"
2. Call `syncAll()` → All should sync to server
3. Check local DB → All should have status "1"

## Troubleshooting

### Items not syncing

- Check if online: `ServerAction.isOnline()`
- Check waiting items: `DexieActions.getWaitingItems()`
- Check sync result errors: `SyncManager.syncAll()` returns errors array

### Items stuck in "0" status

- These are pending deletion
- They will be removed on next successful sync
- You can manually remove them if needed

### Duplicate items

- This can happen if sync fails partially
- Check for items with same data but different IDs
- Consider implementing conflict resolution

