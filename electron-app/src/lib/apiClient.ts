/* eslint-disable @typescript-eslint/no-explicit-any */

// API client for Electron - uses IPC to communicate with main process
export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function getServerPort(): Promise<number> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return await window.electronAPI.getServerPort();
  }
  return 3001; // Default fallback
}

async function electronRequest(
  method: string,
  url: string,
  data?: any,
  headers?: Record<string, string>
): Promise<ApiResponse> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      return await window.electronAPI.apiRequest(method, url, data, headers);
    } catch (error: any) {
      return {
        ok: false,
        status: 500,
        error: error.message,
      };
    }
  }

  // Fallback to HTTP if not in Electron
  const port = await getServerPort();
  try {
    const response = await fetch(`http://localhost:${port}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    const result = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data: result,
      error: response.ok ? undefined : result.error,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 500,
      error: error.message,
    };
  }
}

export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await electronRequest('GET', url);
  if (!response.ok) {
    throw new Error(response.error || 'Request failed');
  }
  return response.data as T;
}

export async function apiPost<T = any>(url: string, data: any): Promise<T> {
  const response = await electronRequest('POST', url, data);
  if (!response.ok) {
    throw new Error(response.error || 'Request failed');
  }
  return response.data as T;
}

export async function apiPut<T = any>(url: string, data: any): Promise<T> {
  const response = await electronRequest('PUT', url, data);
  if (!response.ok) {
    throw new Error(response.error || 'Request failed');
  }
  return response.data as T;
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await electronRequest('DELETE', url);
  if (!response.ok) {
    throw new Error(response.error || 'Request failed');
  }
  return response.data as T;
}

// Helper functions matching the original API client
export async function createStudent(data: any): Promise<any> {
  return apiPost('/api/students', data);
}

export async function getStudents(managerId?: string): Promise<any[]> {
  const url = managerId ? `/api/students?managerId=${managerId}` : '/api/students';
  return apiGet(url);
}

export async function updateStudent(id: string, data: any): Promise<any> {
  return apiPut(`/api/students/${id}`, data);
}

export async function deleteStudent(id: string): Promise<any> {
  return apiDelete(`/api/students/${id}`);
}

export async function createTeacher(data: any): Promise<any> {
  return apiPost('/api/teachers', data);
}

export async function getTeachers(managerId?: string): Promise<any[]> {
  const url = managerId ? `/api/teachers?managerId=${managerId}` : '/api/teachers';
  return apiGet(url);
}

export async function updateTeacher(id: string, data: any): Promise<any> {
  return apiPut(`/api/teachers/${id}`, data);
}

export async function createReceipt(data: any): Promise<any> {
  return apiPost('/api/receipts', data);
}

export async function getReceipts(managerId?: string): Promise<any[]> {
  const url = managerId ? `/api/receipts?managerId=${managerId}` : '/api/receipts';
  return apiGet(url);
}

export async function createCenter(data: any): Promise<any> {
  return apiPost('/api/center', data);
}

export async function getCenters(adminId?: string): Promise<any[]> {
  const url = adminId ? `/api/center?adminId=${adminId}` : '/api/center';
  return apiGet(url);
}

export async function createSubject(data: any): Promise<any> {
  return apiPost('/api/subjects', data);
}

export async function getSubjects(centerId?: string): Promise<any[]> {
  const url = centerId ? `/api/subjects?centerId=${centerId}` : '/api/subjects';
  return apiGet(url);
}

export async function getSubjectsWithParams(params: any = {}): Promise<any[]> {
  const queryString = new URLSearchParams(params).toString();
  const url = `/api/subjects${queryString ? '?' + queryString : ''}`;
  return apiGet(url);
}

