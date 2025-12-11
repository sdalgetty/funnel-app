// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Custom error class for service errors
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

/**
 * Result type for operations that can fail
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };

/**
 * Helper to create a success result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Helper to create an error result
 */
export function failure(error: ServiceError): Result<never> {
  return { success: false, error };
}

/**
 * Error codes for different error types
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // Permission errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VIEW_ONLY_MODE: 'VIEW_ONLY_MODE',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  
  // Data errors
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Create a user-friendly error message from an error
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ServiceError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Handle common Supabase errors
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (error.message.includes('Email already registered')) {
      return 'This email is already registered. Please sign in instead.';
    }
    if (error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is a specific type
 */
export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}




