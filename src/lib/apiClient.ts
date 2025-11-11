/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner';
import { generateObjectId } from './utils/generateObjectId';
import {
  studentActions,
  teacherActions,
  centerActions,
  subjectActions,
  receiptActions,
  scheduleActions,
} from './dexie/dexieActions';
import {
  saveStudentToLocalDb,
  saveTeacherToLocalDb,
  saveCenterToLocalDb,
  saveSubjectToLocalDb,
  saveReceiptToLocalDb,
  saveScheduleToLocalDb,
} from './utils/saveToLocalDb';
import { syncPendingEntities } from './dexie/syncWorker';
import { Student, Teacher, ReceiptType } from './dexie/dbSchema';

export interface ApiOptions extends RequestInit {
  timeout?: number;
  skipOfflineQueue?: boolean;
  offlineEntity?: string;
  offlineFallback?: () => Promise<any>;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

// Track online/offline status
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    console.log('[API Client] Online');
  });
  window.addEventListener('offline', () => {
    isOnline = false;
    console.log('[API Client] Offline - future requests will use offline storage');
  });
}

/**
 * Convert timestamp to number (for Dexie)
 */
function toTimestamp(value?: string | number | Date): number {
  if (!value) return Date.now();
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
}

/**
 * Cache record to Dexie (mark as synced)
 */
async function cacheRecordToDexie<T extends { id: string }>(
  entity: 'students' | 'teachers' | 'centers' | 'subjects' | 'receipts' | 'schedules',
  record: T,
  actions: any
): Promise<void> {
  if (!record?.id) return;
  
  const now = Date.now();
  const recordToSave = {
    ...record,
    status: '1' as const, // Mark as synced
    createdAt: toTimestamp((record as any).createdAt) || now,
    updatedAt: now,
  };
  
  await actions.putLocal(recordToSave);
}

/**
 * Cache collection to Dexie (mark as synced)
 */
async function cacheCollectionToDexie<T extends { id: string }>(
  entity: 'students' | 'teachers' | 'centers' | 'subjects' | 'receipts' | 'schedules',
  records: T[],
  actions: any
): Promise<void> {
  if (!Array.isArray(records) || records.length === 0) return;
  
  const now = Date.now();
  const recordsToSave = records
    .filter((r) => r.id)
    .map((r) => ({
      ...r,
      status: '1' as const, // Mark as synced
      createdAt: toTimestamp((r as any).createdAt) || now,
      updatedAt: now,
    }));
  
  if (recordsToSave.length === 0) return;
  
  for (const record of recordsToSave) {
    await actions.putLocal(record);
  }
}

/**
 * Make an API request with automatic offline fallback
 * @param url - The API endpoint
 * @param options - Fetch options + custom offline options
 * @returns Promise with response data
 */
export async function apiRequest<T = any>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    timeout = 10000,
    skipOfflineQueue = false,
    offlineEntity,
    offlineFallback,
    ...fetchOptions
  } = options;

  const method = (fetchOptions.method || 'GET').toUpperCase();

  // If online, try network first
  if (isOnline) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[API Client] Network error:', error);
      // Fall through to offline handling
    }
  }

  // Offline handling
  console.log(`[API Client] Offline - handling ${method} ${url}`);

  // For POST/PUT/DELETE, use offline fallback if provided
  if (['POST', 'PUT', 'DELETE'].includes(method) && !skipOfflineQueue && offlineFallback) {
    return handleOfflineWrite(url, method, fetchOptions, offlineEntity, offlineFallback);
  }

  // For GET requests, try offline fallback
  if (method === 'GET' && offlineFallback) {
    try {
      return await offlineFallback();
    } catch (error) {
      console.error('[API Client] Offline fallback failed:', error);
      throw new Error('Offline - no data available');
    }
  }

  throw new Error('Offline - unable to complete request');
}

/**
 * Handle offline write operations (POST/PUT/DELETE)
 */
async function handleOfflineWrite(
  url: string,
  method: string,
  fetchOptions: RequestInit,
  entity: string | undefined,
  fallback?: () => Promise<any>
): Promise<any> {
  try {
    if (fallback) {
      const result = await fallback();
      const action = method === 'POST' ? 'Saved' : method === 'PUT' ? 'Updated' : 'Deleted';
      toast.success(`${action} offline - will sync when online`, { duration: 3000 });
      return result;
    }
    throw new Error('No offline handler provided');
  } catch (error) {
    console.error('[API Client] Offline write handler error:', error);
    throw error;
  }
}

