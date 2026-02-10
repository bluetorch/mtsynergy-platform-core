/**
 * W3C Trace Context parsing and injection for distributed tracing.
 *
 * Implements the W3C Trace Context specification (https://www.w3.org/TR/trace-context/)
 * for parsing and injecting traceparent and tracestate headers.
 *
 * Features:
 * - Strict W3C compliance with fail-fast validation
 * - TraceID and SpanID generation using cryptographic randomness
 * - Support for vendor-specific tracestate metadata
 * - Case-insensitive header lookup
 *
 * @packageDocumentation
 */

import type { TraceContext } from './trace-types';

/**
 * Regular expression for validating W3C traceparent header format.
 *
 * Matches: version-traceId-spanId-traceFlags
 * - version: 2 hex chars (version 00 required)
 * - traceId: 32 hex chars (lowercase)
 * - spanId: 16 hex chars (lowercase)
 * - traceFlags: 2 hex chars
 */
const TRACEPARENT_REGEX = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

/** All-zeros trace ID (invalid per W3C spec) */
const ALL_ZEROS_TRACE_ID = '00000000000000000000000000000000';

/** All-zeros span ID (invalid per W3C spec) */
const ALL_ZEROS_SPAN_ID = '0000000000000000';

/** Forbidden version indicator (0xff means future version, not supported) */
const FORBIDDEN_VERSION = 'ff';

/**
 * Generates a random trace ID compliant with W3C Trace Context specification.
 *
 * Creates a 128-bit (32 hex character) random trace ID using platform cryptography.
 * Retries if all zeros (invalid per spec) to ensure maximum uniqueness.
 *
 * @returns {string} A 32-character lowercase hexadecimal string representing the trace ID.
 *
 * @example
 * ```typescript
 * const traceId = generateTraceId();
 * console.log(traceId); // "6ba7b8109dad11d180b400c04fd430c8"
 * assert(traceId.length === 32);
 * ```
 *
 * @see https://www.w3.org/TR/trace-context/#trace-id
 */
export const generateTraceId = (): string => {
  // Generate random bytes and convert to hex
  // Use a loop to ensure we don't generate all zeros
  let traceId: string;
  do {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    traceId = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } while (traceId === ALL_ZEROS_TRACE_ID);

  return traceId;
};

/**
 * Generates a random span ID compliant with W3C Trace Context specification.
 *
 * Creates a 64-bit (16 hex character) random span ID using platform cryptography.
 * Retries if all zeros (invalid per spec) to ensure maximum uniqueness.
 *
 * @returns {string} A 16-character lowercase hexadecimal string representing the span ID.
 *
 * @example
 * ```typescript
 * const spanId = generateSpanId();
 * console.log(spanId); // "b7ad6b7169203331"
 * assert(spanId.length === 16);
 * ```
 *
 * @see https://www.w3.org/TR/trace-context/#parent-id
 */
export const generateSpanId = (): string => {
  // Generate random bytes and convert to hex
  // Use a loop to ensure we don't generate all zeros
  let spanId: string;
  do {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    spanId = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } while (spanId === ALL_ZEROS_SPAN_ID);

  return spanId;
};

/**
 * Extracts W3C Trace Context from HTTP headers.
 *
 * Parses the traceparent header (required) and optional tracestate header
 * into a TraceContext object. Validates strict W3C compliance and returns null
 * for any invalid input rather than throwing exceptions.
 *
 * Header lookup is case-insensitive per HTTP/RFC7230 specification.
 *
 * @param {Headers} headers - HTTP headers object (e.g., fetch Headers API)
 * @returns {TraceContext | null} Parsed trace context, or null if invalid/missing
 *
 * @throws {never} This function never throws; validation failures return null
 *
 * @example
 * ```typescript
 * const headers = new Headers({
 *   'traceparent': '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-01',
 *   'tracestate': 'vendor1=value1,vendor2=value2'
 * });
 *
 * const context = extractTraceContext(headers);
 * if (context) {
 *   console.log(context.traceId); // "6ba7b8109dad11d180b400c04fd430c8"
 * }
 * ```
 *
 * Validation rules:
 * - Version MUST be "00"
 * - TraceId MUST be 32 lowercase hex chars, not all zeros
 * - SpanId MUST be 16 lowercase hex chars, not all zeros
 * - TraceFlags MUST be valid hex
 *
 * @see https://www.w3.org/TR/trace-context/#traceparent-header
 * @see https://www.w3.org/TR/trace-context/#tracestate-header
 */
