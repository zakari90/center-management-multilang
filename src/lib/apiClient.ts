/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner';
import { localDb } from './dexie';
import {
  addStudentOffline,
  updateStudentOffline,
  deleteStudentOffline,
  getStudentsOffline,
  addTeacherOffline,
  updateTeacherOffline,
  getTeachersOffline,
  addReceiptOffline,
  getReceiptsOffline,
  addCenterOffline,
  getCentersOffline,
  addSubjectOffline,
  getSubjectsOffline,
  addScheduleOffline,
  getSchedulesOffline,
} from './offlineApi';

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

  // For POST/PUT/DELETE, queue for sync if not skipped
  if (['POST', 'PUT', 'DELETE'].includes(method) && !skipOfflineQueue && offlineEntity) {
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
  entity: string,
  fallback?: () => Promise<any>
): Promise<any> {
  try {
    // Determine operation type
    if (method === 'POST') {
      // Create operation - use provided fallback function
      if (fallback) {
        const result = await fallback();
        toast.success(`Saved offline - will sync when online`, { duration: 3000 });
        return result;
      }
    } else if (method === 'PUT') {
      // Update operation
      if (fallback) {
        const result = await fallback();
        toast.success(`Updated offline - will sync when online`, { duration: 3000 });
        return result;
      }
    } else if (method === 'DELETE') {
      // Delete operation
      if (fallback) {
        const result = await fallback();
        toast.success(`Deleted offline - will sync when online`, { duration: 3000 });
        return result;
      }
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
 * Get user ID from local storage (for offline operations)
 */
function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('auth');
    if (!authData) return null;
    const parsed = JSON.parse(authData);
    return parsed.user?.id || null;
  } catch {
    return null;
  }
}

// ============================================================================
// SPECIALIZED OFFLINE-CAPABLE FUNCTIONS FOR COMMON OPERATIONS
// ============================================================================

/**
 * Create a student with offline support
 */
export async function createStudent(data: any): Promise<any> {
  const userId = getUserId();
  if (!userId) throw new Error('Not authenticated');

  return apiPost('/api/students', data, {
    offlineEntity: 'students',
    offlineFallback: async () => {
      const result = await addStudentOffline(data, userId);
      return result;
    },
  });
}

/**
 * Get students with offline fallback
 */
export async function getStudents(managerId: string): Promise<any[]> {
  return apiGet(`/api/students?managerId=${managerId}`, {
    offlineFallback: async () => {
      return await getStudentsOffline(managerId);
    },
  }).catch(async () => {
    // If network fails, fallback to IndexedDB
    return await getStudentsOffline(managerId);
  });
}

/**
 * Update a student with offline support
 */
export async function updateStudent(id: string, data: any): Promise<any> {
  return apiPut(`/api/students/${id}`, data, {
    offlineEntity: 'students',
    offlineFallback: async () => {
      await updateStudentOffline(id, data);
      return { id, ...data };
    },
  });
}

/**
 * Delete a student with offline support
 */
export async function deleteStudent(id: string): Promise<any> {
  return apiDelete(`/api/students/${id}`, {
    offlineEntity: 'students',
    offlineFallback: async () => {
      await deleteStudentOffline(id);
      return { id };
    },
  });
}

/**
 * Create a teacher with offline support
 */
export async function createTeacher(data: any): Promise<any> {
  const userId = getUserId();
  if (!userId) throw new Error('Not authenticated');

  return apiPost('/api/teachers', data, {
    offlineEntity: 'teachers',
    offlineFallback: async () => {
      return await addTeacherOffline(data, userId);
    },
  });
}

/**
 * Get teachers with offline fallback
 */
export async function getTeachers(managerId: string): Promise<any[]> {
  return apiGet(`/api/teachers?managerId=${managerId}`, {
    offlineFallback: async () => {
      return await getTeachersOffline(managerId);
    },
  }).catch(async () => {
    return await getTeachersOffline(managerId);
  });
}

/**
 * Update a teacher with offline support
 */
export async function updateTeacher(id: string, data: any): Promise<any> {
  return apiPut(`/api/teachers/${id}`, data, {
    offlineEntity: 'teachers',
    offlineFallback: async () => {
      await updateTeacherOffline(id, data);
      return { id, ...data };
    },
  });
}

/**
 * Create a receipt with offline support
 */
export async function createReceipt(data: any): Promise<any> {
  const userId = getUserId();
  if (!userId) throw new Error('Not authenticated');

  return apiPost('/api/receipts', data, {
    offlineEntity: 'receipts',
    offlineFallback: async () => {
      return await addReceiptOffline(data, userId);
    },
  });
}

/**
 * Get receipts with offline fallback
 */
export async function getReceipts(managerId: string): Promise<any[]> {
  return apiGet(`/api/receipts?managerId=${managerId}`, {
    offlineFallback: async () => {
      return await getReceiptsOffline(managerId);
    },
  }).catch(async () => {
    return await getReceiptsOffline(managerId);
  });
}

/**
 * Create a center with offline support
 */
export async function createCenter(data: any): Promise<any> {
  const userId = getUserId();
  if (!userId) throw new Error('Not authenticated');

  return apiPost('/api/centers', data, {
    offlineEntity: 'centers',
    offlineFallback: async () => {
      return await addCenterOffline(data, userId);
    },
  });
}

/**
 * Get centers with offline fallback
 */
export async function getCenters(adminId: string): Promise<any[]> {
  return apiGet(`/api/centers?adminId=${adminId}`, {
    offlineFallback: async () => {
      return await getCentersOffline(adminId);
    },
  }).catch(async () => {
    return await getCentersOffline(adminId);
  });
}

/**
 * Create a subject with offline support
 */
export async function createSubject(data: any): Promise<any> {
  return apiPost('/api/subjects', data, {
    offlineEntity: 'subjects',
    offlineFallback: async () => {
      const centerId = data.centerId || '';
      return await addSubjectOffline(data, centerId);
    },
  });
}

/**
 * Get subjects with offline fallback
 */
export async function getSubjects(centerId: string): Promise<any[]> {
  return apiGet(`/api/subjects?centerId=${centerId}`, {
    offlineFallback: async () => {
      return await getSubjectsOffline(centerId);
    },
  }).catch(async () => {
    return await getSubjectsOffline(centerId);
  });
}

/**
 * Get subjects with optional parameters (e.g., with teachers)
 */
export async function getSubjectsWithParams(params: any = {}): Promise<any[]> {
  const queryString = new URLSearchParams(params).toString();
  const url = `/api/subjects${queryString ? '?' + queryString : ''}`;
  
  return apiGet(url, {
    offlineFallback: async () => {
      // If offline and no centerId specified, return all subjects
      return await localDb.subjects.toArray();
    },
  }).catch(async () => {
    return await localDb.subjects.toArray();
  });
}

/**
 * Create a schedule with offline support
 */
export async function createSchedule(data: any): Promise<any> {
  const userId = getUserId();
  if (!userId) throw new Error('Not authenticated');

  return apiPost('/api/schedules', data, {
    offlineEntity: 'schedules',
    offlineFallback: async () => {
      return await addScheduleOffline(data, userId);
    },
  });
}

/**
 * Get schedules with offline fallback
 */
export async function getSchedules(managerId: string): Promise<any[]> {
  return apiGet(`/api/schedules?managerId=${managerId}`, {
    offlineFallback: async () => {
      return await getSchedulesOffline(managerId);
    },
  }).catch(async () => {
    return await getSchedulesOffline(managerId);
  });
}
