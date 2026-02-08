/**
 * Correlation ID utilities for request tracing.
 *
 * Provides UUID v4 generation and validation for correlation IDs,
 * which are used to track requests across distributed system components.
 *
 * @packageDocumentation
 */

import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid';

/**
 * Branded type for validated Correlation IDs (UUID v4).
 * The `__brand` property prevents accidental usage of non-validated strings
 * where a valid Correlation ID is required.
 *
 * @example
 * ```typescript
 * const id: CorrelationId = generateCorrelationId();
 * ```
 */
export type CorrelationId = string & { readonly __brand: 'CorrelationId' };

/**
 * Generates a new UUID v4 for use as a Correlation ID.
 *
 * Uses the stable RFC4122 v4 UUID format, which is suitable for
 * correlation across distributed systems with low collision risk.
 *
 * @returns {CorrelationId} A newly generated UUID v4 Correlation ID.
 *
 * @example
 * ```typescript
 * const correlationId = generateCorrelationId();
 * console.log(correlationId); // e.g., "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export const generateCorrelationId = (): CorrelationId => {
  return uuidv4() as CorrelationId;
};

/**
 * Validates if a string is a valid UUID v4 Correlation ID.
 *
 * Checks both the UUID structure and confirms it is specifically version 4
 * to maintain consistency across correlation tracking.
 *
 * @param {string} id - The ID to validate.
 * @returns {boolean} `true` if the ID is a valid UUID v4, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (isValidCorrelationId(id)) {
 *   // ID is valid and can be used for correlation
 * }
 * ```
 */
export const isValidCorrelationId = (id: string): id is CorrelationId => {
  return uuidValidate(id) && uuidVersion(id) === 4;
};
