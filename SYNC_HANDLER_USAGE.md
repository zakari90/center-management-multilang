# Sync Handler Usage Guide

## 📋 Overview

The `SyncHandler` component provides three main functions:
1. **Sync to Server** (Export) - Pushes local changes to the server
2. **Import from Server** - Pulls all data from server to local DB
3. **Delete Local DB** - Clears all local IndexedDB data

## 🎯 Suggested Placement Locations

### 1. **Admin Dashboard** ⭐ RECOMMENDED
**Location**: `src/app/[locale]/admin/page.tsx`

**Why**: Admins need to sync data frequently and manage system-wide data.

**Implementation**:
```tsx
import { SyncHandler } from "@/components/syncHandler";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6">
      {/* ... existing content ... */}
      
      {/* Add Sync Handler */}
      <SyncHandler />
      
      <DeleteAllDataButton/>
    </div>
  )
}
```

---

### 2. **Manager Dashboard** ⭐ RECOMMENDED
**Location**: `src/app/[locale]/manager/page.tsx`

**Why**: Managers need to sync their local data with the server regularly.

**Implementation**:
```tsx
import { SyncHandler } from "@/components/syncHandler";

function Page() {
  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6">
      {/* ... existing content ... */}
      
      {/* Add Sync Handler */}
      <SyncHandler />
    </div>
  );
}
```

---

### 3. **Admin Settings Page** ⭐ BEST PRACTICE
**Location**: Create `src/app/[locale]/admin/settings/page.tsx`

**Why**: Dedicated settings page for sync and data management.

**Implementation**:
```tsx
"use client";

import { SyncHandler } from "@/components/syncHandler";
import { DeleteAllDataButton } from "@/components/masterDelete";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  
  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      
      <SyncHandler />
      <DeleteAllDataButton />
    </div>
  );
}
```

**Add to Admin Layout Navigation**:
```tsx
// src/app/[locale]/admin/layout.tsx
const navItems = [
  // ... existing items ...
  {
    title: t("settings"),
    url: "/admin/settings",
    icon: "/settings.svg",
  },
];
```

---

### 4. **Manager Settings Page** ⭐ BEST PRACTICE
**Location**: Create `src/app/[locale]/manager/settings/page.tsx`

**Why**: Managers need a dedicated place for sync operations.

**Implementation**: Similar to admin settings page.

---

### 5. **Admin Quick Actions** ⭐ OPTIONAL
**Location**: `src/components/adminQuickActions.tsx`

**Why**: Quick access to sync functionality.

**Implementation**:
```tsx
import { SyncHandler } from "@/components/syncHandler";

export default function AdminQuickActions() {
  // Add sync button to actions array
  const actions = [
    // ... existing actions ...
    {
      title: "Sync Data",
      description: "Sync local data with server",
      icon: RefreshCw,
      component: <SyncHandler />, // Or link to settings page
      color: "text-purple-600 bg-purple-100"
    },
  ];
}
```

---

### 6. **Header/Navigation Bar** ⭐ OPTIONAL
**Location**: Create a sync button in the header

**Why**: Always accessible sync functionality.

**Implementation**:
```tsx
// In layout or header component
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { SyncHandler } from "@/components/syncHandler";

// Add sync buttons to header
<Button onClick={() => handleSync()}>
  <Upload className="h-4 w-4" />
  Sync
</Button>
```

---

### 7. **Modal/Dialog** ⭐ OPTIONAL
**Location**: Create a sync modal that can be triggered from anywhere

**Why**: Non-intrusive sync access.

**Implementation**:
```tsx
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SyncHandler } from "@/components/syncHandler";

<Dialog>
  <DialogTrigger asChild>
    <Button>Sync Data</Button>
  </DialogTrigger>
  <DialogContent>
    <SyncHandler />
  </DialogContent>
</Dialog>
```

---

## 🔧 Component Features

### Sync to Server (Export)
- **Function**: `handleSyncToServer()`
- **What it does**: 
  - Syncs all entities with status 'w' (waiting) or '0' (deleted) to server
  - Updates local records to status '1' (synced) on success
- **When to use**: 
  - After creating/editing data offline
  - Before closing the app
  - Periodically (e.g., every 5 minutes)

### Import from Server
- **Function**: `handleImportFromServer()`
- **What it does**: 
  - Fetches all data from server
  - Replaces local synced data (status '1') with server data
  - Preserves local unsynced changes (status 'w' or '0')
- **When to use**: 
  - On app startup
  - After network reconnection
  - When data seems out of sync

### Delete Local DB
- **Function**: `handleDeleteLocalDB()`
- **What it does**: 
  - Clears all local IndexedDB tables
  - Does NOT delete server data
  - Requires confirmation
- **When to use**: 
  - Troubleshooting data issues
  - Starting fresh
  - Before major app update

---

## 📝 Translation Keys Needed

Add these to your translation files:

```json
{
  "SyncHandler": {
    "title": "Data Synchronization",
    "description": "Manage data sync between local storage and server",
    "online": "Online",
    "offline": "Offline",
    "offlineError": "Cannot sync: device is offline",
    "syncToServer": "Sync to Server",
    "syncToServerHelp": "Upload local changes to the server",
    "importFromServer": "Import from Server",
    "importFromServerHelp": "Download all data from server to local storage",
    "deleteLocalDB": "Delete Local Data",
    "deleteLocalDBHelp": "Clear all local data (server data remains)",
    "syncing": "Syncing...",
    "importing": "Importing...",
    "deleting": "Deleting...",
    "syncSuccess": "Successfully synced {count} entities",
    "syncPartial": "Synced {success} entities, {failed} failed",
    "syncError": "Sync failed: {error}",
    "importSuccess": "Successfully imported {count} entities",
    "importPartial": "Imported {success} entities, {failed} failed",
    "importError": "Import failed: {error}",
    "deleteSuccess": "Local data deleted successfully",
    "deleteError": "Delete failed: {error}",
    "confirmDelete": "Are you sure? This will delete ALL local data.",
    "confirm": "Confirm",
    "cancel": "Cancel"
  }
}
```

---

## 🚀 Recommended Implementation Order

1. ✅ **Add to Admin Dashboard** (High Priority)
2. ✅ **Add to Manager Dashboard** (High Priority)
3. ✅ **Create Settings Pages** (Best Practice)
4. ⚠️ **Add to Quick Actions** (Optional)
5. ⚠️ **Add to Header** (Optional)

---

## ⚠️ Important Notes

1. **Network Check**: Sync operations require online connection
2. **Data Safety**: Import replaces synced data but preserves unsynced changes
3. **Delete Warning**: Delete Local DB only clears local data, not server data
4. **Performance**: Large syncs may take time - show loading states
5. **Error Handling**: All operations include error handling and user feedback

---

## 🔄 Auto-Sync Suggestions

Consider implementing automatic sync:
- On app startup (import)
- Every 5-10 minutes (sync to server)
- On network reconnection (sync + import)
- Before app close (sync to server)

