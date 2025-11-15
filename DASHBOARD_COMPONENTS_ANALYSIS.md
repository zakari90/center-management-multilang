# Dashboard Components Analysis - LocalDB Migration

## Current State Analysis

### Components on Manager Page (lines 30-39):
1. **ManagerStatsCards** - Uses `/api/dashboard/stats`
2. **ReceiptsSummary** - Uses `/api/receipts/stats`
3. **QuickActions** - No API calls (static links)
4. **ManagerRevenueChart** - Uses `/api/dashboard/revenue?period={period}`
5. **EnrollmentChart** - Uses `/api/dashboard/enrollments`
6. **TopSubjects** - Uses `/api/dashboard/top-subjects`

---

## API Routes Analysis

### 1. `/api/dashboard/stats` (ManagerStatsCards)
**Returns:**
```typescript
{
  totalStudents: number,
  totalTeachers: number,
  totalSubjects: number,
  totalRevenue: number,
  monthlyRevenue: number,
  totalReceipts: number,
  activeEnrollments: number,
  revenueGrowth: number
}
```

**Server Logic:**
- Counts: `db.student.count()`, `db.teacher.count()`, `db.subject.count()`, `db.studentSubject.count()`
- Filters receipts by `managerId: session.user.id`
- Calculates monthly revenue (STUDENT_PAYMENT receipts from current month)
- Calculates revenue growth (current month vs last month)
- Calculates total revenue (all STUDENT_PAYMENT receipts)

**LocalDB Equivalent:**
- Use `studentActions.getAll()`, `teacherActions.getAll()`, `subjectActions.getAll()`, `studentSubjectActions.getAll()`
- Filter by `managerId` and `status !== '0'` (exclude deleted)
- Filter receipts by `managerId` and `status !== '0'`
- Calculate dates using JavaScript Date objects

---

### 2. `/api/receipts/stats` (ReceiptsSummary)
**Returns:**
```typescript
{
  totalReceipts: number,
  totalRevenue: number,
  studentPayments: number,
  teacherPayments: number,
  thisMonthRevenue: number
}
```

**Server Logic:**
- Filters receipts by `managerId: session.user.id`
- Groups by type (STUDENT_PAYMENT vs TEACHER_PAYMENT)
- Calculates this month's revenue

**LocalDB Equivalent:**
- Use `receiptActions.getAll()` filtered by `managerId` and `status !== '0'`
- Filter by type and date ranges

---

### 3. `/api/dashboard/revenue?period={period}` (ManagerRevenueChart)
**Returns:**
```typescript
Array<{
  date: string,
  income: number,
  expense: number,
  net: number
}>
```

**Server Logic:**
- Filters receipts by `managerId` and date range (week/month/year)
- Groups by date (formatted)
- Separates income (STUDENT_PAYMENT) and expense (TEACHER_PAYMENT)
- Calculates net (income - expense)

**LocalDB Equivalent:**
- Use `receiptActions.getAll()` filtered by `managerId`, `status !== '0'`, and date range
- Group by date using JavaScript
- Use `date-fns` for date formatting (already imported in API route)

---

### 4. `/api/dashboard/enrollments` (EnrollmentChart)
**Returns:**
```typescript
Array<{
  subject: string,
  students: number,
  revenue: number
}>
```

**Server Logic:**
- Groups `studentSubjects` by `subjectId`
- Counts students per subject
- Joins with `subjects` to get name and price
- Calculates revenue = price * student count
- Sorts by students (descending)
- Takes top 6

**LocalDB Equivalent:**
- Use `studentSubjectActions.getAll()` filtered by `status !== '0'`
- Use `subjectActions.getAll()` to get subject details
- Group and count in JavaScript
- Join data manually
- Sort and slice

---

### 5. `/api/dashboard/top-subjects` (TopSubjects)
**Returns:**
```typescript
Array<{
  id: string,
  name: string,
  grade: string,
  students: number,
  revenue: number,
  maxCapacity: number
}>
```

**Server Logic:**
- Gets all subjects with `studentSubjects` included
- Maps to calculate: students count, revenue (price * students)
- Filters subjects with students > 0
- Sorts by revenue (descending)
- Takes top 5
- Sets maxCapacity = 30 (hardcoded)

**LocalDB Equivalent:**
- Use `subjectActions.getAll()` and `studentSubjectActions.getAll()`
- Filter by `status !== '0'`
- Join manually
- Calculate and sort in JavaScript

---

## DexieActions Available

### From `_dexieActions.ts`:
```typescript
// All entities have these methods:
- getAll(): Promise<T[]> // Get all, sorted by updatedAt desc
- getByStatus(statuses: ('1' | 'w' | '0')[]): Promise<T[]>
- getLocal(id: string): Promise<T | undefined>
- bulkGetLocal(ids: string[]): Promise<(T | undefined)[]>
- putLocal(item: T): Promise<string>
- bulkPutLocal(items: T[]): Promise<string[]>
- deleteLocal(id: string): Promise<void>
- markForDelete(id: string): Promise<void>
- markSynced(id: string): Promise<void>
- getSyncTargets(): Promise<SyncTargets<T>>
- getPendingSync(): Promise<T[]>
```

