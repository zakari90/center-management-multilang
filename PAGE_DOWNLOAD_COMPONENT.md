# Page Download/Precache Component

## Main Component: `PagePrecacheHandler`

**Location:** `src/components/page-precache-handler.tsx`

This is the **primary component responsible for downloading and preloading pages** for offline use in your PWA.

## How It Works

### 1. **Component Location**
- File: `src/components/page-precache-handler.tsx`
- Imported in: `src/app/[locale]/layout.tsx` (line ~130)
- Renders as a floating card in the bottom-right corner

### 2. **What It Does**

The component:
- ✅ Prompts users to download pages for offline access
- ✅ Downloads all pages listed in `PAGES_TO_PRECACHE` array
- ✅ Caches pages for all locales (en, ar, fr)
- ✅ Shows progress during download
- ✅ Stores completion state in localStorage
- ✅ Uses browser Cache API (`caches.open('pages-v1')`)

### 3. **Pages It Downloads**

```typescript
const PAGES_TO_PRECACHE = [
  // Auth pages
  '/login',
  '/loginmanager',
  '/register',
  
  // Admin pages
  '/admin',
  '/admin/center',
  '/admin/receipts',
  '/admin/schedule',
  '/admin/users',
  
  // Manager pages
  '/manager',
  '/manager/receipts',
  '/manager/receipts/create',
  '/manager/receipts/create-teacher-payment',
  '/manager/schedule',
  '/manager/students',
  '/manager/students/create',
  '/manager/teachers',
  '/manager/teachers/create',
]
```

Total pages: **33 pages** (11 pages × 3 locales)

### 4. **Key Functions**

#### `precachePages()` (Line 76)
- Main function that downloads all pages
- Opens cache: `caches.open('pages-v1')`
- Fetches each page with timeout (15 seconds)
- Stores in cache: `cache.put(url, responseClone)`
- Updates progress bar
- Handles errors gracefully

#### Prompt Logic (Line 43-74)
- Shows prompt if:
  - Never precached, OR
  - Precached > 7 days ago, OR
  - User hasn't dismissed recently (24+ hours)
- Waits 5 seconds before showing (to not overwhelm on first load)

### 5. **User Interface**

The component displays:
- **Card UI** (bottom-right, fixed position)
- **Download button** - Starts the precaching process
- **Progress bar** - Shows download progress (0-100%)
- **Dismiss button** (X) - Closes prompt
- **Completion message** - Shows when done

### 6. **Storage**

Uses `localStorage` to track:
- `pages-precached` - Boolean flag
- `precache-date` - Last precache date
- `precache-count` - Number of pages cached
- `precache-total` - Total pages attempted
- `precache-failed` - Array of failed URLs
- `precache-dismissed` - Dismiss timestamp

## Related Components

### Service Worker (`worker/index.ts`)
- Handles background caching
- Intercepts network requests
- Serves cached pages when offline

### Next.js Config (`next.config.ts`)
- Configures service worker
- Sets up PWA manifest
- Defines cache strategies

## Usage

The component is automatically included in the root layout:

```tsx
// src/app/[locale]/layout.tsx
import PagePrecacheHandler from "@/components/page-precache-handler"

// In the layout:
<PagePrecacheHandler />
```

## How to Trigger Manually

Users can trigger precaching by:
1. **Automatic prompt** - Shows after 5 seconds (if conditions met)
2. **Clicking "Download Now"** button in the prompt
3. **The component handles everything automatically**

## Customization

To add more pages to precache:

1. Edit `PAGES_TO_PRECACHE` array in `page-precache-handler.tsx`
2. Add your page route: `'/manager/your-page'`
3. The component will automatically include it for all locales

## Technical Details

- **Cache Name:** `pages-v1`
- **Timeout:** 15 seconds per page
- **Delay Between Requests:** 200ms
- **Progress Calculation:** `(cachedCount / totalPages) * 100`
- **Current Locale Priority:** Current locale pages cached first

## Troubleshooting

### Pages Not Downloading?
- Check browser console for errors
- Verify service worker is registered
- Check network tab for failed requests
- Look for `[Precache]` logs in console

### Prompt Not Showing?
- Check localStorage for `precache-dismissed`
- Verify service worker support: `'serviceWorker' in navigator`
- Check cache API support: `'caches' in window`

### Cache Not Working?
- Verify cache storage: `caches.open('pages-v1')`
- Check browser storage quota
- Clear cache and retry: `caches.delete('pages-v1')`

