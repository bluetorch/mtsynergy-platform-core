/**
 * API Response Types Module
 *
 * NOTE: This file is a placeholder during early development phase.
 * Auto-generated types from BFF OpenAPI specification are preferred
 * and located in src/openapi/index.ts.
 *
 * @module api/types
 */

/**
 * Generic API response wrapper for all BFF endpoints
 *
 * @template T - The type of data returned in the response
 *
 * @example
 * ```typescript
 * import type { ApiResponse } from '@mtsynergy/platform-core/api/types';
 *
 * interface User {
 *   id: string;
 *   name: string;
 * }
 *
 * const response: ApiResponse<User> = {
 *   data: { id: '123', name: 'John' },
 *   meta: { page: 1, total: 100 }
 * };
 * ```
 *
 * @see ../types/api for production API response types
 * @deprecated Use types from src/openapi/index.ts instead
 * @public
 */
export interface ApiResponse<T> {
  /** Response data payload */
  data: T;

  /** Optional pagination and metadata */
  meta?: {
    /** Current page number (1-indexed) */
    page: number;

    /** Total number of items across all pages */
    total: number;
  };
}