/**
 * Specialized POST request with offline support
 */
export async function apiPost<T = any>(
  url: string,
  data: any,
  options: Partial<ApiOptions> = {}
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
    ...options,
  });
}

/**
 * Specialized GET request with offline support
 */
export async function apiGet<T = any>(
  url: string,
  options: Partial<ApiOptions> = {}
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'GET',
    credentials: 'include',
    ...options,
  });
}

/**
 * Specialized PUT request with offline support
 */
export async function apiPut<T = any>(
  url: string,
  data: any,
  options: Partial<ApiOptions> = {}
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
    ...options,
  });
}

/**
 * Specialized DELETE request with offline support
 */
export async function apiDelete<T = any>(
  url: string,
  options: Partial<ApiOptions> = {}
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'DELETE',
    credentials: 'include',
    ...options,
  });
}

/**
 * Check if the app is currently online
 */
export function isAppOnline(): boolean {
  return isOnline;
}

/**
 * Get user ID from client auth (for offline operations)
 */
async function getUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { getClientUserId } = await import('./clientAuth');
    return await getClientUserId();
  } catch {
    return null;
  }
}

// ============================================================================
// SPECIALIZED OFFLINE-CAPABLE FUNCTIONS FOR COMMON OPERATIONS
// ============================================================================

/**
 * Create a student with offline-first behaviour
 */
export async function createStudent(data: any): Promise<any> {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const managerId = data.managerId ?? userId;
  const recordId = data.id ?? generateObjectId();
  const payload = { ...data, id: recordId, managerId };

  // Always save to localDb first with status 'w'
  const savedStudent = await saveStudentToLocalDb({
    id: recordId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    parentName: data.parentName,
    parentPhone: data.parentPhone,
    parentEmail: data.parentEmail,
    grade: data.grade,
    managerId,
  });

  // If online, try to sync immediately
  if (isAppOnline()) {
    try {
      const response = await apiPost('/api/students', payload, {
        skipOfflineQueue: true,
      });
      
      // Update localDb with server response (mark as synced)
      await cacheRecordToDexie('students', response ?? payload, studentActions);
      
      // Trigger sync for any other pending items
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      
      return response ?? payload;
    } catch (error) {
      console.warn('[createStudent] API call failed, will sync later:', error);
      // Trigger sync for pending items
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return savedStudent;
    }
  }

  return savedStudent;
}

export async function getStudents(managerId: string): Promise<any[]> {
  // Get from localDb first
  const allStudents = await studentActions.getAll();
  const local = allStudents.filter(s => s.managerId === managerId);

  if (!isAppOnline()) {
    return local;
  }

  try {
    const remote = await apiGet(`/api/students?managerId=${managerId}`, {
      skipOfflineQueue: true,
    });
    
    // Cache remote data to Dexie (mark as synced)
    if (Array.isArray(remote)) {
      await cacheCollectionToDexie('students', remote, studentActions);
    }
    
    // Return updated local data
    const updated = await studentActions.getAll();
    return updated.filter(s => s.managerId === managerId);
  } catch (error) {
    console.warn('[getStudents] Falling back to offline data:', error);
    return local;
  }
}

export async function updateStudent(id: string, data: any): Promise<any> {
  const existing = await studentActions.getLocal(id);
  const now = Date.now();
  
  // Update in localDb with status 'w'
  const updatedStudent: Student = {
    ...existing!,
    ...data,
    id,
    status: 'w' as const,
    updatedAt: now,
  };
  
  await studentActions.putLocal(updatedStudent);

  if (!isAppOnline()) {
    return updatedStudent;
  }

  try {
    const response = await apiPut(`/api/students/${id}`, { ...data, id }, {
      skipOfflineQueue: true,
    });
    
    // Mark as synced
    await cacheRecordToDexie('students', response ?? updatedStudent, studentActions);
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
    
    return response ?? updatedStudent;
  } catch (error) {
    console.warn('[updateStudent] Falling back to offline storage:', error);
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
    return updatedStudent;
  }
}

