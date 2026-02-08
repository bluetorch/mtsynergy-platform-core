/**
 * Internal utility for applying PII patterns to strings.
 * Not exported; used internally by sanitizers and scrubObject.
 */

import type { PiiPattern } from './pii-types';
import { compileRegex, isValidPiiPattern } from './pii-validation';

/**
 * Applies a single compiled pattern to a string
 * @param str - Input string
 * @param compiled - Compiled regex pattern
 * @param replacement - Replacement token
 * @returns Sanitized string
 */
export function applyPattern(str: string, compiled: RegExp, replacement: string): string {
  try {
    // Create regex with global flag to replace all occurrences, not just first
    const globalRegex = new RegExp(
      compiled.source,
      compiled.flags.includes('g') ? compiled.flags : compiled.flags + 'g'
    );
    return str.replace(globalRegex, replacement);
  } catch (error) {
    console.warn(
      `[PII] Failed to apply pattern: ${error instanceof Error ? error.message : String(error)}`
    );
    return str;
  }
}

/**
 * Applies multiple patterns to a string in sequence
 * @param str - Input string
 * @param patterns - Array of PiiPattern objects
 * @returns Sanitized string (all valid patterns applied)
 */
export function applyPatterns(str: string, patterns: PiiPattern[]): string {
  if (typeof str !== 'string') {
    return str;
  }

  if (!Array.isArray(patterns) || patterns.length === 0) {
    return str;
  }

  let result = str;

  for (const pattern of patterns) {
    // Validate pattern before use
    const validation = isValidPiiPattern(pattern);
    if (!validation.isValid) {
      console.warn(`[PII] Skipping invalid pattern: ${validation.error}`);
      continue;
    }

    // Compile regex
    const compiled = compileRegex(pattern.pattern);
    if (!compiled) {
      continue;
    }

    // Apply pattern
    result = applyPattern(result, compiled, pattern.replacement);
  }

  return result;
}
