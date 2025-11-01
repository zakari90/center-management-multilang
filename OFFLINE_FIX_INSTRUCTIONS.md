# Fixing Offline App Issues

## Problem
When WiFi is disabled, the app stops working.

## Root Causes
1. **NetworkFirst timeout too long** - App waits 3-10 seconds before checking cache
2. **Pages not precached** - First visit to a page while offline fails
3. **Service Worker needs update** - Changes require rebuild and reinstall

## Immediate Fixes Applied

### 1. Reduced Network Timeouts
- Changed `networkTimeoutSeconds` from 3-10s to **1 second**
- App now checks cache faster when network fails
- Faster offline response time

### 2. Service Worker Updates
- Updated `worker/index.ts` with faster timeouts
- Better fallback handling in catch handler

## Testing Steps

### To Test Offline Functionality:

1. **First, visit pages while ONLINE** to cache them:
   ```
   - Go online
   - Visit: /en/admin, /en/manager, /en/login
   - Navigate to different pages
   - This caches them for offline use
   ```

2. **Then test offline**:
   ```
   - Disable WiFi
   - Try to navigate to previously visited pages
   - Should work from cache
   ```

3. **For first-time offline visits**:
   ```
   - If a page wasn't cached, you'll see the offline.html page
   - This is expected behavior
   ```

## Important Notes

### Pages Must Be Visited While Online First
- Pages are cached on first visit (when online)
- If you visit a page for the first time while offline, it won't be cached
- Solution: Visit all important pages while online once

### Rebuild Required
After making these changes:
```bash
npm run build
# Then test the built version
```

### Service Worker Registration
- The service worker is auto-registered by next-pwa
- Check DevTools > Application > Service Workers to verify it's active

## Next Steps (If Still Not Working)

1. **Check Service Worker Status**:
   - Open DevTools (F12)
   - Go to Application > Service Workers
   - Verify service worker is active
   - Check for errors

2. **Clear Cache and Retry**:
   ```
   DevTools > Application > Clear storage > Clear site data
   Then refresh and visit pages while online
   ```

3. **Check Console for Errors**:
   - Look for service worker errors
   - Check for network errors that aren't being caught

4. **Verify PWA Installation**:
   - App must be installed as PWA for best offline experience
   - Service worker works better in installed mode

## Expected Behavior

### ✅ Working Offline:
- Previously visited pages load from cache
- Static assets (CSS, JS, images) load from cache
- API calls use offline storage (IndexedDB)

### ⚠️ Expected Limitations:
- First visit to new page while offline → shows offline.html
- Server-side rendered pages need cache
- Real-time data won't update until online