### Available Actions:
- `studentActions` - has `getLocalByEmail`
- `teacherActions` - has `getLocalByEmail`
- `subjectActions`
- `receiptActions`
- `studentSubjectActions`
- `teacherSubjectActions`
- `centerActions`
- `userActions` - has `getLocalByEmail`
- `scheduleActions`

---

## Implementation Strategy

### Helper Functions Needed:

1. **Get Current User** - From `useAuth()` context
2. **Filter by Manager** - Filter arrays by `managerId === user.id`
3. **Filter by Status** - Exclude `status === '0'` (deleted)
4. **Date Calculations** - Use JavaScript Date for month calculations
5. **Grouping & Aggregation** - Use JavaScript array methods (reduce, filter, map)

### Example Implementation Pattern:

```typescript
// Pattern for fetching from localDB
const fetchStatsFromLocalDB = async () => {
  const { user } = useAuth();
  if (!user) return null;

  // Get all data
  const [students, teachers, subjects, receipts, studentSubjects] = await Promise.all([
    studentActions.getAll(),
    teacherActions.getAll(),
    subjectActions.getAll(),
    receiptActions.getAll(),
    studentSubjectActions.getAll(),
  ]);

  // Filter by manager and status
  const managerStudents = students.filter(s => 
    s.managerId === user.id && s.status !== '0'
  );
  const managerTeachers = teachers.filter(t => 
    t.managerId === user.id && t.status !== '0'
  );
  const managerReceipts = receipts.filter(r => 
    r.managerId === user.id && r.status !== '0'
  );
  const activeEnrollments = studentSubjects.filter(ss => 
    ss.status !== '0' && managerStudents.some(s => s.id === ss.studentId)
  );

  // Calculate stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthReceipts = managerReceipts.filter(r => 
    new Date(r.date) >= firstDayOfMonth && r.type === 'STUDENT_PAYMENT'
  );
  const lastMonthReceipts = managerReceipts.filter(r => {
    const receiptDate = new Date(r.date);
    return receiptDate >= firstDayOfLastMonth && 
           receiptDate <= lastDayOfLastMonth && 
           r.type === 'STUDENT_PAYMENT';
  });

  const monthlyRevenue = thisMonthReceipts.reduce((sum, r) => sum + r.amount, 0);
  const lastMonthRevenue = lastMonthReceipts.reduce((sum, r) => sum + r.amount, 0);
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0;
  const totalRevenue = managerReceipts
    .filter(r => r.type === 'STUDENT_PAYMENT')
    .reduce((sum, r) => sum + r.amount, 0);

  return {
    totalStudents: managerStudents.length,
    totalTeachers: managerTeachers.length,
    totalSubjects: subjects.filter(s => s.status !== '0').length,
    totalRevenue,
    monthlyRevenue,
    totalReceipts: managerReceipts.length,
    activeEnrollments: activeEnrollments.length,
    revenueGrowth
  };
};
```

---

## Files That Need Changes

### Components to Update:
1. ✅ `src/components/managerStateCards.tsx` - Replace axios with localDB
2. ✅ `src/components/receiptSummary.tsx` - Replace fetch with localDB
3. ✅ `src/components/managerrevenue-chart.tsx` - Replace axios with localDB
4. ✅ `src/components/enrollement-chart.tsx` - Replace axios with localDB
5. ✅ `src/components/top-subjects.tsx` - Replace axios with localDB
6. ✅ `src/components/quickActions.tsx` - No changes needed (static)

### Helper Functions to Create:
- `src/lib/utils/dashboardStats.ts` - Shared calculation functions

---

## Key Considerations

### 1. **Manager Filtering**
- All queries must filter by `managerId === user.id`
- Admins might see all data (check role)

### 2. **Status Filtering**
- Always exclude `status === '0'` (deleted items)
- Include both `'1'` (synced) and `'w'` (waiting) items

### 3. **Date Handling**
- Receipt dates are stored as `number` (timestamp) in localDB
- Convert to Date objects: `new Date(receipt.date)`
- Use JavaScript Date methods for month calculations

### 4. **Performance**
- Use `Promise.all()` for parallel fetches
- Filter in memory (Dexie is fast)
- Consider caching if needed

### 5. **Data Consistency**
- Ensure data is loaded before calculations
- Handle empty states gracefully
- Show loading states during fetch

---

## Implementation Checklist

- [ ] Create helper function for dashboard stats calculation
- [ ] Update ManagerStatsCards to use localDB
- [ ] Update ReceiptsSummary to use localDB
- [ ] Update ManagerRevenueChart to use localDB
- [ ] Update EnrollmentChart to use localDB
- [ ] Update TopSubjects to use localDB
- [ ] Test all components with localDB data
- [ ] Verify calculations match API results
- [ ] Handle edge cases (empty data, offline, etc.)

---

## Notes

- **QuickActions** component doesn't need changes (no API calls)
- All date calculations should use JavaScript Date objects
- Revenue calculations should handle both STUDENT_PAYMENT and TEACHER_PAYMENT types
- Status filtering is critical - don't count deleted items
- Manager filtering ensures users only see their own data

