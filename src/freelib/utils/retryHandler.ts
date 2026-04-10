/**
 * Retry Handler with Exponential Backoff
 * Provides robust error handling and automatic retry logic for sync operations
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: unknown) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error && typeof error === 'object') {
      const statusCode = (error as { response?: { status?: number } }).response?.status;
      
      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        return statusCode === 408 || statusCode === 429;
      }
      
      // Retry on server errors (5xx) and network errors
      return true;
    }
    return true;
  },
};

/**
 * Execute an async function with retry logic
 * 
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Promise<T> - The result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let attempt = 0;
  let lastError: unknown;

  while (attempt < config.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      // Check if we should retry
      if (!config.shouldRetry(error)) {
        console.error(`❌ Non-retryable error on attempt ${attempt}:`, error);
        throw error;
      }

      // If max attempts reached, throw the last error
      if (attempt >= config.maxAttempts) {
        console.error(`❌ Max retry attempts (${config.maxAttempts}) reached`);
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      console.warn(
        `⚠️ Attempt ${attempt}/${config.maxAttempts} failed, retrying in ${delay}ms...`,
        error
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries failed, throw the last error
  throw lastError;
}

/**
 * Batch retry handler - retries a batch of operations
 * Failed operations are collected and can be retried later
 */
export class BatchRetryHandler<T> {
  private failedOperations: Array<{ data: T; error: unknown; attempts: number }> = [];
  private maxAttempts: number;

  constructor(maxAttempts: number = 3) {
    this.maxAttempts = maxAttempts;
  }

  /**
   * Execute a single operation with retry tracking
   */
  async execute(
    operation: (data: T) => Promise<void>,
    data: T
  ): Promise<{ success: boolean; error?: unknown }> {
    try {
      await withRetry(() => operation(data), { maxAttempts: this.maxAttempts });
      return { success: true };
    } catch (error) {
      // Track failed operation
      this.failedOperations.push({ data, error, attempts: this.maxAttempts });
      return { success: false, error };
    }
  }

  /**
   * Get all failed operations
   */
  getFailedOperations(): Array<{ data: T; error: unknown; attempts: number }> {
    return this.failedOperations;
  }

  /**
   * Retry all failed operations
   */
  async retryFailed(
    operation: (data: T) => Promise<void>
  ): Promise<{ successCount: number; failedCount: number }> {
    const toRetry = [...this.failedOperations];
    this.failedOperations = [];

    let successCount = 0;
    let failedCount = 0;

    for (const { data } of toRetry) {
      const result = await this.execute(operation, data);
      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    return { successCount, failedCount };
  }

  /**
   * Clear all failed operations
   */
  clear(): void {
    this.failedOperations = [];
  }

  /**
   * Check if there are failed operations
   */
  hasFailed(): boolean {
    return this.failedOperations.length > 0;
  }
}

