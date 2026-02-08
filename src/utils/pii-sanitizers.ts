/**
 * Core PII sanitization functions for removing sensitive data from strings and objects.
 * Uses regex-based pattern matching with customizable replacement tokens.
 */

import type { PiiPattern, ScrubOptions } from './pii-types';
import { applyPatterns } from './pii-applier';

/**
 * Sanitizes email addresses in a string
 * @param str - Input string
 * @param replacement - Optional custom replacement token (default: '[REDACTED-EMAIL]')
 * @returns Sanitized string with email addresses replaced
 * @example
 * sanitizeEmail('Contact: john@example.com') // 'Contact: [REDACTED-EMAIL]'
 * sanitizeEmail('Email: test@test.com', '[EMAIL]') // 'Email: [EMAIL]'
 */
export function sanitizeEmail(str: string, replacement?: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  const token = replacement || '[REDACTED-EMAIL]';
  // Regex covers standard emails, plus-addressing (gmail+tag), subdomains, international TLDs
  const emailRegex = /[\w+.-]+@[\w.-]+\.\w{2,}/g;

  try {
    return str.replace(emailRegex, token);
  } catch (error) {
    console.warn(
      `[PII] Failed to sanitize email: ${error instanceof Error ? error.message : String(error)}`
    );
    return str;
  }
}

/**
 * Sanitizes phone numbers in a string (all international formats)
 * @param str - Input string
 * @param replacement - Optional custom replacement token (default: '[REDACTED-PHONE]')
 * @returns Sanitized string with phone numbers replaced
 * @example
 * sanitizePhone('Call +1-555-1234') // 'Call [REDACTED-PHONE]'
 * sanitizePhone('(555) 123-4567') // '[REDACTED-PHONE]'
 */
export function sanitizePhone(str: string, replacement?: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  const token = replacement || '[REDACTED-PHONE]';
  // Regex covers: +1-555-1234, (555) 123-4567, 555.123.4567, +44-20-7946-0958, extensions
  const phoneRegex =
    /(?:\+\d{1,3}[-.\s]?)?\(?(?:\d{2,4})\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}(?:\s?(?:ext\.?|x|extension)\s?\d{2,6})?/gi;

  try {
    return str.replace(phoneRegex, token);
  } catch (error) {
    console.warn(
      `[PII] Failed to sanitize phone: ${error instanceof Error ? error.message : String(error)}`
    );
    return str;
  }
}

/**
 * Sanitizes OAuth tokens and API tokens in Bearer token format
 * @param str - Input string
 * @param replacement - Optional custom replacement token (default: 'Bearer [REDACTED-TOKEN]')
 * @returns Sanitized string with tokens replaced
 * @example
 * redactToken('Bearer eyJhbGc...') // 'Bearer [REDACTED-TOKEN]'
 * redactToken('Authorization: Bearer abc123xyz', 'Bearer [TOKEN]') // 'Authorization: Bearer [TOKEN]'
 */
export function redactToken(str: string, replacement?: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  const token = replacement || 'Bearer [REDACTED-TOKEN]';
  // Regex covers: Bearer tokens (JWT-like), API keys, explicit token patterns
  const tokenRegex = /Bearer\s+[a-zA-Z0-9._-]+/gi;

  try {
    return str.replace(tokenRegex, token);
  } catch (error) {
    console.warn(
      `[PII] Failed to redact token: ${error instanceof Error ? error.message : String(error)}`
    );
    return str;
  }
}

/**
 * Masks long identifiers (API keys, long tokens)
 * @param str - Input string
 * @param replacement - Optional custom replacement token (default: '[REDACTED-IDENTIFIER]')
 * @returns Sanitized string with identifiers replaced
 * @example
 * maskIdentifier('Key: sk_live_1234567890abcdefghijklmnop') // 'Key: [REDACTED-IDENTIFIER]'
 */
export function maskIdentifier(str: string, replacement?: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  const token = replacement || '[REDACTED-IDENTIFIER]';
  // Regex for long alphanumeric sequences (API keys, long tokens)
  // Matches: sequences of 40+ alphanumeric chars with underscores/dashes
  const identifierRegex = /[a-zA-Z0-9._-]{40,}/g;

  try {
    return str.replace(identifierRegex, token);
  } catch (error) {
    console.warn(
      `[PII] Failed to mask identifier: ${error instanceof Error ? error.message : String(error)}`
    );
    return str;
  }
}

/**
 * Recursively sanitizes an object/array by applying patterns to all string values
 * @param obj - Object or array to sanitize
 * @param patterns - PiiPattern array (must be validated patterns)
 * @param options - ScrubOptions with optional maxDepth (default: 50)
 * @returns New object/array with all string values sanitized
 * @note Uses WeakSet for circular reference detection
 * @note Returns new object; does not mutate original
 * @example
 * const obj = {email: 'test@example.com', nested: {phone: '+1234567890'}}
 * const sanitized = scrubObject(obj, patterns)
 * // {email: '[REDACTED-EMAIL]', nested: {phone: '[REDACTED-PHONE]'}}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scrubObject(obj: any, patterns: PiiPattern[], options?: ScrubOptions): any {
  // Validate inputs
  if (!Array.isArray(patterns)) {
    console.warn('[PII] scrubObject: patterns must be an array');
    return obj;
  }

  // Initialize options with defaults
  const maxDepth = options?.maxDepth ?? 50;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visited = options?.visited ?? new WeakSet<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processed = new WeakMap<any, any>();

  // Handle null and primitives
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Detect circular references
  if (visited.has(obj)) {
    return obj;
  }

  // Handle strings (apply patterns)
  if (typeof obj === 'string') {
    return applyPatterns(obj, patterns);
  }

  // Helper for recursive traversal with depth tracking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function traverse(current: any, depth: number): any {
    // Depth limit check
    if (depth > maxDepth) {
      return current;
    }

    // Handle null and primitives
    if (current === null || current === undefined || typeof current !== 'object') {
      if (typeof current === 'string') {
        return applyPatterns(current, patterns);
      }
      return current;
    }

    // Check if we've already processed this object
    if (processed.has(current)) {
      return processed.get(current);
    }

    // Detect circular references
    if (visited.has(current)) {
      return current;
    }

    visited.add(current);

    // Handle arrays
    if (Array.isArray(current)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newArray: any[] = [];
      for (let i = 0; i < current.length; i++) {
        newArray[i] = traverse(current[i], depth + 1);
      }
      processed.set(current, newArray);
      return newArray;
    }

    // Handle Date, RegExp, Set, Map, and other special objects (passthrough)
    if (
      current instanceof Date ||
      current instanceof RegExp ||
      current instanceof Set ||
      current instanceof Map ||
      typeof current.toJSON === 'function'
    ) {
      return current;
    }

    // Handle plain objects
    const newObj: Record<string, any> = {};
    const keys = Object.keys(current);

    for (const key of keys) {
      try {
        const value = current[key];
        newObj[key] = traverse(value, depth + 1);
      } catch (error) {
        console.warn(
          `[PII] Failed to traverse key "${key}": ${error instanceof Error ? error.message : String(error)}`
        );
        // Skip this key on error
        continue;
      }
    }

    processed.set(current, newObj);
    return newObj;
  }

  return traverse(obj, 0);
}
