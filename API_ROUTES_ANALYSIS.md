# API Routes Analysis - Unused & Duplicated Routes

## Analysis Date: Generated automatically

## Summary
- **Total API Routes**: 46
- **Used Routes**: ~25
- **Unused Routes**: ~15
- **Duplicated Routes**: ~6

---

## 🔴 DUPLICATED ROUTES

### 1. **Centers - Duplicate Endpoints**
- ✅ `/api/center` (POST, GET, PATCH, DELETE) - **USED** in server actions
- ❌ `/api/admin/centers` (GET) - **DUPLICATE** - Similar to `/api/center` GET but with stats
  - **Used in**: `TimeTableManagementRead.tsx`, `centersOverview.tsx`
  - **Recommendation**: Keep both if stats are needed, otherwise merge

### 2. **Teachers - Duplicate Endpoints**
- ✅ `/api/teachers` (POST, GET) - **USED** in server actions, components
- ❌ `/api/admin/teachers` (GET) - **DUPLICATE** - Returns same data with stats
  - **Used in**: `all-users-table.tsx`, `TimeTableManagementRead.tsx`, `teacherWithSchedule.tsx`
  - **Recommendation**: Merge into `/api/teachers` with optional stats parameter

### 3. **Students - Duplicate Endpoints**
- ✅ `/api/students` (POST, GET) - **USED** in server actions, components
- ❌ `/api/admin/students` (GET) - **DUPLICATE** - Returns same data with stats
  - **Used in**: `all-users-table.tsx`
  - **Recommendation**: Merge into `/api/students` with optional stats parameter

### 4. **Users/Managers - Duplicate Endpoints**
- ✅ `/api/admin/users` (GET, POST) - **USED** in server actions, components
- ❌ `/api/admin/managers` (GET) - **DUPLICATE** - Returns managers only (subset of users)
  - **Used in**: `managersList.tsx`
  - **Recommendation**: Use `/api/admin/users?role=MANAGER` instead

### 5. **Dashboard Stats - Duplicate Endpoints**
- ❌ `/api/dashboard/stats` - **USED** in `managerStateCards.tsx`
- ❌ `/api/admin/dashboard/stats` - **DUPLICATE** - Admin version
  - **Used in**: `adminStatsCards.tsx`
  - **Recommendation**: Use single endpoint with role-based filtering

- ❌ `/api/dashboard/revenue` - **USED** in `managerrevenue-chart.tsx`
- ❌ `/api/admin/dashboard/revenue` - **DUPLICATE** - Admin version
  - **Used in**: `adminrevenue-chart.tsx`
  - **Recommendation**: Use single endpoint with role-based filtering

- ❌ `/api/dashboard/activities` - **USED** in `recent-activities.tsx`
- ❌ `/api/admin/dashboard/activities` - **DUPLICATE** - Admin version
  - **Used in**: `systemActivitylog.tsx`
  - **Recommendation**: Use single endpoint with role-based filtering

---

## 🟡 UNUSED ROUTES (Not called anywhere)

### Authentication Routes
1. ❌ `/api/auth/register` - **UNUSED**
   - **Status**: Not called in codebase
   - **Recommendation**: Remove if registration is handled elsewhere

2. ❌ `/api/auth/login` - **UNUSED** (replaced by `/api/manager/login` and admin login)
   - **Status**: Not called in codebase
   - **Recommendation**: Remove if not needed

### Admin Routes
3. ❌ `/api/admin/users/[id]/toggle-status` - **UNUSED**
   - **Status**: Not called in codebase
   - **Recommendation**: Remove if status toggle not implemented

4. ❌ `/api/admin/delete-all` - **USED** in `masterDelete.tsx` but dangerous
   - **Status**: Used but should be protected/removed
   - **Recommendation**: Add strong protection or remove

### Receipt Routes
5. ❌ `/api/receipts/[id]/payment-calculation` - **UNUSED**
   - **Status**: Not called in codebase
   - **Recommendation**: Remove if not needed

### Sync Routes
6. ❌ `/api/sync/batch` - **UNUSED**
   - **Status**: Not called in codebase
   - **Recommendation**: Remove if batch sync not implemented

### Push Notification Routes
7. ✅ `/api/send-push` - **USED** (but not called directly - may be called server-side)
   - **Status**: Route exists and is functional, but no direct client calls found
   - **Recommendation**: Keep if used for server-side push notifications

