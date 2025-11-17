# Commented API Usage Report

## Summary
This report documents all commented API calls in the codebase and their status.

## Server Actions Status ✅
**All server action files are correctly using `fetch()` to sync with the server.**
- ✅ `centerServerAction.ts` - Uses `fetch()` for syncing (correct)
- ✅ `receiptServerAction.ts` - Uses `fetch()` for syncing (correct)
- ✅ `teacherServerAction.ts` - Uses `fetch()` for syncing (correct)
- ✅ `studentServerAction.ts` - Uses `fetch()` for syncing (correct)
- ✅ `subjectServerAction.ts` - Uses `fetch()` for syncing (correct)
- ✅ `scheduleServerAction.ts` - Uses `fetch()` for syncing (correct)
- ✅ `userServerAction.ts` - Uses `fetch()` for syncing (correct)

**Note:** Server actions are meant to sync local DB with the server, so using `fetch()` is correct.

## Components with Commented API Calls

### ✅ Successfully Migrated to Local DB
These components have commented axios calls and are now using local DB:

1. **teacherWithSchedule.tsx**
   - Commented: `axios.get('/api/admin/teachers')`, `axios.get('/api/admin/schedule')`
   - Status: ✅ Now using `teacherActions`, `scheduleActions`, `subjectActions`

2. **adminReceiptPresenation.tsx**
   - Commented: `axios.get('/api/receipts')`
   - Status: ✅ Now using `receiptActions`, `studentActions`, `teacherActions`, `userActions`

3. **studentsPresentation.tsx**
   - Commented: `axios.get("/api/students")`
   - Status: ✅ Now using local DB

4. **teachersPresentation.tsx**
   - Commented: `axios.get('/api/teachers')`
   - Status: ✅ Now using local DB

5. **studentReceiptTable.tsx**
   - Commented: `axios.get('/api/receipts/student-receipts')`, `axios.get('/api/students')`
   - Status: ✅ Now using local DB

6. **TimeTableManagement.tsx**
   - Commented: Multiple axios calls for teachers, subjects, schedules, centers
   - Status: ✅ Now using local DB

7. **receiptPresenationui.tsx**
   - Commented: `axios.get('/api/receipts')`
   - Status: ✅ Now using local DB

8. **managerStateCards.tsx**
   - Commented: `axios.get('/api/dashboard/stats')`
   - Status: ✅ Now using local DB

9. **enrollement-chart.tsx**
   - Commented: `axios.get('/api/dashboard/enrollments')`
   - Status: ✅ Now using local DB

10. **managerrevenue-chart.tsx**
    - Commented: `axios.get('/api/dashboard/revenue?period=...')`
    - Status: ✅ Now using local DB

11. **top-subjects.tsx**
    - Commented: `axios.get('/api/dashboard/top-subjects')`
    - Status: ✅ Now using local DB

12. **createTeacherForm.tsx**
    - Commented: `axios.get("/api/subjects")`, `axios.post("/api/teachers", ...)`
    - Status: ✅ Now using local DB

13. **studentPaymentForm2.tsx**
    - Commented: `axios.get("/api/students")`, `axios.post("/api/receipts/student-payment", ...)`
    - Status: ✅ Now using local DB

14. **create-teacher-payment/page.tsx**
    - Commented: Multiple axios calls
    - Status: ✅ Now using local DB

### ⚠️ Still Using API Calls (Not Migrated Yet)
These components still have active axios calls:

1. **all-users-table.tsx**
   - Active: `axios.get('/api/admin/users')`, `axios.get('/api/admin/teachers')`, `axios.get('/api/admin/students')`
   - Commented: `axios.post('/api/admin/users', ...)`
   - Status: ⚠️ Partially migrated

2. **adminStatsCards.tsx**
   - Active: `axios.get('/api/admin/dashboard/stats')`
   - Status: ⚠️ Still using API

3. **systemActivitylog.tsx**
   - Active: `axios.get('/api/admin/dashboard/activities')`
   - Status: ⚠️ Still using API

4. **student-detail-content.tsx**
   - Active: `axios.get('/api/students/${studentId}')`
   - Status: ⚠️ Still using API

5. **teacher-detail-content.tsx**
   - Active: `axios.get('/api/teachers/${teacherId}')`
   - Status: ⚠️ Still using API

6. **managersList.tsx**
   - Active: `axios.get('/api/admin/managers')`
   - Status: ⚠️ Still using API

7. **centersOverview.tsx**
   - Active: `axios.get('/api/admin/centers')`
   - Status: ⚠️ Still using API

8. **TimeTableManagementRead.tsx**
   - Active: Multiple axios calls
   - Status: ⚠️ Still using API

9. **adminrevenue-chart.tsx**
   - Active: `axios.get('/api/admin/dashboard/revenue?period=...')`
   - Status: ⚠️ Still using API

10. **recent-activities.tsx**
    - Active: `axios.get('/api/dashboard/activities')`
    - Status: ⚠️ Still using API

## Recommendations

### ✅ Safe to Remove
The commented axios calls in successfully migrated components can be removed for cleaner code:
- `teacherWithSchedule.tsx` (lines 564-565)
- `adminReceiptPresenation.tsx` (line 126)
- Other successfully migrated components

### ⚠️ Needs Migration
Components still using axios should be migrated to local DB:
- `all-users-table.tsx`
- `adminStatsCards.tsx`
- `systemActivitylog.tsx`
- `student-detail-content.tsx`
- `teacher-detail-content.tsx`
- `managersList.tsx`
- `centersOverview.tsx`
- `TimeTableManagementRead.tsx`
- `adminrevenue-chart.tsx`
- `recent-activities.tsx`

## Server Actions - No Issues Found ✅
All server action files are correctly implemented:
- They use `fetch()` (not axios) for server communication
- They handle sync operations properly
- No commented code that needs attention

