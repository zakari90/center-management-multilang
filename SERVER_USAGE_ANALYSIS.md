# Server/Internet Usage Analysis

This document lists all components and functions that make network requests to the server.

## 🔴 **ACTIVE Server Usage** (Currently Making API Calls)

### 1. **Authentication & User Management**

#### `src/lib/actions.ts` (Server Actions)
- ✅ `register()` - POST `/api/admin/users` - User registration
- ✅ `createManager()` - POST `/api/manager/register` - Manager creation
- ✅ `loginAdmin()` - POST `/api/auth/login` - Admin login
- ✅ `loginManager()` - POST `/api/manager/login` - Manager login
- ✅ `createCenterAction()` - POST `/api/centers` - Center creation

#### `src/context/authContext.tsx`
- ✅ `checkAuth()` - GET `/api/auth/me` - Check authentication status
- ✅ `logout()` - POST `/api/auth/logout` - User logout

#### `src/lib/actionsClient.ts`
- ✅ `loginWithRole()` - Calls `loginAdmin()` or `loginManager()` server actions

---

### 2. **Data Synchronization (Server Actions)**

All located in `src/lib/dexie/*ServerAction.ts`:

#### `src/lib/dexie/userServerAction.ts`
- ✅ `SaveToServer()` - POST/PUT `/api/admin/users` - Save user to server
- ✅ `DeleteFromServer()` - DELETE `/api/admin/users/{id}` - Delete user
- ✅ `ReadFromServer()` - GET `/api/admin/users` - Import users from server
- ✅ `Sync()` - Syncs pending/waiting users with server

#### `src/lib/dexie/centerServerAction.ts`
- ✅ `SaveToServer()` - POST `/api/center` - Save center to server
- ✅ `DeleteFromServer()` - DELETE `/api/center?id={id}` - Delete center
- ✅ `ReadFromServer()` - GET `/api/center` - Import centers from server
- ✅ `Sync()` - Syncs pending/waiting centers with server

#### `src/lib/dexie/teacherServerAction.ts`
- ✅ `SaveToServer()` - POST/PUT `/api/teachers` - Save teacher to server
- ✅ `DeleteFromServer()` - DELETE `/api/teachers/{id}` - Delete teacher
- ✅ `ReadFromServer()` - GET `/api/teachers` - Import teachers from server
- ✅ `Sync()` - Syncs pending/waiting teachers with server

#### `src/lib/dexie/studentServerAction.ts`
- ✅ `SaveToServer()` - POST/PUT `/api/students` - Save student to server
- ✅ `DeleteFromServer()` - DELETE `/api/students/{id}` - Delete student
- ✅ `ReadFromServer()` - GET `/api/students` - Import students from server
- ✅ `Sync()` - Syncs pending/waiting students with server

#### `src/lib/dexie/subjectServerAction.ts`
- ✅ `SaveToServer()` - POST/PUT `/api/subjects` - Save subject to server
- ✅ `DeleteFromServer()` - DELETE `/api/subjects/{id}` - Delete subject
- ✅ `ReadFromServer()` - GET `/api/subjects` - Import subjects from server
- ✅ `Sync()` - Syncs pending/waiting subjects with server

#### `src/lib/dexie/receiptServerAction.ts`
- ✅ `SaveToServer()` - POST `/api/receipts/student-payment` or `/api/receipts/teacher-payment` - Save receipt
- ✅ `DeleteFromServer()` - DELETE `/api/receipts/{id}` - Delete receipt
- ✅ `ReadFromServer()` - GET `/api/receipts` - Import receipts from server
- ✅ `Sync()` - Syncs pending/waiting receipts with server

#### `src/lib/dexie/scheduleServerAction.ts`
- ✅ `SaveToServer()` - POST `/api/admin/schedule` - Save schedule to server
- ✅ `DeleteFromServer()` - DELETE `/api/admin/schedule/{id}` - Delete schedule
- ✅ `ReadFromServer()` - GET `/api/admin/schedule` - Import schedules from server
- ✅ `Sync()` - Syncs pending/waiting schedules with server

---

### 3. **UI Components Using Server Actions**

#### `src/components/EntitySyncControls.tsx`
- ✅ Sync button - Calls `ServerAction{Entity}.Sync()` for each entity type
- ✅ Import button - Calls `ServerAction{Entity}.ImportFromServer()` for each entity type
- **Entities**: users, centers, teachers, students, subjects, receipts, schedules

#### `src/components/centerPresentation.tsx`
- ✅ `handleDebugCenterSync()` - Calls `ServerActionCenters.Sync()`

