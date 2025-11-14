# User Storage Architecture

## 📋 Overview

The app uses a **multi-layered storage architecture** for users, supporting offline-first functionality with automatic synchronization:

1. **Local Storage (IndexedDB/Dexie)** - Primary storage for offline access
2. **Server Storage (PostgreSQL/Prisma)** - Authoritative source of truth
3. **Session Storage (JWT Cookies)** - Authentication state
4. **In-Memory (React Context)** - Runtime user state

---

## 🗄️ Storage Layers

### 1. **Local Storage (IndexedDB via Dexie.js)**

**Location**: `src/lib/dexie/dbSchema.ts`

**Schema**:
```typescript
export interface User extends SyncEntity {
  id: string;
  email: string;
  password: string;  // ⚠️ Stored as plain text locally (for offline login)
  name: string;
  role: Role;        // ADMIN | MANAGER
  status: SyncStatus; // '1' (synced) | 'w' (waiting) | '0' (deleted)
  createdAt: number;
  updatedAt: number;
}
```

**Operations**:
- `userActions.putLocal(user)` - Store/update user locally
- `userActions.getLocal(id)` - Get user by ID
- `userActions.getLocalByEmail(email)` - Get user by email
- `userActions.getAll()` - Get all users
- `userActions.getByStatus(['w', '0'])` - Get users pending sync
- `userActions.deleteLocal(id)` - Delete user locally
- `userActions.markSynced(id)` - Mark as synced
- `userActions.markForDelete(id)` - Soft delete (mark for deletion)

**Purpose**:
- ✅ Enable offline login
- ✅ Store user data for offline access
- ✅ Queue changes for sync when online
- ✅ Fast local lookups

**Storage Location**: Browser IndexedDB (persistent, ~50MB+ limit)

---

### 2. **Server Storage (PostgreSQL via Prisma)**

**Location**: `src/lib/db.ts` (Prisma client)

**Schema** (Prisma):
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hashed with bcrypt
  name      String
  role      Role     // ADMIN | MANAGER
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  administeredCenters Center[]
  managedStudents     Student[]
  managedTeachers     Teacher[]
}
```

**API Endpoints**:
- `GET /api/admin/users` - Get all managers (admin only)
- `POST /api/admin/users` - Create/verify admin user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `POST /api/manager/register` - Register new manager (admin only)

**Purpose**:
- ✅ Authoritative source of truth
- ✅ Centralized user management
- ✅ Secure password hashing (bcrypt)
- ✅ Multi-device synchronization

**Storage Location**: PostgreSQL database (server-side)

---

### 3. **Session Storage (JWT Cookies)**

**Location**: 
- Client: `src/lib/actionsClient.ts`
- Server: `src/lib/authentication.ts`

**Implementation**:
```typescript
// Client-side (js-cookie)
Cookies.set('session', jwtToken, {
  expires: 7,           // 7 days
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
})

