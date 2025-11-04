/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ServerAction - Handles all server API calls and network error handling
 * Provides clean separation of network logic from local storage
 */
import { SyncableItem } from './syncable-item';

export interface ServerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface ServerError extends Error {
  status?: number;
  networkError?: boolean;
}

/**
 * ServerAction - All server API operations
 */
export class ServerAction {
  /**
   * Check if we're online
   */
  static isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }

  /**
   * Create a network error
   */
  private static createNetworkError(message: string, status?: number): ServerError {
    const error = new Error(message) as ServerError;
    error.status = status;
    error.networkError = true;
    return error;
  }

  /**
   * Make a fetch request with timeout and error handling
   */
  private static async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = 10000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createNetworkError('Request timeout', 408);
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw this.createNetworkError('Network error - offline or server unreachable', 0);
      }
      throw error;
    }
  }

  /**
   * POST - Create item on server
   */
  static async createItem(
    apiEndpoint: string,
    data: Omit<SyncableItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<ServerResponse<SyncableItem>> {
    if (!this.isOnline()) {
      throw this.createNetworkError('Offline - cannot create item on server', 0);
    }

    try {
      const response = await this.fetchWithTimeout(apiEndpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw this.createNetworkError(
          `Server error: ${errorText}`,
          response.status
        );
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        status: response.status
      };
    } catch (error) {
      if (error instanceof Error && 'networkError' in error) {
        return {
          success: false,
          error: error.message,
          status: (error as ServerError).status
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * PUT - Update item on server
   */
  static async updateItem(
    apiEndpoint: string,
    itemId: string,
    data: Partial<Omit<SyncableItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>>
  ): Promise<ServerResponse<SyncableItem>> {
    if (!this.isOnline()) {
      throw this.createNetworkError('Offline - cannot update item on server', 0);
    }

    try {
      const response = await this.fetchWithTimeout(`${apiEndpoint}/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw this.createNetworkError(
          `Server error: ${errorText}`,
          response.status
        );
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        status: response.status
      };
    } catch (error) {
      if (error instanceof Error && 'networkError' in error) {
        return {
          success: false,
          error: error.message,
          status: (error as ServerError).status
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * DELETE - Delete item on server
   */
  static async deleteItem(
    apiEndpoint: string,
    itemId: string
  ): Promise<ServerResponse<void>> {
    if (!this.isOnline()) {
      throw this.createNetworkError('Offline - cannot delete item on server', 0);
    }

    try {
      const response = await this.fetchWithTimeout(`${apiEndpoint}/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw this.createNetworkError(
          `Server error: ${errorText}`,
          response.status
        );
      }

      return {
        success: true,
        status: response.status
      };
    } catch (error) {
      if (error instanceof Error && 'networkError' in error) {
        return {
          success: false,
          error: error.message,
          status: (error as ServerError).status
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * GET - Fetch items from server
   */
  static async fetchItems(apiEndpoint: string): Promise<ServerResponse<SyncableItem[]>> {
    if (!this.isOnline()) {
      throw this.createNetworkError('Offline - cannot fetch items from server', 0);
    }

    try {
      const response = await this.fetchWithTimeout(apiEndpoint, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw this.createNetworkError(
          `Server error: ${errorText}`,
          response.status
        );
      }

      const result = await response.json();
      return {
        success: true,
        data: Array.isArray(result) ? result : [result],
        status: response.status
      };
    } catch (error) {
      if (error instanceof Error && 'networkError' in error) {
        return {
          success: false,
          error: error.message,
          status: (error as ServerError).status
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if an error is a network/offline error
   */
  static isNetworkError(error: any): boolean {
    return (
      error &&
      typeof error === 'object' &&
      'networkError' in error &&
      error.networkError === true
    );
  }
}

