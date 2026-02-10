/**
 * Logger utility with automatic PII sanitization and environment-specific output.
 *
 * Provides a singleton Logger class that automatically:
 * - Scrubs PII (emails, tokens, identifiers) from logs
 * - Manages correlation IDs for distributed tracing
 * - Routes output to console (browser), stdout (Node.js), or native logger (mobile)
 * - Disables DEBUG level in production
 *
 * @example
 * ```typescript
 * // Initialize once at app startup
 * Logger.initialize({
 *   serviceName: 'platform-shell',
 *   patterns: [
 *     { name: 'email', pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}', replacement: '[REDACTED-EMAIL]' },
 *   ],
 * });
 *
 * // Set correlation ID for request tracking
 * Logger.setCorrelationId('550e8400-e29b-41d4-a716-446655440000');
 *
 * // Use throughout application
 * Logger.info('Publishing draft', { draftId: 'draft_123' });
 * Logger.error('Failed to connect', { service: 'twitter-api' }, error);
 * ```
 *
 * @packageDocumentation
 */

import type { PiiPattern } from '../pii-types';
import { scrubObject } from '../pii-sanitizers';
import type { LogEntry, LogLevel, LoggerConfig, LogContext } from './logger-types';

// Type definition for AsyncLocalStorage (imported conditionally in Node)
type IAsyncLocalStorage = {
  getStore: () => string | undefined;
  enterWith: (value: string | undefined) => void;
} | null;

/**
 * Detects the runtime environment
 */
type Platform = 'browser' | 'node' | 'react-native';

interface LoggerState {
  initialized: boolean;
  serviceName: string;
  patterns: PiiPattern[];
  platform: Platform;
  isProduction: boolean;
}

/**
 * Logger singleton class with static methods.
 *
 * Must call initialize() before first use. Logs to console.log across all platforms
 * (which routes to browser console, stdout in Node, and native logger in mobile).
 */
export class Logger {
  private static state: LoggerState = {
    initialized: false,
    serviceName: '',
    patterns: [],
    platform: Logger.detectPlatform(),
    isProduction: Logger.isProductionEnvironment(),
  };

  // Correlation ID storage per platform
  private static asyncLocalStorage: IAsyncLocalStorage = Logger.initializeAsyncLocalStorage();
  private static browserCorrelationId?: string;
  private static mobileCorrelationId?: string;

  /**
   * Initializes AsyncLocalStorage if in Node.js environment
   */
  private static initializeAsyncLocalStorage(): IAsyncLocalStorage {
    try {
      if (typeof process !== 'undefined' && process.versions?.node) {
        // Dynamic require for Node.js only (to avoid Vite browser build errors)
        // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
        const { AsyncLocalStorage }: any = require('async_hooks');
        return new AsyncLocalStorage();
      }
    } catch (err) {
      // Not in Node.js or async_hooks not available
    }
    return null;
  }

  /**
   * Initializes the Logger singleton with service name and PII patterns.
   *
   * @param config Configuration object with serviceName and optional patterns/piiPatternsUrl
   *
   * @example
   * ```typescript
   * Logger.initialize({
   *   serviceName: 'platform-shell',
   *   patterns: [{
   *     name: 'email',
   *     pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
   *     replacement: '[REDACTED-EMAIL]'
   *   }],
   * });
   * ```
   */
  public static initialize(config: LoggerConfig): void {
    if (this.state.initialized) {
      console.warn('[Logger] Already initialized; skipping');
      return;
    }

    this.state.serviceName = config.serviceName;
    this.state.platform = this.detectPlatform();
    this.state.isProduction = this.isProductionEnvironment();

    // Start patterns with provided array (if any)
    this.state.patterns = config.patterns ?? [];

    // Try to fetch patterns from endpoint with fallback
    if (config.piiPatternsUrl) {
      this.fetchPiiPatterns(config.piiPatternsUrl, config.piiPatternsFetchTimeoutMs)
        .then((remotePatterns) => {
          if (remotePatterns && remotePatterns.length > 0) {
            this.state.patterns = remotePatterns;
          }
        })
        .catch((err) => {
          console.warn(`[Logger] Failed to fetch PII patterns from ${config.piiPatternsUrl}:`, err);
          // Fallback to provided patterns already set above
        });
    }

    this.state.initialized = true;
  }

