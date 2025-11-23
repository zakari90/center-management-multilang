# Old Server Data Flow (Before PWA/Offline-First)

This document extracts how data was sent to the server in the original code (before PWA implementation).

## 📋 Overview

The old implementation used **direct axios calls** to send data immediately to the server. No offline storage or sync mechanism.

---

## 🔄 Center Data Flow

### 1. **Fetching Center Data** (`src/app/[locale]/admin/center/page.tsx`)

```typescript
// OLD CODE - Direct server fetch on mount
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get(`/api/center`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.data.length === 0) {
        setCenterData(null);
      } else {
        setCenterData(response.data[0]); // Take first center
      }
    } catch (error) {
      console.error("Error fetching center data:", error);
      setCenterData(null);
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, []);
```

**Key Points:**
- ✅ Direct API call on component mount
- ✅ Uses `axios.get('/api/center')` - relative URL
- ✅ No authentication headers (relies on cookies)
- ✅ Takes first center from array
- ❌ No offline support
- ❌ No local caching

---

### 2. **Sending/Updating Center Data** (`CenterPresentation` component)

```typescript
// OLD CODE - Direct server update
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const payload = {
      centerId: formData.name,  // ⚠️ BUG: Should be center.id, not name
      name: formData.name,
      address: formData.address || null,
      phone: formData.phone || null,
      classrooms: formData.classrooms,
      workingDays: formData.workingDays,
      subjects: formData.subjects  // ✅ Includes subjects array
    };

    const response = await axios.put(
      BASE_URL + '/center',  // Full URL with BASE_URL
      payload,
      { 
        headers: { 
          "Content-Type": "application/json",
        },
      }
    );

    if (!response) {
      throw new Error('Failed to create center');
    }

    setMessage("Center created successfully!");
    // Reset form...
  } catch (error) {
    console.log(error);
    setMessage("Error creating center. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

**Key Points:**
- ✅ Uses `axios.put(BASE_URL + '/center', payload)`
- ✅ Sends **complete payload** including subjects in one request
- ✅ Direct server update (no local storage)
- ⚠️ Bug: `centerId: formData.name` should be `centerId: center.id`
- ❌ No offline support - fails if network is down
- ❌ No retry mechanism

---

## 📦 Payload Structure

### Center Update Payload

```typescript
{
  centerId: string,        // ⚠️ Bug: was using formData.name
  name: string,
  address: string | null,
  phone: string | null,
  classrooms: string[],
  workingDays: string[],
  subjects: Subject[]      // ✅ Full subjects array included
}
```

### Subject Object Structure

```typescript
type Subject = {
  id: string,
  name: string,
  grade: string,
  price: number,
  duration: number | null,
  createdAt: string,
  updatedAt: string,
  centerId: string
}
```

---

## 🌐 API Endpoints Used

### 1. **GET Center**
```
GET /api/center
```
- **Headers**: `Content-Type: application/json`
- **Auth**: Cookie-based (automatic)
- **Response**: Array of centers `Center[]`
- **Usage**: Fetch all centers for current user

### 2. **PUT Center**
```
PUT {BASE_URL}/center
```
- **Headers**: `Content-Type: application/json`
- **Auth**: Cookie-based (automatic)
- **Body**: Complete center object with subjects
- **Response**: Updated center object
- **Usage**: Update existing center

---

## 🔑 Key Differences: Old vs Current (PWA)

| Feature | Old (Direct Axios) | Current (PWA/Offline-First) |
|---------|-------------------|----------------------------|
| **Data Storage** | Server only | Local DB (Dexie) + Server |
| **API Calls** | Direct `axios.put/get` | `fetch()` with sync mechanism |
| **Offline Support** | ❌ None | ✅ Full offline support |
| **Sync Strategy** | Immediate | Background sync with retry |
| **Subjects Handling** | Included in center payload | Separate sync for subjects |
| **Error Handling** | Basic try/catch | Retry logic + status tracking |
| **Data Flow** | Component → Server | Component → Local DB → Sync → Server |

---

## 📝 Code Patterns

### Old Pattern (Direct Server Call)

```typescript
// 1. Prepare payload
const payload = { /* data */ };

// 2. Send immediately
const response = await axios.put(BASE_URL + '/endpoint', payload);

// 3. Handle response
if (response.ok) {
  // Success
} else {
  // Error
}
```

### Current Pattern (Offline-First)

```typescript
// 1. Save to local DB first
await centerActions.putLocal(center); // status: 'w' (waiting)

// 2. Try to sync if online
if (isOnline()) {
  await ServerActionCenters.SaveToServer(center);
  await centerActions.markSynced(center.id); // status: '1' (synced)
}
```

---

## 🐛 Issues Found in Old Code

1. **Bug in `handleSubmit`**:
   ```typescript
   centerId: formData.name,  // ❌ Wrong - should be center.id
   ```

2. **No Error Recovery**:
   - If network fails, data is lost
   - No retry mechanism
   - No offline queue

3. **No Optimistic Updates**:
   - UI waits for server response
   - No immediate feedback

4. **Subjects Not Synced Separately**:
   - All subjects sent in one request
   - If center update fails, subjects also fail

---

## 🔄 Migration Notes

To migrate from old to new:

1. **Replace axios calls** with Dexie local storage
2. **Add sync mechanism** using `ServerActionCenters.SaveToServer()`
3. **Handle offline state** with status flags ('w', '1', '0')
4. **Separate subject sync** from center sync
5. **Add retry logic** for failed syncs

---

## 📚 Related Files

- **Old**: `src/app/[locale]/admin/center/page.tsx` (original)
- **Old**: `src/components/centerPresentation.tsx` (original)
- **Current**: `src/lib/dexie/centerServerAction.ts` (new sync logic)
- **Current**: `src/components/newCenterForm.tsx` (offline-first)
- **API**: `src/app/api/center/route.ts` (server endpoint)

---

## ✅ Summary

**Old Approach:**
- Direct axios calls
- No offline support
- Immediate server updates
- Simple but fragile

**Current Approach:**
- Offline-first with Dexie
- Background sync
- Retry mechanism
- More robust but complex

