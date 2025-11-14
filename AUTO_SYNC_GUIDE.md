# Auto-Sync Implementation Guide

## 🎯 Best Option: Custom Hook with Multiple Strategies

The **best approach** for auto-sync in your offline-first PWA is a **custom React hook** (`useAutoSync`) that combines multiple sync strategies:

1. ✅ **On App Startup** - Sync local changes
2. ✅ **Periodic Sync** - Every 5-10 minutes
3. ✅ **Network Reconnection** - Sync when back online
4. ✅ **Before Page Unload** - Sync when user closes app
5. ✅ **Manual Sync** - User-triggered sync button

---

## 📦 What Was Created

### 1. **Custom Hook** (`src/hooks/useAutoSync.ts`)
   - Comprehensive auto-sync management
   - Multiple sync strategies
   - Role-aware (admin vs manager)
   - Configurable options
   - Error handling

### 2. **Provider Component** (`src/components/AutoSyncProvider.tsx`)
   - Easy integration
   - Pre-configured with best practices
   - Optional callbacks for notifications

---

## 🚀 Quick Start

### Option 1: Add to Layout (Recommended)
Add to your admin/manager layouts for app-wide auto-sync:

```tsx
// src/app/[locale]/admin/layout.tsx or manager/layout.tsx
import { AutoSyncProvider } from '@/components/AutoSyncProvider';

export default function AdminLayout({ children }) {
  return (
    <>
      <AutoSyncProvider />
      {children}
    </>
  );
}
```

### Option 2: Add to Dashboard Pages
Add to specific pages that need auto-sync:

```tsx
// src/app/[locale]/admin/page.tsx
import { AutoSyncProvider } from '@/components/AutoSyncProvider';

export default function AdminDashboard() {
  return (
    <>
      <AutoSyncProvider />
      {/* Your dashboard content */}
    </>
  );
}
```

### Option 3: Custom Configuration
Use the hook directly with custom options:

```tsx
import { useAutoSync } from '@/hooks/useAutoSync';

function MyComponent() {
  useAutoSync({
    syncInterval: 10, // Sync every 10 minutes
    importOnMount: true, // Import on startup
    onSyncComplete: (success) => {
      if (success) {
        toast.success('Synced!');
      }
    }
  });
  
  return <div>My Component</div>;
}
```

---

## ⚙️ Configuration Options

```typescript
interface AutoSyncOptions {
  syncOnMount?: boolean;        // Sync on app startup (default: true)
  periodicSync?: boolean;        // Enable periodic sync (default: true)
  syncInterval?: number;         // Interval in minutes (default: 5)
  syncOnReconnect?: boolean;     // Sync on network reconnect (default: true)
  syncBeforeUnload?: boolean;    // Sync before page close (default: true)
  importOnMount?: boolean;       // Import from server on mount (default: false)
  onSyncStart?: () => void;      // Callback when sync starts
  onSyncComplete?: (success: boolean) => void; // Callback when sync completes
  onSyncError?: (error: Error) => void; // Callback on error
  debug?: boolean;               // Show console logs (default: false)
}
```

---

## 📊 Sync Strategies Comparison

| Strategy | When | Pros | Cons | Best For |
|----------|------|------|------|----------|
| **On Mount** | App startup | Ensures data is synced when app opens | May delay app startup | Critical data |
| **Periodic** | Every X minutes | Keeps data fresh | Battery/data usage | Active sessions |
| **On Reconnect** | Network restored | Catches up after offline | May sync multiple times | Offline-first apps |
| **Before Unload** | Page close | Saves last changes | May not complete | Critical changes |
| **Manual** | User clicks | User control | Requires user action | Important operations |

**Recommended**: Combine all strategies for best results.

---

## 🎛️ Recommended Configurations

### For Active Users (Default)
```typescript
useAutoSync({
  syncOnMount: true,
  periodicSync: true,
  syncInterval: 5, // 5 minutes
  syncOnReconnect: true,
  syncBeforeUnload: true,
});
```

### For Battery Saving
```typescript
useAutoSync({
  syncOnMount: true,
  periodicSync: true,
  syncInterval: 15, // 15 minutes (less frequent)
  syncOnReconnect: true,
  syncBeforeUnload: false, // Skip background sync
});
```