export async function deleteStudent(id: string): Promise<any> {
  const { deleteStudentFromLocalDb } = await import('./utils/deleteFromLocalDb');
  
  // Delete based on status (handles 'w' -> direct delete, '1' -> mark for deletion)
  const result = await deleteStudentFromLocalDb(id);
  
  // If item was marked for deletion (status '1' -> '0'), try to delete from server if online
  if (result.markedForDeletion && isAppOnline()) {
    try {
      await apiDelete(`/api/students/${id}`, { skipOfflineQueue: true });
      // If server deletion succeeds, remove from localDb
      await studentActions.deleteLocal(id);
      console.log(`✅ Deleted student ${id} from server and localDb`);
      return { id };
    } catch (error) {
      console.warn('[deleteStudent] Server deletion failed, item marked for deletion. Will sync later:', error);
      // Item is already marked for deletion (status '0'), sync worker will handle it
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return { id };
    }
  }
  
  // If item was directly deleted (status 'w') or offline, trigger sync for other pending items
  if (result.deleted || !isAppOnline()) {
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
  }
  
  return { id };
}

export async function deleteTeacher(id: string): Promise<any> {
  const { deleteTeacherFromLocalDb } = await import('./utils/deleteFromLocalDb');
  
  // Delete based on status (handles 'w' -> direct delete, '1' -> mark for deletion)
  const result = await deleteTeacherFromLocalDb(id);
  
  // If item was marked for deletion (status '1' -> '0'), try to delete from server if online
  if (result.markedForDeletion && isAppOnline()) {
    try {
      await apiDelete(`/api/teachers/${id}`, { skipOfflineQueue: true });
      // If server deletion succeeds, remove from localDb
      await teacherActions.deleteLocal(id);
      console.log(`✅ Deleted teacher ${id} from server and localDb`);
      return { id };
    } catch (error) {
      console.warn('[deleteTeacher] Server deletion failed, item marked for deletion. Will sync later:', error);
      // Item is already marked for deletion (status '0'), sync worker will handle it
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return { id };
    }
  }
  
  // If item was directly deleted (status 'w') or offline, trigger sync for other pending items
  if (result.deleted || !isAppOnline()) {
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
  }
  
  return { id };
}

export async function deleteUser(id: string): Promise<any> {
  const { deleteUserFromLocalDb } = await import('./utils/deleteFromLocalDb');
  
  // Delete based on status (handles 'w' -> direct delete, '1' -> mark for deletion)
  const result = await deleteUserFromLocalDb(id);
  
  // If item was marked for deletion (status '1' -> '0'), try to delete from server if online
  if (result.markedForDeletion && isAppOnline()) {
    try {
      await apiDelete(`/api/admin/users/${id}`, { skipOfflineQueue: true });
      // If server deletion succeeds, remove from localDb
      const { userActions } = await import('./dexie/dexieActions');
      await userActions.deleteLocal(id);
      console.log(`✅ Deleted user ${id} from server and localDb`);
      return { id };
    } catch (error) {
      console.warn('[deleteUser] Server deletion failed, item marked for deletion. Will sync later:', error);
      // Item is already marked for deletion (status '0'), sync worker will handle it
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return { id };
    }
  }
  
  // If item was directly deleted (status 'w') or offline, trigger sync for other pending items
  if (result.deleted || !isAppOnline()) {
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
  }
  
  return { id };
}

export async function createTeacher(data: any): Promise<any> {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const managerId = data.managerId ?? userId;
  const recordId = data.id ?? generateObjectId();

  // Always save to localDb first with status 'w'
  const savedTeacher = await saveTeacherToLocalDb({
    id: recordId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    weeklySchedule: data.weeklySchedule,
    managerId,
  });

  if (isAppOnline()) {
    try {
      const response = await apiPost('/api/teachers', { ...data, id: recordId, managerId }, {
        skipOfflineQueue: true,
      });
      
      await cacheRecordToDexie('teachers', response ?? { ...data, id: recordId, managerId }, teacherActions);
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      
      return response ?? savedTeacher;
    } catch (error) {
      console.warn('[createTeacher] API call failed, will sync later:', error);
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return savedTeacher;
    }
  }

  return savedTeacher;
}

export async function getTeachers(managerId: string): Promise<any[]> {
  const allTeachers = await teacherActions.getAll();
  const local = allTeachers.filter(t => t.managerId === managerId);

  if (!isAppOnline()) {
    return local;
  }

  try {
    const remote = await apiGet(`/api/teachers?managerId=${managerId}`, {
      skipOfflineQueue: true,
    });
    
    if (Array.isArray(remote)) {
      await cacheCollectionToDexie('teachers', remote, teacherActions);
    }
    
    const updated = await teacherActions.getAll();
    return updated.filter(t => t.managerId === managerId);
  } catch (error) {
    console.warn('[getTeachers] Falling back to offline data:', error);
    return local;
  }
}

