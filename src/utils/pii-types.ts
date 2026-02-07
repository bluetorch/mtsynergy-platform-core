/**
 * Type definitions for PII (Personally Identifiable Information) sanitization module.
 */

/**
 * Supported PII pattern types
 */
export type PiiPatternName =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'token'
  | 'api_key'
  | 'password'
  | 'jwt'
  | 'custom'

/**
 * Represents a PII pattern for regex-based sanitization
 */
export interface PiiPattern {
  /** Type of PII being matched (for logging and categorization) */
  name: PiiPatternName
  /** Regex string (not compiled) for pattern matching */
  pattern: string
  /** Replacement token to use when pattern is matched */
  replacement: string
}

/**
 * Options for scrubObject function behavior
 */
export interface ScrubOptions {
  /** Maximum recursion depth to prevent stack overflow (default: 50) */
  maxDepth?: number
  /** Internal: tracks visited objects to detect circular references */
  visited?: WeakSet<any>
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean
  /** Error message if validation failed */
  error?: string
}
