/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Usage Examples for the Offline-First Sync System
 * 
 * This file demonstrates how to use the sync system with different types of data
 * (todos, notes, etc.)
 */

import { DexieActions } from './dexieActions';
import { ServerAction } from './serverAction';
import { SyncManager, addOrEditItem, deleteItem } from './syncManager';
import { SyncableItem } from './syncable-item';

// ============================================================================
// EXAMPLE 1: Todo Item
// ============================================================================

interface TodoItem extends SyncableItem {
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
}

/**
 * Add a new todo item
 * System will try server first, fallback to local if offline
 */
export async function addTodo(todoData: Omit<TodoItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
  return await addOrEditItem('/api/todos', todoData) as TodoItem;
}

/**
 * Update an existing todo item
 */
export async function updateTodo(id: string, updates: Partial<Omit<TodoItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>>): Promise<TodoItem> {
  return await addOrEditItem('/api/todos', updates, id) as TodoItem;
}

/**
 * Delete a todo item
 * - If not synced ("w"): deletes immediately
 * - If synced ("1"): marks as "0" (pending delete)
 */
export async function removeTodo(id: string): Promise<void> {
  await deleteItem('/api/todos', id);
}

/**
 * Get all todos (both synced and waiting)
 * Excludes pending delete items
 */
export async function getAllTodos(): Promise<TodoItem[]> {
  return await DexieActions.getAllItems() as TodoItem[];
}

/**
 * Sync all pending todos
 */
export async function syncTodos(): Promise<void> {
  const result = await SyncManager.syncAll('/api/todos');
  console.log('Sync result:', result);
}

// ============================================================================
// EXAMPLE 2: Note Item
// ============================================================================

interface NoteItem extends SyncableItem {
  title: string;
  content: string;
  tags?: string[];
  category?: string;
}

/**
 * Add a new note
 */
export async function addNote(noteData: Omit<NoteItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<NoteItem> {
  return await addOrEditItem('/api/notes', noteData) as NoteItem;
}

/**
 * Update a note
 */
export async function updateNote(id: string, updates: Partial<Omit<NoteItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>>): Promise<NoteItem> {
  return await addOrEditItem('/api/notes', updates, id) as NoteItem;
}

/**
 * Delete a note
 */
export async function removeNote(id: string): Promise<void> {
  await deleteItem('/api/notes', id);
}

/**
 * Get all notes
 */
export async function getAllNotes(): Promise<NoteItem[]> {
  return await DexieActions.getAllItems() as NoteItem[];
}

/**
 * Sync all pending notes
 */
export async function syncNotes(): Promise<void> {
  const result = await SyncManager.syncAll('/api/notes');
  console.log('Sync result:', result);
}

// ============================================================================
// EXAMPLE 3: Manual Sync Usage
// ============================================================================

/**
 * Manual sync - call this when user clicks "Sync" button
 */
export async function manualSync(apiEndpoint: string): Promise<{ success: boolean; message: string }> {
  const result = await SyncManager.syncAll(apiEndpoint);
  
  if (result.success) {
    return {
      success: true,
      message: `Synced ${result.synced} items, deleted ${result.deleted} items`
    };
  } else {
    return {
      success: false,
      message: `Sync completed with errors: ${result.errors.join(', ')}`
    };
  }
}

/**
 * Get sync status for UI display
 */
export async function getSyncStatus(): Promise<{
  synced: number;
  waiting: number;
  pendingDelete: number;
  total: number;
}> {
  return await SyncManager.getSyncStatus();
}

// ============================================================================
// EXAMPLE 4: Automatic Sync Setup
// ============================================================================

/**
 * Setup automatic sync on app initialization
 * - Syncs when coming back online
 * - Syncs periodically (every 30 seconds)
 */
export function setupAutoSync(apiEndpoint: string, intervalMs: number = 30000): () => void {
  // Sync on online event
  const handleOnline = () => {
    console.log('🌐 Back online - triggering sync');
    SyncManager.syncAll(apiEndpoint).catch(console.error);
  };
  
  window.addEventListener('online', handleOnline);
  
  // Periodic sync
  const syncInterval = setInterval(() => {
    if (ServerAction.isOnline()) {
      SyncManager.syncAll(apiEndpoint).catch(console.error);
    }
  }, intervalMs);
  
  // Initial sync
  setTimeout(() => {
    if (ServerAction.isOnline()) {
      SyncManager.syncAll(apiEndpoint).catch(console.error);
    }
  }, 2000);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(syncInterval);
  };
}

// ============================================================================
// EXAMPLE 5: React Hook Usage
// ============================================================================

/**
 * Example React hook for using todos
 * 
 * import { useLiveQuery } from 'dexie-react-hooks';
 * import { DexieActions } from '@/lib/dexieActions';
 * 
 * export function useTodos() {
 *   const todos = useLiveQuery(() => DexieActions.getAllItems()) || [];
 *   const status = useLiveQuery(() => SyncManager.getSyncStatus());
 *   
 *   return {
 *     todos: todos as TodoItem[],
 *     status,
 *     addTodo,
 *     updateTodo,
 *     removeTodo,
 *     syncTodos
 *   };
 * }
 */

