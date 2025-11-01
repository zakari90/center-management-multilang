# Prisma & Dexie Schema Compatibility

## ✅ Schema Alignment Complete

### Prisma Schema (MongoDB)
- Uses MongoDB ObjectId (`@db.ObjectId`, `@map("_id")`)
- All IDs stored as strings in Prisma Client
- Fields match exactly with Dexie

### Dexie Schema (IndexedDB)
- All IDs stored as strings (matches Prisma)
- Added `syncStatus` field for offline sync tracking
- All required fields from Prisma are present

## Field Mapping

### User
- ✅ `id: string` (ObjectId)
- ✅ `email: string`
- ✅ `password: string` (hashed)
- ✅ `name: string`
- ✅ `role: Role` (ADMIN | MANAGER)
- ✅ `createdAt: DateTime`
- ✅ `updatedAt: DateTime`

### Center
- ✅ `id: string`
- ✅ `name: string`
- ✅ `address?: string`
- ✅ `phone?: string`
- ✅ `classrooms: string[]`
- ✅ `workingDays: string[]`
- ✅ `managers: string[]`
- ✅ `adminId: string`
- ✅ `createdAt: DateTime`
- ✅ `updatedAt: DateTime`

### Student
- ✅ `id: string`
- ✅ `name: string`
- ✅ `email?: string`
- ✅ `phone?: string`
- ✅ `parentName?: string`
- ✅ `parentPhone?: string`
- ✅ `parentEmail?: string`
- ✅ `grade?: string`
- ✅ `managerId: string`
- ✅ `createdAt: DateTime`
- ✅ `updatedAt: DateTime`

### Teacher
- ✅ `id: string`
- ✅ `name: string`
- ✅ `email?: string`
- ✅ `phone?: string`
- ✅ `address?: string`
- ✅ `weeklySchedule?: Json` (stored as `any`)
- ✅ `managerId: string`
- ✅ `createdAt: DateTime`
- ✅ `updatedAt: DateTime`

### Subject
- ✅ `id: string`
- ✅ `name: string`
- ✅ `grade: string`
- ✅ `price: number`
- ✅ `duration?: number`
- ✅ `centerId: string`
- ✅ `createdAt: DateTime`
- ✅ `updatedAt: DateTime`

### Receipt
- ✅ `id: string`
- ✅ `receiptNumber: string` (unique)
- ✅ `amount: number`
- ✅ `type: ReceiptType` (STUDENT_PAYMENT | TEACHER_PAYMENT)
- ✅ `description?: string`
- ✅ `paymentMethod?: string`
- ✅ `date: DateTime`
- ✅ `studentId?: string` (nullable)
- ✅ `teacherId?: string` (nullable)
- ✅ `managerId: string`
- ✅ `createdAt: DateTime`

### Schedule
- ✅ `id: string`
- ✅ `day: string`
- ✅ `startTime: string`
- ✅ `endTime: string`
- ✅ `roomId: string`
- ✅ `teacherId: string`
- ✅ `subjectId: string`
- ✅ `managerId: string`
- ✅ `centerId?: string` (nullable)
- ✅ `createdAt: DateTime`
- ✅ `updatedAt: DateTime`

### TeacherSubject
- ✅ `id: string`
- ✅ `percentage?: number`
- ✅ `hourlyRate?: number`
- ✅ `assignedAt: DateTime`
- ✅ `teacherId: string`
- ✅ `subjectId: string`

### StudentSubject
- ✅ `id: string`
- ✅ `enrolledAt: DateTime`
- ✅ `studentId: string`
- ✅ `subjectId: string`
- ✅ `teacherId: string`

## Authentication Architecture

### Server-Side (API Routes, Middleware, Server Components)
- ✅ Uses `getSession()` from `@/lib/authentication`
- ✅ Reads JWT from cookies (httpOnly)
- ✅ Works only server-side (correct usage)

### Client-Side (Offline Operations)
- ✅ Uses `getClientUser()` / `getClientUserId()` from `@/lib/clientAuth`
- ✅ Reads from Dexie (IndexedDB)
- ✅ Works offline without cookies
- ✅ Automatically syncs with AuthContext on login

## Data Flow

### Online Login
1. User logs in → Server validates → Creates JWT session cookie
2. User data returned → AuthContext stores in state
3. `setClientUser()` stores in Dexie for offline access

### Offline Login
1. User logs in → Checks Dexie for user by email
2. Validates password hash → Returns user from Dexie
3. `setClientUser()` updates user as logged in

### Offline Operations
1. `getClientUserId()` reads from Dexie
2. Uses stored user ID for offline creates/updates
3. Queues operations in syncQueue
4. Syncs when back online

## ✅ All Schemas Verified Compatible