  /**
   * Sets the correlation ID for the current request/context.
   *
   * @param id UUID v4 correlation ID for distributed tracing
   *
   * @example
   * ```typescript
   * Logger.setCorrelationId('550e8400-e29b-41d4-a716-446655440000');
   * ```
   */
  public static setCorrelationId(id: string): void {
    if (this.state.platform === 'node') {
      // Node.js: use AsyncLocalStorage for context isolation
      if (this.asyncLocalStorage) {
        this.asyncLocalStorage.enterWith(id);
      }
    } else if (this.state.platform === 'browser') {
      // Browser: use sessionStorage
      try {
        sessionStorage.setItem('__mtsyn_corr_id', id);
      } catch (err) {
        console.warn('[Logger] Failed to store correlation ID in sessionStorage:', err);
      }
    } else if (this.state.platform === 'react-native') {
      // React Native: use module-level variable
      this.mobileCorrelationId = id;
    }
  }

  /**
   * Retrieves the current correlation ID.
   *
   * @returns UUID v4 correlation ID if set, undefined otherwise
   *
   * @example
   * ```typescript
   * const id = Logger.getCorrelationId();
   * ```
   */
  public static getCorrelationId(): string | undefined {
    if (this.state.platform === 'node') {
      return this.asyncLocalStorage ? this.asyncLocalStorage.getStore() : undefined;
    } else if (this.state.platform === 'browser') {
      try {
        return sessionStorage.getItem('__mtsyn_corr_id') ?? undefined;
      } catch (err) {
        console.warn('[Logger] Failed to retrieve correlation ID from sessionStorage:', err);
        return undefined;
      }
    } else if (this.state.platform === 'react-native') {
      return this.mobileCorrelationId;
    }
    return undefined;
  }

  /**
   * Logs a debug message (disabled in production).
   *
   * @param message Human-readable message (will be PII-scrubbed)
   * @param context Optional additional context (will be PII-scrubbed)
   *
   * @example
   * ```typescript
   * Logger.debug('Processing draft', { draftId: 'draft_123' });
   * ```
   */
  public static debug(message: string, context?: LogContext): void {
    // Skip in production
    if (this.state.isProduction) {
      return;
    }

    this.log('debug', message, context);
  }