#### `src/lib/dexie/serverActions.ts`
- ✅ `syncAllEntities()` - Syncs all entities at once
- ✅ `importAllFromServer()` - Imports all entities from server
- ✅ `syncAllEntitiesForRole(isAdmin)` - Role-aware sync (excludes users for managers)
- ✅ `importAllFromServerForRole(isAdmin)` - Role-aware import

---

### 4. **Auto-Sync System** (Background Sync)

#### `src/hooks/useAutoSync.ts`
- ✅ **Automatic periodic sync** - Syncs every 5 minutes (configurable)
- ✅ **Sync on mount** - Syncs when app starts (default: enabled)
- ✅ **Sync on network reconnect** - Auto-syncs when connection restored
- ✅ **Sync before page unload** - Syncs when user closes tab/app
- ✅ **Import on mount** - Option to import all data from server on startup

#### `src/components/AutoSyncProvider.tsx`
- ✅ Wraps the app and enables auto-sync
- **Used in**:
  - `src/app/[locale]/admin/page.tsx`
  - `src/app/[locale]/manager/page.tsx`
  - `src/components/login-form.tsx`

**Auto-Sync Features:**
- Syncs all entities: users, centers, teachers, students, subjects, receipts, schedules
- Role-aware: Admins sync users, managers don't
- Network-aware: Only syncs when online
- Prevents concurrent syncs
- Configurable intervals and triggers

---

## 🟡 **COMMENTED OUT** (Not Currently Active)

Most components have commented out axios/fetch calls and now use IndexedDB instead:

### Components with Commented API Calls:
1. `TimeTableManagement.tsx` - All axios calls commented
2. `teacherWithSchedule.tsx` - All axios calls commented
3. `adminrevenue-chart.tsx` - axios.get commented
4. `managerrevenue-chart.tsx` - axios.get commented
5. `studentReceiptTable.tsx` - axios.get commented
6. `enrollement-chart.tsx` - axios.get commented
7. `studentCreationForm.tsx` - fetch calls commented
8. `student-card-content.tsx` - fetch commented
9. `all-users-table.tsx` - All axios calls commented
10. `adminReceiptPresenation.tsx` - axios.get commented
11. `createTeacherForm.tsx` - axios calls commented
12. `teacher-detail-content.tsx` - axios.get commented
13. `student-detail-content.tsx` - axios.get commented
14. `receiptPresenationui.tsx` - axios.get commented
15. `centersOverview.tsx` - axios.get commented
16. `managerStateCards.tsx` - axios.get commented
17. `adminStatsCards.tsx` - axios.get commented
18. `managersList.tsx` - axios.get commented
19. `systemActivitylog.tsx` - axios.get commented
20. `top-subjects.tsx` - axios.get commented
21. `teachersPresentation.tsx` - axios.get commented
22. `studentsPresentation.tsx` - axios.get commented
23. `TimeTableManagementRead.tsx` - All axios calls commented

---

## 📊 **Summary**

### Active Server Usage:
- **Authentication**: 5 endpoints (login, register, logout, check auth)
- **Data Sync**: 7 entity types × 3 operations (Save, Delete, Read) = 21 operations
- **Total Active API Endpoints**: ~26 endpoints

### Architecture Pattern:
- **Offline-First**: Most components use IndexedDB (local storage)
- **Sync on Demand**: Data syncs to server via `EntitySyncControls` or auto-sync hooks
- **Status Tracking**: Entities have status flags ('w' = waiting, 'd' = deleted, '1' = synced)

### Network Dependency:
- **Critical**: Authentication (login/logout) - Requires server
- **Optional**: Data sync - Works offline, syncs when online
- **Background**: Auto-sync is **ACTIVE** and syncs automatically:
  - Every 5 minutes (periodic)
  - On app startup
  - When network reconnects
  - Before page unload

---

## 🔧 **How to Disable Server Usage**

To make the app fully offline:

1. **Disable Auto-Sync**: 
   - Remove `<AutoSyncProvider />` from:
     - `src/app/[locale]/admin/page.tsx`
     - `src/app/[locale]/manager/page.tsx`
     - `src/components/login-form.tsx`
   - Or modify `AutoSyncProvider.tsx` to disable all sync options

2. **Remove Sync Controls**: Remove `EntitySyncControls` components from UI

3. **Skip Auth Check**: Modify `authContext.tsx` to skip `/api/auth/me` call (use local user data)

4. **Use Local Auth**: Modify login to use local user data only (already partially implemented)

---

## 📝 **Notes**

- Most data operations are now **offline-first** using IndexedDB
- Server calls are primarily for:
  - Initial authentication
  - Manual sync operations
  - Background synchronization (if enabled)
- The app can function **completely offline** except for initial login (if not using local auth)