export async function updateTeacher(id: string, data: any): Promise<any> {
  const existing = await teacherActions.getLocal(id);
  const now = Date.now();
  
  const updatedTeacher: Teacher = {
    ...existing!,
    ...data,
    id,
    status: 'w' as const,
    updatedAt: now,
  };
  
  await teacherActions.putLocal(updatedTeacher);

  if (!isAppOnline()) {
    return updatedTeacher;
  }

  try {
    const response = await apiPut(`/api/teachers/${id}`, { ...data, id }, {
      skipOfflineQueue: true,
    });
    
    await cacheRecordToDexie('teachers', response ?? updatedTeacher, teacherActions);
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
    
    return response ?? updatedTeacher;
  } catch (error) {
    console.warn('[updateTeacher] Falling back to offline storage:', error);
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
    return updatedTeacher;
  }
}

export async function createReceipt(data: any): Promise<any> {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const managerId = data.managerId ?? userId;
  const recordId = data.id ?? generateObjectId();
  const dateValue = data.date ? (typeof data.date === 'number' ? data.date : new Date(data.date).getTime()) : Date.now();

  // Always save to localDb first with status 'w'
  const savedReceipt = await saveReceiptToLocalDb({
    id: recordId,
    receiptNumber: data.receiptNumber || `REC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    amount: data.amount || 0,
    type: (data.type || (data.studentId ? ReceiptType.STUDENT_PAYMENT : ReceiptType.TEACHER_PAYMENT)) as ReceiptType,
    description: data.description,
    paymentMethod: data.paymentMethod,
    date: dateValue,
    studentId: data.studentId,
    teacherId: data.teacherId,
    managerId,
  });

  if (isAppOnline()) {
    try {
      const response = await apiPost('/api/receipts', { ...data, id: recordId, managerId }, {
        skipOfflineQueue: true,
      });
      
      await cacheRecordToDexie('receipts', response ?? { ...data, id: recordId, managerId }, receiptActions);
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      
      return response ?? savedReceipt;
    } catch (error) {
      console.warn('[createReceipt] API call failed, will sync later:', error);
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return savedReceipt;
    }
  }

  return savedReceipt;
}

export async function getReceipts(managerId: string): Promise<any[]> {
  const allReceipts = await receiptActions.getAll();
  const local = allReceipts.filter(r => r.managerId === managerId);

  if (!isAppOnline()) {
    return local;
  }

  try {
    const remote = await apiGet(`/api/receipts?managerId=${managerId}`, {
      skipOfflineQueue: true,
    });
    
    if (Array.isArray(remote)) {
      await cacheCollectionToDexie('receipts', remote, receiptActions);
    }
    
    const updated = await receiptActions.getAll();
    return updated.filter(r => r.managerId === managerId);
  } catch (error) {
    console.warn('[getReceipts] Falling back to offline data:', error);
    return local;
  }
}

export async function createCenter(data: any): Promise<any> {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const adminId = data.adminId ?? userId;
  const recordId = data.id ?? generateObjectId();

  // Always save to localDb first with status 'w'
  const savedCenter = await saveCenterToLocalDb({
    id: recordId,
    name: data.name,
    address: data.address,
    phone: data.phone,
    classrooms: data.classrooms || [],
    workingDays: data.workingDays || [],
    managers: data.managers || [],
    adminId,
  });

  if (isAppOnline()) {
    try {
      const response = await apiPost('/api/centers', { ...data, id: recordId, adminId }, {
        skipOfflineQueue: true,
      });
      
      await cacheRecordToDexie('centers', response ?? { ...data, id: recordId, adminId }, centerActions);
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      
      return response ?? savedCenter;
    } catch (error) {
      console.warn('[createCenter] API call failed, will sync later:', error);
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return savedCenter;
    }
  }

  return savedCenter;
}

export async function getCenters(adminId: string): Promise<any[]> {
  const allCenters = await centerActions.getAll();
  const local = allCenters.filter(c => c.adminId === adminId);

  if (!isAppOnline()) {
    return local;
  }

  try {
    const remote = await apiGet(`/api/centers?adminId=${adminId}`, {
      skipOfflineQueue: true,
    });
    
    if (Array.isArray(remote)) {
      await cacheCollectionToDexie('centers', remote, centerActions);
    }
    
    const updated = await centerActions.getAll();
    return updated.filter(c => c.adminId === adminId);
  } catch (error) {
    console.warn('[getCenters] Falling back to offline data:', error);
    return local;
  }
}

export async function createSubject(data: any): Promise<any> {
  const recordId = data.id ?? generateObjectId();
  const centerId = data.centerId ?? '';

  // Always save to localDb first with status 'w'
  const savedSubject = await saveSubjectToLocalDb({
    id: recordId,
    name: data.name,
    grade: data.grade,
    price: data.price,
    duration: data.duration,
    centerId,
  });

  if (isAppOnline()) {
    try {
      const response = await apiPost('/api/subjects', { ...data, id: recordId }, {
        skipOfflineQueue: true,
      });
      
      await cacheRecordToDexie('subjects', response ?? { ...data, id: recordId }, subjectActions);
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      
      return response ?? savedSubject;
    } catch (error) {
      console.warn('[createSubject] API call failed, will sync later:', error);
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return savedSubject;
    }
  }

  return savedSubject;
}

export async function deleteSubject(id: string): Promise<any> {
  const { deleteSubjectFromLocalDb } = await import('./utils/deleteFromLocalDb');
  
  // Delete based on status (handles 'w' -> direct delete, '1' -> mark for deletion)
  const result = await deleteSubjectFromLocalDb(id);
  
  // If item was marked for deletion (status '1' -> '0'), try to delete from server if online
  if (result.markedForDeletion && isAppOnline()) {
    try {
      // API expects DELETE with body data
      const response = await fetch(`/api/subjects`, {
        method: 'DELETE',
        body: JSON.stringify({ subjectId: id }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete subject: ${response.statusText}`);
      }
      // If server deletion succeeds, remove from localDb
      await subjectActions.deleteLocal(id);
      console.log(`✅ Deleted subject ${id} from server and localDb`);
      return { id };
    } catch (error) {
      console.warn('[deleteSubject] Server deletion failed, item marked for deletion. Will sync later:', error);
      // Item is already marked for deletion (status '0'), sync worker will handle it
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return { id };
    }
  }
  
  // If item was directly deleted (status 'w') or offline, trigger sync for other pending items
  if (result.deleted || !isAppOnline()) {
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
  }
  
  return { id };
}