  /**
   * Logs an info message.
   *
   * @param message Human-readable message (will be PII-scrubbed)
   * @param context Optional additional context (will be PII-scrubbed)
   *
   * @example
   * ```typescript
   * Logger.info('Draft published', { draftId: 'draft_123' });
   * ```
   */
  public static info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Logs a warning message.
   *
   * @param message Human-readable message (will be PII-scrubbed)
   * @param context Optional additional context (will be PII-scrubbed)
   *
   * @example
   * ```typescript
   * Logger.warn('Slow API response', { latency: 5000 });
   * ```
   */
  public static warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Logs an error message with optional Error object for stack trace.
   *
   * @param message Human-readable message (will be PII-scrubbed)
   * @param context Optional additional context (will be PII-scrubbed)
   * @param error Optional Error object for stack trace capture
   *
   * @example
   * ```typescript
   * try {
   *   await publishPost(draft);
   * } catch (error) {
   *   Logger.error('Publish failed', { draftId }, error as Error);
   * }
   * ```
   */
  public static error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  /**
   * Resets Logger state (for testing).
   *
   * @internal
   */
  public static reset(): void {
    this.state = {
      initialized: false,
      serviceName: '',
      patterns: [],
      platform: this.detectPlatform(),
      isProduction: this.isProductionEnvironment(),
    };
    this.browserCorrelationId = undefined;
    this.mobileCorrelationId = undefined;

    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('__mtsyn_corr_id');
      } catch (err) {
        // Ignore
      }
    }

    // Clear AsyncLocalStorage by entering with undefined
    if (this.asyncLocalStorage) {
      this.asyncLocalStorage.enterWith(undefined);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Detects the runtime environment
   */
  private static detectPlatform(): Platform {
    // Check React Native first (may have window object)
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      return 'react-native';
    }
    // Check Node.js
    if (typeof process !== 'undefined' && process.versions?.node) {
      return 'node';
    }
    // Check Browser
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return 'browser';
    }
    // Safe default
    return 'node';
  }

  /**
   * Determines if running in production
   */
  private static isProductionEnvironment(): boolean {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'production';
    }
    return false;
  }

  /**
   * Core logging implementation
   */
  private static log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.state.initialized) {
      console.warn('[Logger] Not initialized; call Logger.initialize() first');
      return;
    }

    const entry = this.createLogEntry(level, message, context, error);
    console.log(JSON.stringify(entry));
  }

  /**
   * Creates a structured LogEntry with PII scrubbing
   */
  private static createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    // Scrub message for PII
    const scrubbedMessage = this.scrubMessageForPii(message);

    // Scrub context object
    let scrubbedContext: Record<string, any> | undefined;
    if (context) {
      // Extract userId/workspaceId before scrubbing
      const userId = context.userId;
      const workspaceId = context.workspaceId;

      // Remove special fields before scrubbing arbitrary data
      const contextCopy = { ...context };
      delete contextCopy.userId;
      delete contextCopy.workspaceId;

      // Scrub remaining fields
      scrubbedContext =
        Object.keys(contextCopy).length > 0 ? this.scrubContextForPii(contextCopy) : undefined;

      return {
        timestamp: new Date().toISOString(),
        level,
        correlationId: this.getCorrelationId(),
        userId,
        workspaceId,
        service: this.state.serviceName,
        message: scrubbedMessage,
        stackTrace: level === 'error' && error ? error.stack : undefined,
        context: scrubbedContext,
      };
    }

    return {
      timestamp: new Date().toISOString(),
      level,
      correlationId: this.getCorrelationId(),
      service: this.state.serviceName,
      message: scrubbedMessage,
      stackTrace: level === 'error' && error ? error.stack : undefined,
    };
  }

  /**
   * Scrubs string message for PII patterns
   */
  private static scrubMessageForPii(message: string): string {
    let scrubbed = message;

    // Apply each pattern to the message
    for (const pattern of this.state.patterns) {
      try {
        const regex = new RegExp(pattern.pattern, 'g');
        scrubbed = scrubbed.replace(regex, pattern.replacement);
      } catch (err) {
        console.warn(`[Logger] Failed to apply pattern ${pattern.name}:`, err);
      }
    }

    return scrubbed;
  }

  /**
   * Scrubs context object for PII via scrubObject
   */
  private static scrubContextForPii(context: Record<string, any>): Record<string, any> {
    if (this.state.patterns.length === 0) {
      return context;
    }

    try {
      return scrubObject(context, this.state.patterns);
    } catch (err) {
      console.warn('[Logger] Failed to scrub context object:', err);
      return context;
    }
  }

  /**
   * Fetches PII patterns from remote endpoint with timeout
   */
  private static async fetchPiiPatterns(
    url: string,
    timeoutMs: number = 5000
  ): Promise<PiiPattern[] | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Validate that data is an array of PiiPattern
      if (Array.isArray(data) && data.every((p) => p.name && p.pattern && p.replacement)) {
        return data as PiiPattern[];
      }

      throw new Error('Invalid pattern format from endpoint');
    } catch (err) {
      console.warn(
        `[Logger] Pattern fetch failed (${err instanceof Error ? err.message : String(err)})`
      );
      return null;
    }
  }
}