8. ✅ `/api/subscribe` - **USED** in `pushSeviceSubscription.tsx`
   - **Status**: Used for push notification subscriptions
   - **Recommendation**: Keep

### Student Subjects Route
9. ❌ `/api/student-subjects/[id]` - **UNUSED**
   - **Status**: Not called in codebase
   - **Recommendation**: Remove if student-subject management not needed

### Dashboard Routes
10. ❌ `/api/admin/dashboard/performance` - **UNUSED**
    - **Status**: Not called in codebase
    - **Recommendation**: Remove if not needed

---

## ✅ ACTIVELY USED ROUTES

### Authentication
- ✅ `/api/auth/me` - Used in `authContext.tsx`
- ✅ `/api/auth/logout` - Used in `authContext.tsx`
- ✅ `/api/manager/login` - Used in `actions.ts`
- ✅ `/api/manager/register` - Used in `userServerAction.ts`

### Centers
- ✅ `/api/center` - Used in `centerServerAction.ts`

### Users/Managers
- ✅ `/api/admin/users` - Used in `userServerAction.ts`, `all-users-table.tsx`
- ✅ `/api/admin/users/[id]` - Used in `all-users-table.tsx` (PUT, DELETE)

### Teachers
- ✅ `/api/teachers` - Used in `teacherServerAction.ts`, `teachersPresentation.tsx`
- ✅ `/api/teachers/[id]` - Used in `teacher-detail-content.tsx`, edit pages
- ✅ `/api/teachers/[id]/payment-calculation` - Used in `create-teacher-payment/page.tsx`

### Students
- ✅ `/api/students` - Used in `studentServerAction.ts`, `studentsPresentation.tsx`
- ✅ `/api/students/[id]` - Used in `student-detail-content.tsx`, edit pages

### Subjects
- ✅ `/api/subjects` - Used in `subjectServerAction.ts`, multiple components

### Receipts
- ✅ `/api/receipts/student-payment` - Used in `receiptServerAction.ts`
- ✅ `/api/receipts/teacher-payment` - Used in `receiptServerAction.ts`, `create-teacher-payment/page.tsx`
- ✅ `/api/receipts` - Used in `adminReceiptPresenation.tsx`, `receiptPresenationui.tsx`
- ✅ `/api/receipts/[id]` - Used in `receipt-detail-content.tsx`
- ✅ `/api/receipts/stats` - Used in `receiptSummary.tsx`
- ✅ `/api/receipts/student-receipts` - Used in `studentReceiptTable.tsx`

### Schedules
- ✅ `/api/admin/schedule` - Used in `scheduleServerAction.ts`, `TimeTableManagementRead.tsx`
- ✅ `/api/admin/schedule/[id]` - Used in `scheduleServerAction.ts`

### Dashboard (Manager)
- ✅ `/api/dashboard/stats` - Used in `managerStateCards.tsx`
- ✅ `/api/dashboard/revenue` - Used in `managerrevenue-chart.tsx`
- ✅ `/api/dashboard/activities` - Used in `recent-activities.tsx`
- ✅ `/api/dashboard/top-subjects` - Used in `top-subjects.tsx`
- ✅ `/api/dashboard/enrollments` - Used in `enrollement-chart.tsx`

### Dashboard (Admin)
- ✅ `/api/admin/dashboard/stats` - Used in `adminStatsCards.tsx`
- ✅ `/api/admin/dashboard/revenue` - Used in `adminrevenue-chart.tsx`
- ✅ `/api/admin/dashboard/activities` - Used in `systemActivitylog.tsx`

---

## 📋 RECOMMENDATIONS

### High Priority
1. **Merge duplicate endpoints**:
   - `/api/teachers` + `/api/admin/teachers` → Single endpoint with role-based filtering
   - `/api/students` + `/api/admin/students` → Single endpoint with role-based filtering
   - `/api/dashboard/*` + `/api/admin/dashboard/*` → Single endpoints with role-based filtering

2. **Remove unused routes**:
   - `/api/auth/register` (if not needed)
   - `/api/auth/login` (if replaced)
   - `/api/admin/users/[id]/toggle-status`
   - `/api/receipts/[id]/payment-calculation`
   - `/api/sync/batch`
   - `/api/send-push` (if not implemented)
   - `/api/student-subjects/[id]`
   - `/api/admin/dashboard/performance`