export async function deleteReceipt(id: string): Promise<any> {
  const { deleteReceiptFromLocalDb } = await import('./utils/deleteFromLocalDb');
  
  // Delete based on status (handles 'w' -> direct delete, '1' -> mark for deletion)
  const result = await deleteReceiptFromLocalDb(id);
  
  // If item was marked for deletion (status '1' -> '0'), try to delete from server if online
  if (result.markedForDeletion && isAppOnline()) {
    try {
      await apiDelete(`/api/receipts/${id}`, { skipOfflineQueue: true });
      // If server deletion succeeds, remove from localDb
      await receiptActions.deleteLocal(id);
      console.log(`✅ Deleted receipt ${id} from server and localDb`);
      return { id };
    } catch (error) {
      console.warn('[deleteReceipt] Server deletion failed, item marked for deletion. Will sync later:', error);
      // Item is already marked for deletion (status '0'), sync worker will handle it
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return { id };
    }
  }
  
  // If item was directly deleted (status 'w') or offline, trigger sync for other pending items
  if (result.deleted || !isAppOnline()) {
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
  }
  
  return { id };
}

export async function deleteCenter(id: string): Promise<any> {
  const { deleteCenterFromLocalDb } = await import('./utils/deleteFromLocalDb');
  
  // Delete based on status (handles 'w' -> direct delete, '1' -> mark for deletion)
  const result = await deleteCenterFromLocalDb(id);
  
  // If item was marked for deletion (status '1' -> '0'), try to delete from server if online
  if (result.markedForDeletion && isAppOnline()) {
    try {
      await apiDelete(`/api/centers/${id}`, { skipOfflineQueue: true });
      // If server deletion succeeds, remove from localDb
      await centerActions.deleteLocal(id);
      console.log(`✅ Deleted center ${id} from server and localDb`);
      return { id };
    } catch (error) {
      console.warn('[deleteCenter] Server deletion failed, item marked for deletion. Will sync later:', error);
      // Item is already marked for deletion (status '0'), sync worker will handle it
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return { id };
    }
  }
  
  // If item was directly deleted (status 'w') or offline, trigger sync for other pending items
  if (result.deleted || !isAppOnline()) {
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
  }
  
  return { id };
}

