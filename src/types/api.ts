/**
 * API Response Wrapper Types
 * Standardized response formats for all API calls across MTSynergy platform
 */

/**
 * Successful API response wrapper
 * @template T - The type of data returned in the response
 * @example
 * const response: ApiSuccessResponse<User> = {
 *   status: 'success',
 *   data: { id: '123', name: 'John' },
 *   meta: { timestamp: '2026-02-03T10:00:00Z' }
 * };
 */
export interface ApiSuccessResponse<T> {
  /** Response status - always 'success' for successful responses */
  status: 'success';

  /** The actual response data */
  data: T;

  /** Optional metadata about the response */
  meta?: {
    /** Timestamp when the response was generated (ISO 8601) */
    timestamp?: string;

    /** Request ID for tracking and debugging */
    requestId?: string;

    /** API version that served this response */
    version?: string;

    /** Additional metadata fields */
    [key: string]: unknown;
  };
}

/**
 * Error API response wrapper
 * Standardized error format for failed API calls
 * @example
 * const response: ApiErrorResponse = {
 *   status: 'error',
 *   error: {
 *     code: 'VALIDATION_ERROR',
 *     message: 'Invalid input',
 *     fields: { email: ['Invalid format'] }
 *   }
 * };
 */
export interface ApiErrorResponse {
  /** Response status - always 'error' for error responses */
  status: 'error';

  /** Error details */
  error: {
    /** Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED') */
    code: string;

    /** Human-readable error message */
    message: string;

    /** Optional detailed error information */
    details?: unknown;

    /** Field-specific validation errors (field name → error messages) */
    fields?: Record<string, string[]>;
  };

  /** Optional metadata about the error */
  meta?: {
    /** Timestamp when the error occurred (ISO 8601) */
    timestamp?: string;

    /** Request ID for tracking and debugging */
    requestId?: string;

    /** API version that returned this error */
    version?: string;

    /** Additional metadata fields */
    [key: string]: unknown;
  };
}

/**
 * Generic API response type (discriminated union of success or error)
 * @template T - The type of data returned in successful responses
 * @example
 * function handleResponse<T>(response: ApiResponse<T>) {
 *   if (isSuccessResponse(response)) {
 *     console.log(response.data); // TypeScript knows this is T
 *   } else {
 *     console.error(response.error.message);
 *   }
 * }
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guard to check if response is successful
 * Enables TypeScript to narrow the type in conditional blocks
 * @param response - The API response to check
 * @returns True if response is a success response
 * @example
 * if (isSuccessResponse(response)) {
 *   // TypeScript knows response.data exists here
 *   console.log(response.data);
 * }
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.status === 'success';
}

/**
 * Type guard to check if response is an error
 * Enables TypeScript to narrow the type in conditional blocks
 * @param response - The API response to check
 * @returns True if response is an error response
 * @example
 * if (isErrorResponse(response)) {
 *   // TypeScript knows response.error exists here
 *   console.error(response.error.code);
 * }
 */
export function isErrorResponse<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.status === 'error';
}
