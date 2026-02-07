/**
 * Internal validation utilities for PII patterns.
 * Validates pattern objects and regex strings with lightweight, zero-dependency approach.
 */

import type { PiiPattern, ValidationResult } from './pii-types'

/**
 * Validates that a pattern object is properly formatted
 * @param pattern - Pattern to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function isValidPiiPattern(pattern: any): ValidationResult {
  // Check if pattern is an object
  if (!pattern || typeof pattern !== 'object') {
    return { isValid: false, error: 'Pattern must be an object' }
  }

  // Check required fields exist
  if (typeof pattern.name !== 'string' || !pattern.name) {
    return { isValid: false, error: 'Pattern must have a valid name field' }
  }

  if (typeof pattern.pattern !== 'string' || !pattern.pattern) {
    return { isValid: false, error: 'Pattern must have a valid pattern field' }
  }

  if (typeof pattern.replacement !== 'string' || !pattern.replacement) {
    return { isValid: false, error: 'Pattern must have a valid replacement field' }
  }

  // Validate the regex string
  const regexResult = isValidRegexString(pattern.pattern)
  if (!regexResult.isValid) {
    return { isValid: false, error: `Invalid regex pattern: ${regexResult.error}` }
  }

  return { isValid: true }
}

/**
 * Validates that a regex string can be compiled
 * @param regexString - Regex string to test (e.g., "^[\\w+.-]+@[\\w-]+\\.[a-z]{2,}$")
 * @returns ValidationResult with isValid flag and optional error message
 */
export function isValidRegexString(regexString: string): ValidationResult {
  if (typeof regexString !== 'string' || !regexString) {
    return { isValid: false, error: 'Regex string must be a non-empty string' }
  }

  try {
    // Attempt to compile the regex
    new RegExp(regexString)
    return { isValid: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { isValid: false, error: `Regex compilation failed: ${message}` }
  }
}

/**
 * Validates an array of patterns
 * @param patterns - Array of patterns to validate
 * @returns ValidationResult; isValid=true only if all patterns valid
 */
export function validatePatterns(patterns: PiiPattern[]): ValidationResult {
  if (!Array.isArray(patterns)) {
    return { isValid: false, error: 'Patterns must be an array' }
  }

  for (let i = 0; i < patterns.length; i++) {
    const result = isValidPiiPattern(patterns[i])
    if (!result.isValid) {
      return {
        isValid: false,
        error: `Pattern at index ${i} is invalid: ${result.error}`,
      }
    }
  }

  return { isValid: true }
}

/**
 * Compiles a regex string into RegExp object with error handling
 * @param regexString - Regex string
 * @returns Compiled RegExp or null if invalid
 * @note Used internally; warns on invalid regex
 */
export function compileRegex(regexString: string): RegExp | null {
  try {
    return new RegExp(regexString)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[PII] Failed to compile regex: ${message}`)
    return null
  }
}
