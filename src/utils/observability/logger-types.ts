/**
 * Type definitions for the Logger utility.
 *
 * Provides comprehensive logging with PII sanitization, environment-specific output,
 * and correlation ID tracking across distributed systems.
 */

import type { PiiPattern } from '../pii-types';

/**
 * Supported log levels with production-specific behavior.
 *
 * - DEBUG: Verbose diagnostic info (disabled in production)
 * - INFO: Normal operational events
 * - WARN: Recoverable errors, deprecated usage, performance issues
 * - ERROR: Unhandled exceptions, failed operations, data inconsistencies
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured log entry output to console/stdout.
 *
 * All string fields (message, context values, stack traces) are sanitized
 * to remove PII patterns before logging.
 *
 * @example
 * ```typescript
 * const entry: LogEntry = {
 *   timestamp: "2026-02-10T14:23:45.123Z",
 *   level: "ERROR",
 *   correlationId: "550e8400-e29b-41d4-a716-446655440000",
 *   userId: "user_01HQ...",
 *   workspaceId: "ws_01HQ...",
 *   service: "platform-shell",
 *   message: "Failed to publish [REDACTED-EMAIL]",
 *   stackTrace: "Error: Validation failed...",
 *   context: { draftId: "draft_123", platform: "instagram" }
 * };
 * ```
 */
export interface LogEntry {
  /** ISO 8601 timestamp in UTC (e.g., "2026-02-10T14:23:45.123Z") */
  timestamp: string;

  /** Log level (debug, info, warn, error) */
  level: LogLevel;

  /** UUID v4 correlation ID for distributed tracing (optional if not set) */
  correlationId?: string;

  /** Authenticated user ID (optional, from context parameter) */
  userId?: string;

  /** Workspace context (optional, from context parameter) */
  workspaceId?: string;

  /** Service name identifying the origin of the log (set at initialization) */
  service: string;

  /** Human-readable log message with PII sanitized */
  message: string;

  /** Full stack trace for ERROR level (set from Error object passed to error()) */
  stackTrace?: string;

  /** Additional structured data (PII-scrubbed via scrubObject) */
  context?: Record<string, any>;
}

/**
 * Logger initialization configuration.
 *
 * Accepts PII patterns either directly or via fetch from a BFF endpoint.
 * Provides fallback behavior if fetch fails.
 *
 * @example
 * ```typescript
 * Logger.initialize({
 *   serviceName: 'platform-shell',
 *   patterns: [
 *     { name: 'email', pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}', replacement: '[REDACTED-EMAIL]' },
 *   ],
 *   piiPatternsUrl: 'https://bff.example.com/api/observability/pii-patterns',
 *   piiPatternsFetchTimeoutMs: 5000,
 * });
 * ```
 */
export interface LoggerConfig {
  /** Service name included in all log entries for identification */
  serviceName: string;

  /** PII patterns array (optional; used as fallback if fetch fails) */
  patterns?: PiiPattern[];

  /** BFF endpoint URL to fetch PII patterns from (optional) */
  piiPatternsUrl?: string;

  /** Timeout in milliseconds for pattern fetch (default: 5000) */
  piiPatternsFetchTimeoutMs?: number;
}

/**
 * Log context object with optional distributed tracing and workspace scope.
 *
 * All values (including nested) are sanitized for PII before logging.
 *
 * @example
 * ```typescript
 * Logger.error('Failed to publish', {
 *   userId: 'user_01HQ...',
 *   workspaceId: 'ws_01HQ...',
 *   draftId: 'draft_123',
 *   platform: 'instagram',
 *   attemptCount: 3,
 *   error: 'Network timeout'
 * });
 * ```
 */
export interface LogContext {
  /** Authenticated user ID (copied to LogEntry.userId) */
  userId?: string;

  /** Workspace ID (copied to LogEntry.workspaceId) */
  workspaceId?: string;

  /** Additional arbitrary context fields (all PII-scrubbed) */
  [key: string]: any;
}
