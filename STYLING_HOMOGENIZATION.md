# Styling Homogenization Guide

## Overview
This document outlines the standardized styling patterns applied across all detail pages (Student, Receipt, Teacher) for both modal and full-page views.

## Consistent Patterns

### 1. **Header Section**
- **Modal**: `mb-4`, `text-2xl`, `gap-4`
- **Full Page**: `mb-6`, `text-3xl`, `gap-4`
- Always use `flex justify-between items-start gap-4`
- Title container uses `flex-1`, buttons use `shrink-0`

### 2. **Stats Cards Grid**
- **Modal**: `gap-4 mb-4`
- **Full Page**: `gap-6 mb-6`
- Always: `grid grid-cols-1 md:grid-cols-3`
- Card content: `pt-6`
- Labels: `text-sm text-muted-foreground mb-1`
- Values: `text-3xl font-bold`

### 3. **Content Sections**
- **Modal**: `space-y-4`, `gap-4`
- **Full Page**: `space-y-6`, `gap-6`
- Main layout: `grid grid-cols-1 lg:grid-cols-3`
- Left column: `lg:col-span-2`

### 4. **Cards**
- Consistent padding: `CardContent` with `pt-6` for stats
- Info grids: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Labels: `text-sm text-muted-foreground`
- Values: `text-foreground` or `font-medium`

### 5. **Empty States**
- Consistent: `text-muted-foreground text-center py-4`
- Used for: no subjects, no payments, no schedule

### 6. **Buttons**
- **Modal**: `size="sm"`
- **Full Page**: `size="default"`
- Action buttons: `mt-4 w-full` for full-width buttons

### 7. **Responsive Breakpoints**
- Mobile: `< 640px` - Reduced padding, smaller text
- Tablet: `md:` (640px+) - 2-column grids
- Desktop: `lg:` (1024px+) - 3-column layouts

## Spacing Scale

| Element | Modal | Full Page |
|---------|-------|-----------|
| Section margin bottom | `mb-4` | `mb-6` |
| Section spacing | `space-y-4` | `space-y-6` |
| Grid gap | `gap-4` | `gap-6` |
| Container padding | `p-2` | `p-6` |

## Typography Scale

| Element | Modal | Full Page |
|---------|-------|-----------|
| Page title | `text-2xl` | `text-3xl` |
| Card title | `text-xl` | `text-2xl` |
| Section title | `text-lg` | `text-xl` |
| Body text | `text-sm` | `text-base` |

## Color Usage

- **Primary actions**: `text-primary`
- **Success/Money**: `text-green-600`
- **Warning/Payments**: `text-purple-600` or `text-orange-600`
- **Labels**: `text-muted-foreground`
- **Values**: `text-foreground`

## Implementation Checklist

When creating a new detail page component:

- [ ] Use conditional classes based on `isModal` prop
- [ ] Apply consistent spacing scale
- [ ] Use standardized typography scale
- [ ] Implement responsive grid layouts
- [ ] Add proper empty states
- [ ] Use consistent button sizing
- [ ] Apply gap-4 for responsive spacing
- [ ] Use flex-1/shrink-0 for header layouts

## Files Updated

- ✅ `src/components/student-detail-content.tsx`
- ✅ `src/components/receipt-detail-content.tsx`
- ✅ `src/components/teacher-detail-content.tsx`
- ✅ `src/styles/detail-pages.css` (utility classes)
- ✅ `src/app/globals.css` (imports detail-pages.css)

