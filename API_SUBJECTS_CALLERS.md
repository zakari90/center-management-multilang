# API `/api/subjects` Callers Analysis

## Summary

The `/api/subjects` endpoint is called by the **sync/import system** through the `subjectServerAction.ts` module.

## Active Callers

### 1. **SyncHandler Component** (`src/components/syncHandler.tsx`)
- **When**: User clicks "Sync to Server" or "Import from Server" buttons
- **What it calls**:
  - `syncAllEntitiesForRole()` → includes `ServerActionSubjects.Sync()`
  - `importAllFromServerForRole()` → includes `ServerActionSubjects.ImportFromServer()`
- **API Methods Used**:
  - **GET** `/api/subjects` - via `ImportFromServer()` → `ReadFromServer()`
  - **POST** `/api/subjects` - via `Sync()` → `SaveToServer()` (for new subjects)
  - **PATCH** `/api/subjects` - via `Sync()` → `SaveToServer()` (for updates)
  - **DELETE** `/api/subjects` - via `Sync()` → `DeleteFromServer()`

### 2. **useAutoSync Hook** (`src/hooks/useAutoSync.ts`)
- **When**: Automatic sync on network reconnection or periodic sync
- **What it calls**:
  - `syncAllEntitiesForRole()` → includes `ServerActionSubjects.Sync()`
- **API Methods Used**: Same as SyncHandler

## API Call Flow

```
User Action / Auto Sync
    ↓
syncAllEntitiesForRole() or importAllFromServerForRole()
    ↓
ServerActionSubjects.Sync() or ServerActionSubjects.ImportFromServer()
    ↓
subjectServerAction.ts functions:
    - ReadFromServer() → GET /api/subjects
    - SaveToServer() → POST /api/subjects (create) or PATCH /api/subjects (update)
    - DeleteFromServer() → DELETE /api/subjects
```

## Commented Out (Not Active)

These components have commented-out API calls to `/api/subjects`:
- `src/components/studentCreationForm.tsx` - Line 130
- `src/app/[locale]/manager/students/[id]/edit/page.tsx` - Line 259
- `src/app/[locale]/manager/teachers/[id]/edit/page.tsx` - Line 252
- `src/components/TimeTableManagement.tsx` - Line 287
- `src/components/createTeacherForm.tsx` - Line 369

These are **NOT active** - they now use local DB instead.

## Link (Not API Call)

- `src/components/top-subjects.tsx` - Line 111
  - `href={`/subjects/${subject.id}`}` - This is a **Next.js Link**, not an API call
  - It navigates to a subject detail page

## Files Involved

1. **API Endpoint**: `src/app/api/subjects/route.ts`
2. **Server Actions**: `src/lib/dexie/subjectServerAction.ts`
3. **Sync Handler**: `src/components/syncHandler.tsx`
4. **Auto Sync**: `src/hooks/useAutoSync.ts`
5. **Server Actions Export**: `src/lib/dexie/serverActions.ts`

## Conclusion

The `/api/subjects` endpoint is primarily called by:
- **SyncHandler component** (manual sync/import)
- **useAutoSync hook** (automatic sync)

Both use the `ServerActionSubjects` module which handles all subject-related API calls.