export async function deleteSchedule(id: string): Promise<any> {
  const { deleteScheduleFromLocalDb } = await import('./utils/deleteFromLocalDb');
  
  // Delete based on status (handles 'w' -> direct delete, '1' -> mark for deletion)
  const result = await deleteScheduleFromLocalDb(id);
  
  // If item was marked for deletion (status '1' -> '0'), try to delete from server if online
  if (result.markedForDeletion && isAppOnline()) {
    try {
      await apiDelete(`/api/schedules/${id}`, { skipOfflineQueue: true });
      // If server deletion succeeds, remove from localDb
      await scheduleActions.deleteLocal(id);
      console.log(`✅ Deleted schedule ${id} from server and localDb`);
      return { id };
    } catch (error) {
      console.warn('[deleteSchedule] Server deletion failed, item marked for deletion. Will sync later:', error);
      // Item is already marked for deletion (status '0'), sync worker will handle it
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return { id };
    }
  }
  
  // If item was directly deleted (status 'w') or offline, trigger sync for other pending items
  if (result.deleted || !isAppOnline()) {
    syncPendingEntities().catch(err => console.error('Sync failed:', err));
  }
  
  return { id };
}

export async function getSubjects(centerId: string): Promise<any[]> {
  const allSubjects = await subjectActions.getAll();
  const local = allSubjects.filter(s => s.centerId === centerId);

  if (!isAppOnline()) {
    return local;
  }

  try {
    const remote = await apiGet(`/api/subjects?centerId=${centerId}`, {
      skipOfflineQueue: true,
    });
    
    if (Array.isArray(remote)) {
      await cacheCollectionToDexie('subjects', remote, subjectActions);
    }
    
    const updated = await subjectActions.getAll();
    return updated.filter(s => s.centerId === centerId);
  } catch (error) {
    console.warn('[getSubjects] Falling back to offline data:', error);
    return local;
  }
}

export async function getSubjectsWithParams(params: Record<string, any> = {}): Promise<any[]> {
  const queryString = new URLSearchParams(params).toString();
  const url = `/api/subjects${queryString ? `?${queryString}` : ''}`;

  const local = await subjectActions.getAll();

  if (!isAppOnline()) {
    return local;
  }

  try {
    const remote = await apiGet(url, { skipOfflineQueue: true });
    
    if (Array.isArray(remote)) {
      await cacheCollectionToDexie('subjects', remote, subjectActions);
    }
    
    return await subjectActions.getAll();
  } catch (error) {
    console.warn('[getSubjectsWithParams] Falling back to offline data:', error);
    return local;
  }
}

export async function createSchedule(data: any): Promise<any> {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');

  const managerId = data.managerId ?? userId;
  const recordId = data.id ?? generateObjectId();

  // Always save to localDb first with status 'w'
  const savedSchedule = await saveScheduleToLocalDb({
    id: recordId,
    day: data.day,
    startTime: data.startTime,
    endTime: data.endTime,
    roomId: data.roomId,
    teacherId: data.teacherId,
    subjectId: data.subjectId,
    managerId,
    centerId: data.centerId,
  });

  if (isAppOnline()) {
    try {
      const response = await apiPost('/api/schedules', { ...data, id: recordId, managerId }, {
        skipOfflineQueue: true,
      });
      
      await cacheRecordToDexie('schedules', response ?? { ...data, id: recordId, managerId }, scheduleActions);
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      
      return response ?? savedSchedule;
    } catch (error) {
      console.warn('[createSchedule] API call failed, will sync later:', error);
      syncPendingEntities().catch(err => console.error('Sync failed:', err));
      return savedSchedule;
    }
  }

  return savedSchedule;
}

export async function getSchedules(managerId: string): Promise<any[]> {
  const allSchedules = await scheduleActions.getAll();
  const local = allSchedules.filter(s => s.managerId === managerId);

  if (!isAppOnline()) {
    return local;
  }

  try {
    const remote = await apiGet(`/api/schedules?managerId=${managerId}`, {
      skipOfflineQueue: true,
    });
    
    if (Array.isArray(remote)) {
      await cacheCollectionToDexie('schedules', remote, scheduleActions);
    }
    
    const updated = await scheduleActions.getAll();
    return updated.filter(s => s.managerId === managerId);
  } catch (error) {
    console.warn('[getSchedules] Falling back to offline data:', error);
    return local;
  }
}
