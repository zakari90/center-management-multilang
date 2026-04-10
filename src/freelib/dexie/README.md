# Dexie-Based Local-First Storage System

This directory contains the unified local-first storage system using Dexie.js (IndexedDB wrapper).

## Overview

All entities are stored locally in IndexedDB using Dexie. This system provides a standalone, offline-first experience with zero server dependencies for the "Free Mode" version of the application.

## Key Concepts

### Data Privacy
- **Local Only**: Data is strictly stored on the device.
- **No Sync**: This version does not synchronize with any cloud backend.
- **Full Control**: Users can backup (export) and restore (import) their data manually.

## Files

### `dbSchema.ts`
Defines the database schema and all entity interfaces:
- `User` - Local admin user
- `Center` - Education center details
- `Teacher` - Teachers list
- `Student` - Students list
- `Subject` - Subjects/courses
- `Receipt` - Payment receipts
- `Schedule` - Class schedules
- `TeacherSubject` - Teacher-subject assignments
- `StudentSubject` - Student enrollments

### `freedexieaction.ts`
Provides generic CRUD operations for all entities using a factory pattern:
- `putLocal(item)` - Save or update entity
- `create(item)` - Add new entity (will fail if ID exists)
- `update(id, updates)` - Update specific fields
- `getAll()` - Get all entities for the table
- `getLocal(id)` - Get entity by ID
- `deleteLocal(id)` - Delete entity from local storage
- `clearAllLocalData()` - Helper to wipe the database

## Usage

### Saving Entities

```typescript
import { studentActions } from '@/freelib/dexie/freedexieaction';

// Save student locally
await studentActions.create({
  id: "...",
  name: 'Zakaria Zine',
  email: 'john@example.com',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

### Reading Entities

```typescript
import { studentActions } from '@/freelib/dexie/freedexieaction';

// Get all students
const students = await studentActions.getAll();

// Get student by ID
const student = await studentActions.getLocal('student-id');
```

## ID Generation

All entities should use consistent IDs. For the local-only mode, we recommend generating 24-character hex strings or UUIDs to ensure compatibility if data is ever migrated to a managed version.

## Backup and Export

The system supports exporting the entire database to a JSON file for backup purposes, available in the database management section of the dashboard.