### For Data Saving (Limited Plans)
```typescript
useAutoSync({
  syncOnMount: true,
  periodicSync: false, // Disable periodic sync
  syncOnReconnect: true,
  syncBeforeUnload: true,
  // User can manually sync when needed
});
```

### For Maximum Freshness
```typescript
useAutoSync({
  syncOnMount: true,
  importOnMount: true, // Import on startup
  periodicSync: true,
  syncInterval: 2, // 2 minutes (very frequent)
  syncOnReconnect: true,
  syncBeforeUnload: true,
});
```

---

## 🔧 Advanced Usage

### With Toast Notifications
```tsx
import { useAutoSync } from '@/hooks/useAutoSync';
import { toast } from 'sonner';

function MyComponent() {
  useAutoSync({
    onSyncStart: () => {
      toast.loading('Syncing data...', { id: 'sync' });
    },
    onSyncComplete: (success) => {
      toast.dismiss('sync');
      if (success) {
        toast.success('Data synced successfully');
      } else {
        toast.error('Sync completed with errors');
      }
    },
    onSyncError: (error) => {
      toast.dismiss('sync');
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}
```

### With Sync Status Indicator
```tsx
import { useAutoSync } from '@/hooks/useAutoSync';
import { useState } from 'react';

function SyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  
  useAutoSync({
    onSyncStart: () => setIsSyncing(true),
    onSyncComplete: () => setIsSyncing(false),
    onSyncError: () => setIsSyncing(false),
  });
  
  return (
    <div>
      {isSyncing && <span>🔄 Syncing...</span>}
    </div>
  );
}
```

### Manual Sync Trigger
```tsx
import { useAutoSync } from '@/hooks/useAutoSync';
import { Button } from '@/components/ui/button';

function SyncButton() {
  const { performSync } = useAutoSync({
    syncOnMount: false, // Disable auto-sync
    periodicSync: false,
  });
  
  return (
    <Button onClick={() => performSync()}>
      Sync Now
    </Button>
  );
}
```

---

## ⚠️ Important Considerations

### 1. **Battery Usage**
- Periodic sync uses battery
- Recommended: 5-10 minute intervals
- Consider disabling on mobile devices

### 2. **Data Usage**
- Sync operations use network data
- Consider user's data plan
- Allow users to disable periodic sync

### 3. **Server Load**
- Too frequent syncs can overload server
- Recommended: Minimum 2-5 minute intervals
- Use debouncing for rapid changes

### 4. **Conflict Resolution**
- Handle sync conflicts gracefully
- Last-write-wins or merge strategies
- Show conflicts to users when needed

### 5. **Error Handling**
- Network errors are expected
- Retry failed syncs
- Queue sync operations when offline

---

## 🐛 Debugging

Enable debug mode to see sync logs:

```typescript
useAutoSync({
  debug: true, // Shows console logs
});
```

You'll see logs like:
```
[AutoSync] Starting sync...
[AutoSync] Sync completed successfully
[AutoSync] Network reconnected, performing sync...
```

---

## 📈 Monitoring Sync Performance

Track sync metrics:

```typescript
const syncMetrics = {
  lastSyncTime: 0,
  syncCount: 0,
  errorCount: 0,
};

useAutoSync({
  onSyncComplete: (success) => {
    syncMetrics.lastSyncTime = Date.now();
    syncMetrics.syncCount++;
    if (!success) syncMetrics.errorCount++;
  },
});
```

---

## ✅ Best Practices

1. **Start with Default Settings**
   - Use `AutoSyncProvider` with defaults
   - Adjust based on user feedback

2. **Respect User Preferences**
   - Allow users to disable auto-sync
   - Save preferences in localStorage

3. **Show Sync Status**
   - Display sync indicator in UI
   - Show last sync time

4. **Handle Errors Gracefully**
   - Don't block UI on sync errors
   - Queue failed syncs for retry

5. **Test Offline Scenarios**
   - Verify sync on reconnect
   - Test with poor network conditions

---

## 🎯 Recommended Implementation

**For your app, I recommend:**

1. ✅ Add `AutoSyncProvider` to both admin and manager layouts
2. ✅ Use default settings (5-minute intervals)
3. ✅ Add sync status indicator to dashboard
4. ✅ Show toast notifications for sync completion
5. ✅ Allow users to manually trigger sync via `SyncHandler` component

This gives you:
- Automatic background sync
- User control when needed
- Good battery/data usage balance
- Reliable offline-first experience