// Server-side (httpOnly cookie)
cookies().set("session", jwtToken, {
  httpOnly: true,        // Not accessible via JavaScript
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
})
```

**JWT Payload**:
```typescript
{
  user: {
    id: string,
    name: string,
    email: string,
    role: 'ADMIN' | 'MANAGER'
  },
  iat: number  // Issued at timestamp
}
```

**Purpose**:
- ✅ Maintain authentication state
- ✅ Secure session management
- ✅ Server-side authentication checks
- ✅ Cross-request user identification

**Storage Location**: Browser cookies (client-side) + Server memory (session)

---

### 4. **In-Memory (React Context)**

**Location**: `src/context/authContext.tsx`

**State**:
```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshSession: () => Promise<void>;
}
```

**Purpose**:
- ✅ Runtime user state management
- ✅ React component access to user data
- ✅ Automatic UI updates on auth changes
- ✅ Client-side authentication checks

**Storage Location**: React Context (in-memory, lost on page refresh)

---

## 🔄 User Flow & Storage Operations

### **1. User Registration/Creation**

#### Admin Creates Manager (Offline-First)
```typescript
// 1. Create in local DB
const newManager = {
  id: generateObjectId(),
  email: "manager@example.com",
  password: "plaintext",  // Stored as plain text locally
  name: "Manager Name",
  role: Role.MANAGER,
  status: 'w',  // Waiting for sync
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
await userActions.putLocal(newManager);

// 2. Update center's managers array
await centerActions.putLocal({
  ...center,
  managers: [...center.managers, newManager.id]
});

// 3. Sync to server (when online)
// Auto-sync will push this to /api/manager/register
```

#### Server-Side Storage
```typescript
// API: POST /api/manager/register
const user = await db.user.create({
  data: {
    id: providedId,  // Use client-provided ID
    email,
    password: plaintext,  // Will be hashed if needed
    name: username,
    role: "MANAGER",
  },
});
// Password is stored as-is (not hashed) for manager accounts
```

---

### **2. User Login**

#### Offline-First Login Flow
```typescript
// 1. Check local DB first
const localUser = await userActions.getLocalByEmail(email);

if (!localUser) {
  return { error: "User not found" };
}

// 2. Verify password (plain text comparison locally)
if (localUser.password !== password) {
  return { error: "Incorrect password" };
}

// 3. Create session (JWT)
const session = await encrypt({ user: localUser });
Cookies.set('session', session, { expires: 7 });

// 4. Try online sync (if available)
if (isOnline()) {
  const result = await loginManager(state, formData);
  if (result.success) {
    // Update local user with server data
    await userActions.putLocal({
      ...localUser,
      ...result.data.user,
      status: '1',  // Mark as synced
    });
  }
}

// 5. Return success (works offline!)
return { success: true, data: { user: localUser } };
```

#### Server-Side Login
```typescript
// API: POST /api/manager/login or /api/admin/users
const user = await db.user.findUnique({ where: { email } });

// Verify password (bcrypt comparison for admin, plain for manager)
const isValid = await bcrypt.compare(password, user.password);

if (isValid) {
  // Create httpOnly cookie
  const session = await encrypt({ user });
  cookies().set("session", session, { httpOnly: true });
  return { success: true, user };
}
```

---

### **3. User Synchronization**

#### Sync Local → Server
```typescript
// Location: src/lib/dexie/userServerAction.ts

// 1. Get users pending sync
const waitingUsers = await userActions.getByStatus(['w', '0']);

// 2. For each user:
for (const user of waitingUsers) {
  if (user.status === '0') {
    // Delete on server
    await DeleteFromServer(user.id);
  } else if (user.status === 'w') {
    // Check if exists
    const exists = await CheckUserExists(user.id);
    
    if (exists) {
      // Update existing
      await UpdateOnServer(user);
    } else {
      // Create new
      await CreateOnServer(user);
    }
    
    // Mark as synced
    await userActions.markSynced(user.id);
  }
}
```

#### Sync Server → Local (Import)
```typescript
// 1. Fetch all users from server
const serverUsers = await fetch('/api/admin/users');

// 2. Transform to local format
const localUsers = serverUsers.map(transformServerUser);

// 3. Store in local DB
for (const user of localUsers) {
  await userActions.putLocal({
    ...user,
    status: '1',  // Mark as synced
  });
}
```

---

### **4. User Updates**

#### Local Update
```typescript
// Update in local DB
await userActions.putLocal({
  ...existingUser,
  name: "New Name",
  status: 'w',  // Mark as waiting for sync
  updatedAt: Date.now(),
});
```

#### Server Update
```typescript
// API: PUT /api/admin/users/[id]
await db.user.update({
  where: { id },
  data: { name, email, role, password },
});
```

---

### **5. User Deletion**

#### Soft Delete (Offline-First)
```typescript
// Mark for deletion locally
await userActions.markForDelete(userId);
// Status changes to '0', will be deleted on server during sync
```

#### Hard Delete (Server)
```typescript
// API: DELETE /api/admin/users/[id]
await db.user.delete({ where: { id } });
```

---

## 🔐 Security Considerations

### **Password Storage**

| Location | Storage Method | Security |
|----------|---------------|----------|
| **Local DB** | Plain text | ⚠️ Low (for offline login) |
| **Server DB** | Hashed (bcrypt) for admin, plain for manager | ✅ Medium-High |
| **Session** | JWT (no password) | ✅ High |

**Why Plain Text Locally?**
- Enables offline login
- Local DB is device-specific
- Passwords are hashed on server
- Consider encrypting local passwords in future

### **Session Security**

✅ **Server-side cookies**: `httpOnly: true` (not accessible via JavaScript)
⚠️ **Client-side cookies**: Accessible via JavaScript (for offline access)
✅ **JWT signing**: Uses secret key
✅ **HTTPS**: Secure cookies in production

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│   User Action   │
│  (Create/Login) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Local IndexedDB│  ← Primary storage (offline-first)
│   (Dexie.js)    │
└────────┬────────┘
         │
         ├─── Status: 'w' (waiting)
         │
         ▼
┌─────────────────┐
│  Auto-Sync      │  ← Background sync (every 5 min)
│  (useAutoSync)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Server API     │  ← Authoritative source
│  (PostgreSQL)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Update Local   │  ← Mark as synced ('1')
│  Status: '1'    │
└─────────────────┘
```

---

## 🎯 Key Features

### **1. Offline-First**
- ✅ Users can login offline (using local DB)
- ✅ User changes queued for sync
- ✅ Works without internet connection

### **2. Automatic Synchronization**
- ✅ Auto-sync every 5 minutes
- ✅ Sync on network reconnect
- ✅ Sync on app startup
- ✅ Manual sync available

### **3. Role-Based Access**
- ✅ Admins sync all users
- ✅ Managers don't sync users (security)
- ✅ Role stored in user object

### **4. Conflict Resolution**
- ✅ Server is source of truth
- ✅ Local changes overwrite on conflict
- ✅ Last-write-wins strategy

---

## 🔧 Storage Operations Summary

| Operation | Local DB | Server DB | Session | Context |
|-----------|----------|-----------|---------|---------|
| **Create User** | ✅ Immediate | ⏳ On sync | ❌ | ✅ After login |
| **Login** | ✅ Check local | ⏳ Optional sync | ✅ Create JWT | ✅ Set user |
| **Update User** | ✅ Immediate | ⏳ On sync | ❌ | ✅ Update state |
| **Delete User** | ✅ Soft delete | ⏳ On sync | ❌ | ✅ Clear state |
| **Logout** | ❌ | ❌ | ✅ Clear cookie | ✅ Clear state |
| **Sync** | ✅ Update status | ✅ Create/Update | ❌ | ❌ |

---

## 📝 Best Practices

1. **Always check local DB first** for offline support
2. **Mark changes with status 'w'** for sync tracking
3. **Update status to '1'** after successful sync
4. **Use soft delete (status '0')** for offline deletion
5. **Sync users only for admins** (security)
6. **Hash passwords on server** (bcrypt for admin)
7. **Use JWT for sessions** (stateless, secure)
8. **Store minimal data in JWT** (no passwords)

---

## 🚨 Current Limitations

1. **Plain text passwords in local DB** - Consider encryption
2. **No password hashing for managers** - Should hash on server
3. **No conflict resolution UI** - Users don't see conflicts
4. **No sync retry queue** - Failed syncs need manual retry
5. **No sync progress indicator** - Users don't see sync status

---

## 🔮 Future Improvements

1. **Encrypt local passwords** - Use Web Crypto API
2. **Hash manager passwords** - Use bcrypt on server
3. **Sync conflict UI** - Show conflicts to users
4. **Retry queue** - Automatic retry of failed syncs
5. **Sync status indicator** - Show sync progress in UI
6. **Biometric authentication** - For mobile devices
7. **Multi-device sync** - Real-time sync across devices