export const extractTraceContext = (headers: Headers): TraceContext | null => {
  // Try to get traceparent header (case-insensitive lookup)
  let traceParent = headers.get('traceparent');
  if (!traceParent) {
    // Try alternate casings by iterating through headers
    // Some environments (like Node.js fetch) support iteration
    try {
      for (const [key, value] of headers as any) {
        if (key.toLowerCase() === 'traceparent') {
          traceParent = value;
          break;
        }
      }
    } catch {
      // If iteration not supported, continue with null
    }
  }

  // Return null if no traceparent header found
  if (!traceParent) {
    return null;
  }

  // Validate format against W3C regex
  const match = TRACEPARENT_REGEX.exec(traceParent);
  if (!match) {
    return null;
  }

  const [, traceId, spanId, traceFlags] = match;

  // Validate trace ID is not all zeros
  if (traceId === ALL_ZEROS_TRACE_ID) {
    return null;
  }

  // Validate span ID is not all zeros
  if (spanId === ALL_ZEROS_SPAN_ID) {
    return null;
  }

  // Parse trace flags as hex number
  const traceFlagsNum = parseInt(traceFlags, 16);

  // Attempt to get tracestate header (optional, case-insensitive)
  let tracestate: string | undefined;
  try {
    for (const [key, value] of headers as any) {
      if (key.toLowerCase() === 'tracestate') {
        // Per RFC7230, multiple header values should be comma-separated
        tracestate = tracestate ? `${tracestate},${value}` : value;
      }
    }
  } catch {
    // If iteration not supported, continue
  }

  return {
    traceId,
    spanId,
    traceFlags: traceFlagsNum,
    tracestate,
  };
};

/**
 * Validates that a string is in proper W3C hex format (lowercase, correct length).
 *
 * @internal
 */
const isValidHexString = (str: string, expectedLength: number): boolean => {
  if (str.length !== expectedLength) {
    return false;
  }
  return /^[0-9a-f]*$/.test(str);
};

/**
 * Injects W3C Trace Context into HTTP headers.
 *
 * Formats the trace context as a traceparent header (and optional tracestate)
 * and sets them on the provided Headers object. Validates all context fields
 * before injection with strict error handling.
 *
 * @param {TraceContext} context - The trace context to inject
 * @param {Headers} headers - HTTP headers object to modify (mutated in-place)
 * @throws {Error} If context values are invalid
 *
 * @example
 * ```typescript
 * const context: TraceContext = {
 *   traceId: '6ba7b8109dad11d180b400c04fd430c8',
 *   spanId: 'b7ad6b7169203331',
 *   traceFlags: 0x01,
 *   tracestate: 'vendor1=value1',
 * };
 *
 * const headers = new Headers();
 * injectTraceContext(context, headers);
 * console.log(headers.get('traceparent'));
 * // "00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-01"
 * ```
 *
 * Validation:
 * - traceId must be 32 lowercase hex chars, not all zeros
 * - spanId must be 16 lowercase hex chars, not all zeros
 * - traceFlags must be 0x00 or 0x01 (or valid 0-0xff in future)
 *
 * @see https://www.w3.org/TR/trace-context/#traceparent-header
 */
export const injectTraceContext = (context: TraceContext, headers: Headers): void => {
  // Validate trace ID
  if (!isValidHexString(context.traceId, 32)) {
    throw new Error(
      `Invalid traceId: must be 32 lowercase hex characters, got "${context.traceId}"`
    );
  }
  if (context.traceId === ALL_ZEROS_TRACE_ID) {
    throw new Error('Invalid traceId: must not be all zeros');
  }

  // Validate span ID
  if (!isValidHexString(context.spanId, 16)) {
    throw new Error(`Invalid spanId: must be 16 lowercase hex characters, got "${context.spanId}"`);
  }
  if (context.spanId === ALL_ZEROS_SPAN_ID) {
    throw new Error('Invalid spanId: must not be all zeros');
  }

  // Validate trace flags
  if (
    typeof context.traceFlags !== 'number' ||
    context.traceFlags < 0 ||
    context.traceFlags > 0xff
  ) {
    throw new Error(
      `Invalid traceFlags: must be a number between 0x00 and 0xff, got ${context.traceFlags}`
    );
  }

  // Format and set traceparent header
  const traceFlagsHex = context.traceFlags.toString(16).padStart(2, '0');
  const traceparent = `00-${context.traceId}-${context.spanId}-${traceFlagsHex}`;
  headers.set('traceparent', traceparent);

  // Set tracestate header if present
  if (context.tracestate) {
    headers.set('tracestate', context.tracestate);
  }
};
