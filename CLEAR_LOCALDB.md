# Clear LocalDB - Quick Guide

## 🗑️ How to Clear All LocalDB Data

### Method 1: Using Debug Panel (Recommended)

1. **Open** any page in the app
2. **Look for** "Debug Sync" button (usually in admin/manager dashboard)
3. **Click** "Debug Sync" button
4. **Scroll down** to "Danger Zone" section
5. **Click** "Clear All LocalDB Data" button
6. **Confirm** the action
7. **Page will reload** automatically after clearing

---

### Method 2: Browser DevTools (Manual)

1. **Open** DevTools (F12)
2. **Go to** Application tab
3. **Click** "Storage" in left sidebar
4. **Click** "Clear site data"
5. **Check** "IndexedDB" option
6. **Click** "Clear site data"
7. **Refresh** the page

---

### Method 3: Console Command (Quick)

1. **Open** DevTools Console (F12)
2. **Paste** this command:
```javascript
// Clear all localDB
(async () => {
  const { localDb } = await import('/src/lib/dexie/dbSchema');
  await Promise.all([
    localDb.users.clear(),
    localDb.centers.clear(),
    localDb.teachers.clear(),
    localDb.students.clear(),
    localDb.subjects.clear(),
    localDb.receipts.clear(),
    localDb.schedules.clear(),
    localDb.pushSubscriptions.clear(),
  ]);
  console.log('✅ All localDB cleared!');
  location.reload();
})();
```
3. **Press** Enter
4. **Page reloads** automatically

---

### Method 4: Programmatic (For Developers)

```typescript
import { clearAllLocalDb } from '@/lib/utils/clearLocalDb';

// Clear all data
await clearAllLocalDb();

// Or clear specific entity type
import { clearEntityType } from '@/lib/utils/clearLocalDb';
await clearEntityType('users');
```

---

## ⚠️ What Gets Deleted

**ALL** data in localDB (IndexedDB):
- ✅ Users (admin, managers)
- ✅ Centers
- ✅ Teachers
- ✅ Students
- ✅ Subjects
- ✅ Receipts
- ✅ Schedules
- ✅ Push subscriptions

**This action CANNOT be undone!**

---

## 🔄 What Happens After Clearing

1. **All localDB data is deleted**
2. **Page reloads automatically**
3. **On next login**, admin will be recreated automatically
4. **If online**, data will be pulled from server (if exists)
5. **If offline**, you start fresh with localDB

---

## 🎯 When to Clear LocalDB

### Good Reasons:
- ✅ Testing offline-first flow from scratch
- ✅ Resolving data corruption issues
- ✅ Starting fresh after major changes
- ✅ Debugging sync issues
- ✅ Removing test data

### Bad Reasons:
- ❌ Don't clear if you have important offline data
- ❌ Don't clear if you're offline and need the data
- ❌ Don't clear without backing up important data first

---

## 💡 Tips

1. **Before clearing**: Check if you have important data in localDB
2. **After clearing**: Login again to recreate admin
3. **If online**: Server data will be pulled automatically
4. **If offline**: You'll need to recreate everything locally

---

## 🔍 Verify It's Cleared

After clearing, check:

1. **DevTools** → Application → IndexedDB → `localDb`
2. **All tables** should be empty
3. **Console** should show: `✅ All localDB data cleared!`

---

## 🚨 Emergency: Clear via Browser Settings

If nothing else works:

1. **Chrome**: Settings → Privacy → Clear browsing data → Advanced → IndexedDB
2. **Firefox**: Settings → Privacy → Clear Data → IndexedDB
3. **Edge**: Settings → Privacy → Clear browsing data → IndexedDB

---

## 📝 Notes

- Clearing localDB does **NOT** delete server data (MongoDB)
- Clearing localDB does **NOT** affect cookies or session storage
- Admin will be **automatically recreated** on next login
- If you have synced data on server, it will be **pulled back** when online

