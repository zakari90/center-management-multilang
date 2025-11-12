# Admin Setup Guide

## How Admin User is Created

Unlike traditional systems, this offline-first application **does not require database seeding** or initialization scripts. The admin user is created automatically through the **login process**.

---

## 🔐 Default Admin Credentials

```
Email:    admin@admin.com
Password: admin
```

⚠️ **IMPORTANT**: Change these credentials immediately after first login in production!

---

## 🚀 First-Time Setup

### Step 1: Launch the Application
```bash
npm run dev
```

### Step 2: Navigate to Login
Open http://localhost:6524/login

### Step 3: Login with Default Credentials
- Enter email: `admin@admin.com`
- Enter password: `admin`
- Click "Login"

### What Happens:
1. ✅ **Login form checks localDB** (IndexedDB) for admin
2. ✅ **Credentials match default** → Admin created in localDB
3. ✅ **User logs in immediately** (no server required)
4. ✅ **Background sync** attempts to sync admin to server
5. ✅ **Admin appears in both** localDB and MongoDB (when online)

---

## 💡 Why This Approach?

### Traditional Approach (NOT used):
```bash
# Requires manual commands
npm run seed
# OR
prisma db seed
```
❌ Extra step required  
❌ Fails if MongoDB not configured  
❌ Not offline-first  

### Our Offline-First Approach:
```
User logs in → Admin created in localDB → Synced to server when online
```
✅ No manual setup needed  
✅ Works completely offline  
✅ Syncs automatically when online  
✅ True offline-first experience  

---

## 🔍 How It Works Technically

The login form (`src/components/login-form.tsx`) contains this logic:

```typescript
// Check localDB first
let localUser = await userActions.getLocalByEmail(email)

// If admin doesn't exist AND credentials match default
if (!localUser && 
    role === "admin" && 
    email === "admin@admin.com" && 
    password === "admin") {
  
  // Create admin in localDB
  const adminId = generateObjectId()
  localUser = await saveManagerToLocalDb({
    id: adminId,
    email: "admin@admin.com",
    name: "admin",
    role: "ADMIN",
  }, password)
}

// Login successful!
// Background sync will handle server sync automatically
```

---

## 📦 Data Storage

### LocalDB (IndexedDB)
- **Location**: Browser's IndexedDB → `localDb` → `users` table
- **Purpose**: Instant access, offline support
- **Status**: `'w'` (waiting) until synced

### Server (MongoDB)
- **Location**: MongoDB database → `users` collection
- **Purpose**: Centralized storage, multi-device sync
- **Status**: `'1'` (synced) after successful sync

---

## 🔄 Sync Behavior

### Scenario 1: Online First Login
1. Admin created in localDB (`status: 'w'`)
2. User logs in instantly
3. Background sync triggered immediately
4. Admin synced to server
5. Status updated to `'1'`

### Scenario 2: Offline First Login
1. Admin created in localDB (`status: 'w'`)
2. User logs in instantly
3. User works offline
4. When online, sync happens automatically
5. Admin appears in MongoDB
6. Status updated to `'1'`

---

## 🛠️ Troubleshooting

### Issue: "Admin already exists" error
**Cause**: Admin is already in localDB  
**Solution**: This is normal. Just login with credentials.

### Issue: Admin not syncing to MongoDB
**Check**:
1. Is the app online? (Check network indicator)
2. Is MongoDB running?
3. Check console for sync logs
4. Check IndexedDB: admin should have `status: 'w'`
5. Wait ~5-10 seconds for auto-sync or refresh page

### Issue: MongoDB replica set error
**Cause**: Prisma requires MongoDB replica set for transactions  
**Solution**: This is caught and doesn't break the app. Options:
1. Keep working offline (admin in localDB works fine)
2. Configure MongoDB as replica set (production)
3. Use MongoDB Atlas (automatically configured)

---

## 🔒 Security Considerations

### Development
- Default credentials (`admin@admin.com` / `admin`) are acceptable
- LocalDB data is browser-specific (not shared)

### Production
**CRITICAL STEPS**:
1. ✅ Change admin password immediately after first login
2. ✅ Use environment variables for sensitive data
3. ✅ Enable HTTPS
4. ✅ Configure MongoDB authentication
5. ✅ Set up proper CORS policies
6. ✅ Use strong passwords
7. ✅ Consider removing default admin creation in production

---

## 📝 Optional: Prisma Seed Script

If you prefer traditional seeding (not recommended for offline-first):

```bash
# Run seed script manually
npm run seed
```

**Note**: The seed script (`prisma/seed.ts`) exists but is **not required** for this offline-first application. The login form handles admin creation automatically.

---

## 🎯 Summary

| Feature | Traditional | Offline-First (Our Approach) |
|---------|------------|------------------------------|
| Setup Command | `npm run seed` | None needed |
| Requires Server | ✅ Yes | ❌ No |
| Works Offline | ❌ No | ✅ Yes |
| Auto-sync | ❌ Manual | ✅ Automatic |
| User Experience | Extra steps | Just login |

**Offline-first means no setup required!** Just login and start working. 🚀

