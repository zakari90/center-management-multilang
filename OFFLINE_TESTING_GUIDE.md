# Offline Testing Guide - Quick Start

## 🚀 Quick Start (5 Minutes)

### Step 1: Build & Run
```bash
npm run build
npm run start
```

### Step 2: Test Online (Baseline)
1. Open app: `http://localhost:3000`
2. Login with test account
3. Create a student (online)
   - Go to: Manager → Students → Create Student
   - Fill form and click Save
   - Verify success message
4. View students list
5. Create a receipt (online)
6. Now we have baseline data cached ✅

### Step 3: Enable Offline Mode (Chrome)
1. Press `F12` to open DevTools
2. Click "Network" tab
3. Scroll to "Throttling" section
4. Change from "No throttling" to "Offline" ✅
5. Your app is now offline!

### Step 4: Test Offline Create
1. Go to: Manager → Students → Create Student
2. Fill in the form
3. Click Save
4. **Expected Result:**
   - ✅ Form submits successfully
   - ✅ Toast: "Student saved offline - will sync when online"
   - ✅ See status indicator: "🔴 Disconnected - 1 pending change"
   - ✅ Redirects to students list
   - **Data is safely stored locally!**

### Step 5: Test Offline Read
1. Go to: Manager → Students
2. **Expected Result:**
   - ✅ See the student you created
   - ✅ See previously created students
   - ✅ Can search students
   - ✅ All cached data visible
   - **No blank page or error!**

### Step 6: Go Back Online
1. In DevTools Network tab
2. Change "Offline" back to "No throttling" ✅
3. **Expected Result:**
   - ✅ Toast: "Reconnected - syncing..."
   - ✅ Toast: "✓ All synced" (after 2-3 seconds)
   - ✅ Pending change counter goes to 0
   - ✅ New student now visible on server

---

## 📋 Detailed Test Cases

### Test Case 1: Create Student Offline

**Steps:**
1. Enable offline mode (DevTools → Network → Offline)
2. Navigate to: Manager → Students → Create Student
3. Fill in form:
   - Name: "Test Student Offline"
   - Email: "test@offline.com"
   - Phone: "+1-555-0123"
   - Select Grade: (any grade)
   - Add Enrollment: (select any subject/teacher)
4. Click "Create Student"

**Expected Results:**
```
✅ Form validation passes
✅ No loading spinner (instant success)
✅ Toast notification: "Student saved offline - will sync when online"
✅ Redirected to students list
✅ Student appears in list (with temp ID)
✅ Status indicator shows: "🔴 Disconnected - 1 pending change"
✅ Page displays without errors
```

**Check IndexedDB:**
1. DevTools → Application → IndexedDB
2. Open: CenterManagementDB
3. Check "students" table
4. **Should see:**
   - Your new student with `syncStatus: 'pending'`
   - Temp ID starting with `temp_`

**Check Sync Queue:**
1. In same IndexedDB view
2. Open "syncQueue" table
3. **Should see:**
   - One entry with `operation: 'CREATE'`
   - `entity: 'students'`
   - `status: 'pending'`
   - Your student data in `data` field

---

### Test Case 2: View Data Offline

**Steps:**
1. First, go online and view students (to cache data)
2. Create at least 2-3 students
3. Enable offline mode
4. Navigate to: Manager → Students

**Expected Results:**
```
✅ Page loads instantly (no timeout)
✅ All cached students display
✅ Can see: Name, Email, Phone, Grade
✅ Search functionality works
✅ Sorting works
✅ Export might work or show "offline" indicator
✅ No error messages
```

---

### Test Case 3: Create Receipt Offline

**Steps:**
1. Enable offline mode
2. Go to: Manager → Receipts → Create Receipt
3. Select a student from dropdown
4. Select subjects to pay for
5. Fill payment method: "CASH"
6. Click "Create Receipt"

**Expected Results:**
```
✅ Receipt creates successfully
✅ Toast: "Receipt saved offline - will sync when online"
✅ Redirected to receipts list
✅ Receipt appears in list
✅ Status shows pending sync
```

---

### Test Case 4: Auto Sync When Going Online

**Steps:**
1. Create 2-3 items offline (with offline mode enabled)
2. Status shows: "🔴 Disconnected - 3 pending changes"
3. Go back online (DevTools → Network → No throttling)
4. **Watch the magic happen:**

**Expected Results:**
```
✅ Toast: "Reconnected - syncing..."
✅ Status shows: "🔵 Checking for updates..."
✅ After 2-3 seconds: "✓ All synced"
✅ Pending count goes to: 0
✅ Items now have real server IDs (not temp_*)
✅ No errors in console
```

**Verify on Server:**
1. Refresh page (F5)
2. **Should see:**
   - All items created offline are now on server
   - Correct data saved
   - No duplicates

---

### Test Case 5: Mixed Online/Offline Operations

**Steps:**
1. Go online
2. Create Student A (online) ✅
3. Go offline
4. Create Student B (offline) 📱
5. View students (should see both A and B) ✅
6. Go online
7. Create Student C (online) ✅
8. Wait for auto-sync
9. Refresh page

**Expected Results:**
```
✅ All three students appear
✅ All have proper server data
✅ B synced correctly with server
✅ Timeline: A (online) → B (offline) → C (online) → auto-sync
```