3. **Protect dangerous routes**:
   - `/api/admin/delete-all` - Add strong authentication/authorization

### Medium Priority
4. **Consolidate admin routes**:
   - Consider using query parameters instead of separate `/admin/*` routes
   - Example: `/api/users?role=MANAGER` instead of `/api/admin/managers`

5. **Document API structure**:
   - Create API documentation
   - Mark routes as deprecated before removal

---

## 🔍 DETAILED ROUTE LIST

### Authentication (4 routes)
1. ✅ `/api/auth/me` - **USED**
2. ✅ `/api/auth/logout` - **USED**
3. ❌ `/api/auth/login` - **UNUSED**
4. ❌ `/api/auth/register` - **UNUSED**

### Manager Routes (3 routes)
5. ✅ `/api/manager/login` - **USED** in `actions.ts`
6. ✅ `/api/manager/register` - **USED** in `userServerAction.ts`
7. ✅ `/api/manager` - **USED** (GET, PUT, DELETE) - Manager CRUD operations

### Center Routes (2 routes)
8. ✅ `/api/center` - **USED**
9. 🟡 `/api/admin/centers` - **DUPLICATE** (different format with stats)

### User/Manager Routes (4 routes)
10. ✅ `/api/admin/users` - **USED**
11. ✅ `/api/admin/users/[id]` - **USED**
12. ❌ `/api/admin/users/[id]/toggle-status` - **UNUSED**
13. 🟡 `/api/admin/managers` - **DUPLICATE** (subset of users)

### Teacher Routes (4 routes)
14. ✅ `/api/teachers` - **USED**
15. ✅ `/api/teachers/[id]` - **USED**
16. ✅ `/api/teachers/[id]/payment-calculation` - **USED**
17. 🟡 `/api/admin/teachers` - **DUPLICATE**

### Student Routes (3 routes)
18. ✅ `/api/students` - **USED**
19. ✅ `/api/students/[id]` - **USED**
20. 🟡 `/api/admin/students` - **DUPLICATE**

### Subject Routes (1 route)
21. ✅ `/api/subjects` - **USED**

### Receipt Routes (7 routes)
22. ✅ `/api/receipts` - **USED**
23. ✅ `/api/receipts/student-payment` - **USED**
24. ✅ `/api/receipts/teacher-payment` - **USED**
25. ✅ `/api/receipts/[id]` - **USED**
26. ✅ `/api/receipts/stats` - **USED**
27. ✅ `/api/receipts/student-receipts` - **USED**
28. ❌ `/api/receipts/[id]/payment-calculation` - **UNUSED**

### Schedule Routes (2 routes)
29. ✅ `/api/admin/schedule` - **USED**
30. ✅ `/api/admin/schedule/[id]` - **USED**

### Dashboard Routes - Manager (5 routes)
31. ✅ `/api/dashboard/stats` - **USED**
32. ✅ `/api/dashboard/revenue` - **USED**
33. ✅ `/api/dashboard/activities` - **USED**
34. ✅ `/api/dashboard/top-subjects` - **USED**
35. ✅ `/api/dashboard/enrollments` - **USED**

### Dashboard Routes - Admin (4 routes)
36. ✅ `/api/admin/dashboard/stats` - **USED** (duplicate)
37. ✅ `/api/admin/dashboard/revenue` - **USED** (duplicate)
38. ✅ `/api/admin/dashboard/activities` - **USED** (duplicate)
39. ❌ `/api/admin/dashboard/performance` - **UNUSED**

### Other Routes (5 routes)
40. ❌ `/api/sync/batch` - **UNUSED** (batch sync not implemented in client)
41. ✅ `/api/send-push` - **USED** (server-side push notifications)
42. ✅ `/api/subscribe` - **USED** in `pushSeviceSubscription.tsx`
43. ❌ `/api/student-subjects/[id]` - **UNUSED**
44. ⚠️ `/api/admin/delete-all` - **USED** in `masterDelete.tsx` (DANGEROUS - needs protection)

---

## 🎯 ACTION ITEMS

### Immediate Actions
1. ✅ Comment out unused routes (mark as deprecated)
2. ✅ Merge duplicate routes where possible
3. ✅ Add protection to `/api/admin/delete-all`
4. ✅ Verify `/api/subscribe` usage

### Future Refactoring
1. Consolidate admin/manager routes using query parameters
2. Create unified dashboard endpoints with role-based filtering
3. Remove deprecated routes after migration period

