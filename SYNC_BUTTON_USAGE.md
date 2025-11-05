# Sync Button Usage Guide

## Overview

The `SyncButton` component provides a dropdown menu with three actions:
1. **Sync to Server** - Syncs all pending local changes (waiting "w" and pending delete "0" items) to the server
2. **Import from Server** - Fetches all items from the server and updates local database
3. **Check Sync Status** - Shows current sync status (how many items are waiting, synced, etc.)

## Basic Usage

```tsx
import { SyncButton } from '@/components/sync-button'

export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      <SyncButton apiEndpoint="/api/todos" />
    </div>
  )
}
```

## Examples

### Example 1: Simple Button

```tsx
'use client'

import { SyncButton } from '@/components/sync-button'

export default function TodosPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Todos</h1>
        <SyncButton apiEndpoint="/api/todos" />
      </div>
      {/* Your todos list here */}
    </div>
  )
}
```

### Example 2: In Header or Toolbar

```tsx
'use client'

import { SyncButton } from '@/components/sync-button'

export default function NotesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notes</h1>
        <div className="flex gap-2">
          <SyncButton 
            apiEndpoint="/api/notes" 
            variant="outline"
            size="sm"
          />
        </div>
      </div>
      {/* Your notes list here */}
    </div>
  )
}
```

### Example 3: Icon-Only Button

```tsx
'use client'

import { SyncButton } from '@/components/sync-button'

export default function CompactView() {
  return (
    <div className="flex items-center gap-2">
      <SyncButton 
        apiEndpoint="/api/todos" 
        variant="ghost"
        size="icon"
      />
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | **required** | The API endpoint for your data (e.g., `/api/todos`, `/api/notes`) |
| `className` | `string` | `undefined` | Additional CSS classes |
| `variant` | `'default' \| 'outline' \| 'ghost' \| 'secondary'` | `'outline'` | Button style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |

## Features

### Sync to Server
- Syncs all items with status "w" (waiting) to server via POST
- Deletes all items with status "0" (pending delete) from server via DELETE
- Updates local item status to "1" (synced) after successful sync
- Shows success/error toast notifications
- Disabled when offline

### Import from Server
- Fetches all items from server endpoint
- Creates new items locally if they don't exist
- Updates existing items if they already exist
- Marks all imported items as synced ("1")
- Shows success/error toast notifications
- Disabled when offline

### Check Sync Status
- Shows counts of synced, waiting, and pending delete items
- Works offline (reads from local database)
- Displays toast notification with status

## Integration Examples

### Add to Admin Layout

```tsx
// src/app/[locale]/admin/layout.tsx
import { SyncButton } from '@/components/sync-button'

export default function AdminLayout({ children }) {
  return (
    <div>
      <header className="flex justify-between items-center p-4">
        <h1>Admin Dashboard</h1>
        <SyncButton apiEndpoint="/api/admin/data" />
      </header>
      {children}
    </div>
  )
}
```

### Add to Manager Layout

```tsx
// src/app/[locale]/manager/layout.tsx
import { SyncButton } from '@/components/sync-button'

export default function ManagerLayout({ children }) {
  return (
    <div>
      <header className="flex justify-between items-center p-4">
        <h1>Manager Dashboard</h1>
        <SyncButton apiEndpoint="/api/manager/data" />
      </header>
      {children}
    </div>
  )
}
```

### Add to Site Header

```tsx
// src/components/site-header.tsx
import { SyncButton } from '@/components/sync-button'

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="flex items-center justify-between px-4 py-2">
        <div>Logo/Title</div>
        <div className="flex items-center gap-2">
          <SyncButton 
            apiEndpoint="/api/data" 
            variant="ghost"
            size="sm"
          />
        </div>
      </div>
    </header>
  )
}
```

## API Endpoint Requirements

Your API endpoints should support:

### GET `/api/items`
- Returns array of all items
- Used for import functionality

### POST `/api/items`
- Creates a new item
- Returns the created item with ID
- Used for syncing waiting items

### DELETE `/api/items/:id`
- Deletes an item by ID
- Returns success status
- Used for syncing pending delete items

## Status Indicators

The button shows:
- **Spinning icon** when syncing or importing
- **Disabled state** when offline
- **Toast notifications** for all operations

## Error Handling

The component handles:
- Network errors (offline, timeout)
- Server errors (400, 500, etc.)
- Partial failures (some items succeed, some fail)
- All errors are displayed via toast notifications

## Best Practices

1. **Place strategically** - Add to header, toolbar, or near the data list
2. **Use appropriate endpoint** - Each data type should have its own endpoint
3. **Show status** - Consider adding a sync status badge nearby
4. **Handle errors gracefully** - The component shows errors via toast, but you can add additional error handling

