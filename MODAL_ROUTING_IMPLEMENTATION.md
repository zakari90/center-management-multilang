# Modal Routing Implementation Guide

This document describes the modal routing system implemented for dynamic routes in the Next.js PWA application.

## Overview

Dynamic routes (students, receipts, teachers) can now display content in modal dialogs instead of full page navigations when navigating from list pages, while still supporting direct deep linking to full pages.

## Architecture

### Core Components

1. **`ModalLink` Component** (`src/components/modal-link.tsx`)
   - Drop-in replacement for Next.js `Link` component
   - Automatically adds `?modal=true` query parameter when navigating from list pages
   - Uses i18n-aware `Link` from `next-intl` for proper locale handling

2. **`ModalContentWrapper` Component** (`src/components/modal-content-wrapper.tsx`)
   - Wraps content in a shadcn/ui `Dialog` component
   - Handles browser back/forward navigation
   - Manages modal open/close state
   - Navigates back to list page on close

3. **Detail Content Components**
   - `StudentDetailContent` - Reusable student detail content
   - `ReceiptDetailContent` - Reusable receipt detail content
   - `TeacherDetailContent` - Reusable teacher detail content
   - All accept `isModal` prop to adjust styling for modal vs full page

### Route Pages

Each dynamic route page (`[id]/page.tsx`) checks for the `modal` query parameter:
- If `?modal=true` → Renders content wrapped in `ModalContentWrapper`
- Otherwise → Renders as full page (supports deep linking)

## How It Works

### 1. Navigation from List Pages

When a user clicks a link in a list page (e.g., `/manager/students`):

```tsx
<ModalLink href={`/manager/students/${student.id}`}>
  <Button>View</Button>
</ModalLink>
```

The `ModalLink` component:
1. Detects that the current page is a list page
2. Adds `?modal=true` to the URL
3. Navigates to the detail route

### 2. Modal Display

When the route loads with `?modal=true`:
1. The page component detects the modal parameter
2. Renders `ModalContentWrapper` with the detail content
3. The dialog opens over the current page

### 3. Deep Linking

Direct navigation to `/manager/students/[id]` (without `?modal=true`):
- Renders as a full page
- No modal dialog
- Supports sharing/bookmarking URLs

### 4. Browser Navigation

- **Back button**: Closes modal and returns to list
- **Forward button**: Reopens modal if it was in history
- **History state**: Properly managed via URL query parameters

## Usage

### In List Components

Replace `Link` with `ModalLink` for detail routes:

```tsx
import { ModalLink } from "@/components/modal-link"

// Automatically opens in modal from list pages
<ModalLink href={`/manager/students/${student.id}`}>
  View Student
</ModalLink>

// Force full page navigation (e.g., for edit links)
<ModalLink href={`/manager/students/${student.id}/edit`} forceFullPage>
  Edit
</ModalLink>
```

### Adding New Modal Routes

1. Add route pattern to `MODAL_ROUTES` in `modal-link.tsx`:
   ```tsx
   const MODAL_ROUTES = [
     /^\/manager\/your-route\/([^\/]+)$/,
   ]
   ```

2. Update `ModalContentWrapper` to handle the new route type

3. Update detail page to check for modal parameter

## Features

✅ **Deep Linking Support** - Direct URLs render as full pages  
✅ **Browser History** - Back/forward buttons work correctly  
✅ **Accessibility** - Uses shadcn/ui Dialog with proper ARIA attributes  
✅ **PWA Compatible** - Works with offline scenarios  
✅ **State Preservation** - List page state is maintained when modal opens  
✅ **URL State** - Modal state is reflected in the URL (shareable)  

## Routes Supported

- `/manager/students/[id]` → Modal from students list
- `/manager/receipts/[id]` → Modal from receipts list  
- `/manager/teachers/[id]` → Modal from teachers list

## Technical Details

### Query Parameter Strategy

We use `?modal=true` instead of intercepting routes because:
- Simpler implementation
- Better deep linking support
- Works with PWA/offline scenarios
- Easier to debug (URL state is visible)

### Modal State Management

- Modal open/close state is managed locally in `ModalContentWrapper`
- State syncs with URL query parameter
- Browser history events update modal state

### Accessibility

- Dialog uses Radix UI primitives (via shadcn/ui)
- Proper focus management
- ESC key closes modal
- Click outside closes modal
- Screen reader announcements

## Future Enhancements

Potential improvements:
- [ ] Add loading states during modal transitions
- [ ] Implement route preloading for faster modal opens
- [ ] Add transition animations
- [ ] Support nested modals
- [ ] Add modal history stack for complex navigation