---

## 🧪 Advanced Testing

### Test Service Worker Caching
1. DevTools → Application → Service Workers
2. You should see one SW registered
3. Page and static assets should be cached
4. Check Cache Storage to see:
   - `pages` cache (HTML)
   - `api-cache` (API responses)
   - `static-resources` (JS/CSS)

### Test IndexedDB Persistence
1. DevTools → Application → IndexedDB → CenterManagementDB
2. Create item offline
3. **Check these tables:**
   - `students` - offline students
   - `receipts` - offline receipts
   - `syncQueue` - pending operations
   - Other tables as needed

### Test Toast Notifications
1. Create offline:
   - ✅ "Saved offline - will sync when online"
2. Go online:
   - ✅ "Reconnected - syncing..."
   - ✅ "✓ All synced" (after sync completes)
3. Disconnect:
   - ✅ "Disconnected"

---

## 🔍 Debugging Checklist

### If offline create fails:
- [ ] Check browser console for errors (F12 → Console)
- [ ] Verify IndexedDB is available
- [ ] Check if user is authenticated (look in localStorage)
- [ ] Verify offlineApi functions are imported in apiClient
- [ ] Check that Dexie database initialized

### If offline data not showing:
- [ ] Go online first to cache data
- [ ] Check IndexedDB tables are populated
- [ ] Verify read operations use fallback functions
- [ ] Check Network tab - requests should fail but page shows data

### If sync not happening:
- [ ] Check syncQueue has pending items
- [ ] Verify you're actually online (toggle offline again)
- [ ] Check console for sync errors
- [ ] Manual sync: Open console, type: `await syncWithServer()`
- [ ] Verify API endpoints are responding

### If sync fails:
- [ ] Check API server is running
- [ ] Verify authentication token valid
- [ ] Check syncQueue for errors
- [ ] Try clearing browser data and restart

---

## 🎯 Test Scenarios Checklist

Use this checklist to ensure complete coverage:

**Write Operations (Create/Edit/Delete):**
- [ ] Create item while online → syncs ✅
- [ ] Create item while offline → queues ✅
- [ ] Update item while offline → queues ✅
- [ ] Delete item while offline → queues ✅
- [ ] All pending ops sync when back online ✅

**Read Operations:**
- [ ] View list while online → network data ✅
- [ ] View list while offline → cached data ✅
- [ ] Search while offline → works on cached data ✅
- [ ] Empty list while offline → shows empty (if no prior data) ✅

**UI Indicators:**
- [ ] Offline indicator shows pending count ✅
- [ ] Online indicator shows ✅
- [ ] Sync indicator shows during sync ✅
- [ ] Toast notifications appear ✅

**Data Integrity:**
- [ ] No data loss when offline ✅
- [ ] Correct data syncs to server ✅
- [ ] No duplicates created ✅
- [ ] IDs properly updated after sync ✅

---

## 💡 Pro Tips

1. **Quick offline toggle in console:**
   ```javascript
   // Go offline
   window.dispatchEvent(new Event('offline'));
   
   // Go online
   window.dispatchEvent(new Event('online'));
   ```

2. **Manually trigger sync:**
   ```javascript
   import { syncWithServer } from '@/lib/syncEngine';
   await syncWithServer();
   ```

3. **Check pending items:**
   ```javascript
   import { getPendingSyncCount } from '@/lib/syncEngine';
   const count = await getPendingSyncCount();
   console.log('Pending:', count);
   ```

4. **View all IndexedDB data:**
   ```javascript
   const db = window.indexedDB.databases();
   console.log(db);
   ```

---

## 📊 Performance Metrics to Check

- **Offline create time:** Should be < 200ms
- **Offline read time:** Should be < 100ms
- **Sync time (5 items):** Should be < 5 seconds
- **IndexedDB size:** Check Application → Storage → IndexedDB

---

## ❌ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Failed to create" offline | Check if IndexedDB available, device storage full? |
| Can't see offline data | Go online first to cache, then go offline |
| Sync not working | Verify online, check API responding, clear browser cache |
| Toast not showing | Check Sonner provider in layout.tsx is wrapped |
| Status indicator missing | Verify SyncProvider wrapped app in layout |
| Empty list while offline | Need to view while online first to cache |
| Duplicate data after sync | Clear IndexedDB and resync, check server |

---

## ✅ Success Criteria

Your offline implementation is working when:

- ✅ Create form works offline with confirmation toast
- ✅ Data persists after browser restart while offline
- ✅ List pages show cached data offline
- ✅ Automatic sync on reconnect with toast
- ✅ No console errors when offline
- ✅ Status indicators show correct state
- ✅ All data syncs correctly to server
- ✅ No duplicates after sync
- ✅ Search works on offline data
- ✅ Performance remains fast

---

## 📞 Still Having Issues?

1. Check OFFLINE_ISSUES_DEEP_DIVE.md for technical details
2. Check OFFLINE_IMPLEMENTATION_FIXES.md for architecture
3. Review console logs (F12 → Console) for specific errors
4. Check IndexedDB data (F12 → Application → IndexedDB)
5. Verify API endpoints are responding

Happy testing! 🎉
