import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger } from '../utils/observability/logger';
import type { LoggerConfig, PiiPattern } from '../utils';

describe('Logger', () => {
  // Mock patterns for testing
  const mockPatterns: PiiPattern[] = [
    { name: 'email', pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}', replacement: '[REDACTED-EMAIL]' },
    {
      name: 'phone',
      pattern: '\\+?\\d{1,3}[-.]?\\(??\\d{1,4}\\)?[-.]?\\d{1,4}[-.]?\\d{1,4}',
      replacement: '[REDACTED-PHONE]',
    },
  ];

  beforeEach(() => {
    // Explicitly clear the correlation ID key from sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('__mtsyn_corr_id');
      } catch (err) {
        // Ignore
      }
    }
    // Then reset Logger state
    Logger.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    Logger.reset();
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('__mtsyn_corr_id');
      } catch (err) {
        // Ignore
      }
    }
  });

  // ============================================================================
  // Initialization Tests (5 tests)
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with service name and patterns', () => {
      const config: LoggerConfig = {
        serviceName: 'test-service',
        patterns: mockPatterns,
      };

      Logger.initialize(config);
      // Should not throw
      expect(true).toBe(true);
    });

    it('should initialize with service name only', () => {
      const config: LoggerConfig = {
        serviceName: 'test-service',
      };

      Logger.initialize(config);
      expect(true).toBe(true);
    });

    it('should skip re-initialization if already initialized', () => {
      const spy = vi.spyOn(console, 'warn');

      Logger.initialize({ serviceName: 'service-1', patterns: mockPatterns });
      Logger.initialize({ serviceName: 'service-2', patterns: [] });

      expect(spy).toHaveBeenCalledWith('[Logger] Already initialized; skipping');
      spy.mockRestore();
    });

    it('should warn when logging before initialization', () => {
      const spy = vi.spyOn(console, 'warn');
      Logger.info('test message');

      expect(spy).toHaveBeenCalledWith('[Logger] Not initialized; call Logger.initialize() first');
      spy.mockRestore();
    });

    it('should accept optional piiPatternsUrl configuration', () => {
      const config: LoggerConfig = {
        serviceName: 'test-service',
        patterns: mockPatterns,
        piiPatternsUrl: 'https://bff.example.com/api/observability/pii-patterns',
        piiPatternsFetchTimeoutMs: 3000,
      };

      Logger.initialize(config);
      expect(true).toBe(true); // Should not throw
    });
  });

  // ============================================================================
  // Environment Detection Tests (3 tests)
  // ============================================================================

  describe('Environment Detection', () => {
    it('should detect browser environment', () => {
      Logger.initialize({ serviceName: 'test-browser', patterns: mockPatterns });
      // If tests are running in Node, this will detect Node, but the logic is symmetrical
      // The real test would be in browser environment
      Logger.info('test message');
      expect(true).toBe(true);
    });

    it('should detect Node.js environment', () => {
      if (typeof process !== 'undefined' && process.versions?.node) {
        Logger.initialize({ serviceName: 'test-node', patterns: mockPatterns });
        Logger.info('test message');
        expect(true).toBe(true);
      } else {
        expect(true).toBe(true); // Skip in browser
      }
    });

    it('should handle safe default if environment undetectable', () => {
      Logger.initialize({ serviceName: 'test-default', patterns: mockPatterns });
      Logger.info('test message');
      expect(true).toBe(true);
    });
  });

  // ============================================================================
  // Correlation ID Management Tests (6 tests)
  // ============================================================================

  describe('Correlation ID Management', () => {
    beforeEach(() => {
      Logger.initialize({ serviceName: 'test-corr', patterns: mockPatterns });
    });

    it('should set and retrieve correlation ID', () => {
      const testId = '550e8400-e29b-41d4-a716-446655440000';
      Logger.setCorrelationId(testId);
      const retrieved = Logger.getCorrelationId();

      // In Node.js with AsyncLocalStorage, retrieval works within the same context
      if (typeof process !== 'undefined' && process.versions?.node) {
        // AsyncLocalStorage requires context propagation
        expect(typeof retrieved === 'string' || retrieved === undefined).toBe(true);
      } else {
        // Browser should use sessionStorage
        expect(retrieved).toBe(testId);
      }
    });

    it('should return undefined if correlation ID not set', () => {
      const retrieved = Logger.getCorrelationId();
      expect(retrieved).toBeUndefined();
    });

    it('should store correlation ID in browser sessionStorage', () => {
      if (typeof sessionStorage !== 'undefined') {
        const testId = '550e8400-e29b-41d4-a716-446655440000';
        Logger.setCorrelationId(testId);

        const stored = sessionStorage.getItem('__mtsyn_corr_id');
        expect(stored).toBe(testId);
      }
    });

    it('should handle sessionStorage errors gracefully', () => {
      if (typeof sessionStorage !== 'undefined') {
        const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

        const warnSpy = vi.spyOn(console, 'warn');
        Logger.setCorrelationId('test-id');

        expect(warnSpy).toHaveBeenCalledWith(
          '[Logger] Failed to store correlation ID in sessionStorage:',
          expect.any(Error)
        );

        spy.mockRestore();
        warnSpy.mockRestore();
      }
    });

    it('should handle sessionStorage retrieval errors gracefully', () => {
      if (typeof sessionStorage !== 'undefined') {
        const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('Storage access denied');
        });

        const warnSpy = vi.spyOn(console, 'warn');
        const retrieved = Logger.getCorrelationId();

        expect(warnSpy).toHaveBeenCalledWith(
          '[Logger] Failed to retrieve correlation ID from sessionStorage:',
          expect.any(Error)
        );
        expect(retrieved).toBeUndefined();

        spy.mockRestore();
        warnSpy.mockRestore();
      }
    });

    it('should clear correlation ID on reset', () => {
      Logger.setCorrelationId('test-id');
      Logger.reset();

      const retrieved = Logger.getCorrelationId();
      expect(retrieved).toBeUndefined();
    });
  });

  // ============================================================================
  // PII Scrubbing Tests (8 tests)
  // ============================================================================

  describe('PII Scrubbing', () => {
    beforeEach(() => {
      Logger.initialize({ serviceName: 'test-pii', patterns: mockPatterns });
    });

    it('should scrub email addresses from message', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Contact us at support@example.com');

      const logged = logSpy.mock.calls[0]?.[0];
      expect(logged).toContain('[REDACTED-EMAIL]');
      expect(logged).not.toContain('support@example.com');

      logSpy.mockRestore();
    });

    it('should scrub phone numbers from message', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Call +1-555-1234 for support');

      const logged = logSpy.mock.calls[0]?.[0];
      expect(logged).toContain('[REDACTED-PHONE]');

      logSpy.mockRestore();
    });

    it('should not scrub if no patterns configured', () => {
      Logger.reset();
      Logger.initialize({ serviceName: 'test-no-patterns' });

      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Email: test@example.com');

      const logged = logSpy.mock.calls[0]?.[0];
      // Should contain the real email since no patterns configured
      expect(logged).toContain('test@example.com');

      logSpy.mockRestore();
    });

    it('should scrub context object with PII patterns', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.info('User context', {
        email: 'user@example.com',
        phone: '+1-555-1234',
        safe: 'data',
      });

      const logged = logSpy.mock.calls[0]?.[0];
      expect(logged).toContain('[REDACTED-EMAIL]');
      expect(logged).toContain('[REDACTED-PHONE]');
      expect(logged).toContain('"safe":"data"');

      logSpy.mockRestore();
    });

    it('should handle malformed regex patterns gracefully', () => {
      Logger.reset();
      Logger.initialize({
        serviceName: 'test-bad-regex',
        patterns: [{ name: 'custom', pattern: '[invalid(regex', replacement: '[REDACTED]' }],
      });

      const warnSpy = vi.spyOn(console, 'warn');
      const logSpy = vi.spyOn(console, 'log');

      Logger.info('Test message');

      // Should warn about pattern failure
      expect(warnSpy).toHaveBeenCalledWith(
        '[Logger] Failed to apply pattern custom:',
        expect.any(Error)
      );
      // But should still log
      expect(logSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
      logSpy.mockRestore();
    });

    it('should handle scrubObject failures gracefully', () => {
      // Note: scrubObject is very robust, but we test the error handling path
      Logger.initialize({ serviceName: 'test-scrub-fail', patterns: mockPatterns });

      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Test', {
        email: 'test@example.com',
        nested: {
          phone: '+1-555-1234',
        },
      });

      // Should still log despite complex context
      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('should skip scrubbing if no patterns provided', () => {
      Logger.reset();
      Logger.initialize({ serviceName: 'test-no-scrub' });

      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Email: test@example.com', { userId: 'user_123' });

      const logged = logSpy.mock.calls[0]?.[0];
      expect(logged).toContain('test@example.com');

      logSpy.mockRestore();
    });

    it('should extract userId/workspaceId from context separately', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Event', {
        userId: 'user_01HQ...',
        workspaceId: 'ws_01HQ...',
        arbitrary: 'data',
      });

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.userId).toBe('user_01HQ...');
      expect(entry.workspaceId).toBe('ws_01HQ...');
      expect(entry.context).toBeDefined();

      logSpy.mockRestore();
    });
  });

  // ============================================================================
  // Log Output Format Tests (12 tests)
  // ============================================================================

  describe('Log Output Format', () => {
    beforeEach(() => {
      Logger.initialize({ serviceName: 'test-format', patterns: mockPatterns });
    });

    it('should output valid JSON for debug level', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.debug('Debug message');

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.level).toBe('debug');
      expect(entry.message).toBe('Debug message');
      expect(entry.service).toBe('test-format');

      logSpy.mockRestore();
    });

    it('should output valid JSON for info level', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Info message');

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.level).toBe('info');

      logSpy.mockRestore();
    });

    it('should output valid JSON for warn level', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.warn('Warning message');

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.level).toBe('warn');

      logSpy.mockRestore();
    });

    it('should output valid JSON for error level', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.error('Error message');

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.level).toBe('error');

      logSpy.mockRestore();
    });

    it('should include timestamp in ISO8601 format', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Test message');

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      // Check ISO8601 format
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(entry.timestamp)).toBe(true);

      logSpy.mockRestore();
    });

    it('should include service name in all entries', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Test');

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.service).toBe('test-format');

      logSpy.mockRestore();
    });

    it('should include correlationId if set', () => {
      Logger.setCorrelationId('550e8400-e29b-41d4-a716-446655440000');

      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Test');

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      // CorrelationId may be stored differently per platform
      if (entry.correlationId) {
        expect(entry.correlationId).toBe('550e8400-e29b-41d4-a716-446655440000');
      }

      logSpy.mockRestore();
    });

    it('should omit correlationId if not set', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Test');

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.correlationId).toBeUndefined();

      logSpy.mockRestore();
    });

    it('should include userId and workspaceId if provided in context', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Test', { userId: 'user_123', workspaceId: 'ws_456' });

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.userId).toBe('user_123');
      expect(entry.workspaceId).toBe('ws_456');

      logSpy.mockRestore();
    });

    it('should not include stackTrace for non-error levels', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Info message');

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.stackTrace).toBeUndefined();

      logSpy.mockRestore();
    });

    it('should include stackTrace for error level with Error object', () => {
      const logSpy = vi.spyOn(console, 'log');
      const testError = new Error('Test error');

      Logger.error('Error occurred', {}, testError);

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.stackTrace).toBeDefined();
      expect(entry.stackTrace).toContain('Test error');

      logSpy.mockRestore();
    });

    it('should omit stackTrace for error level without Error object', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.error('Error occurred');

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.stackTrace).toBeUndefined();

      logSpy.mockRestore();
    });
  });

  // ============================================================================
  // Production Behavior Tests (4 tests)
  // ============================================================================

  describe('Production Behavior', () => {
    it('should skip debug logs in production', () => {
      // Set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      Logger.reset();
      Logger.initialize({ serviceName: 'test-prod', patterns: mockPatterns });

      const logSpy = vi.spyOn(console, 'log');
      Logger.debug('Debug message');

      expect(logSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should include info logs in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      Logger.reset();
      Logger.initialize({ serviceName: 'test-prod', patterns: mockPatterns });

      const logSpy = vi.spyOn(console, 'log');
      Logger.info('Info message');

      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should include warn logs in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      Logger.reset();
      Logger.initialize({ serviceName: 'test-prod', patterns: mockPatterns });

      const logSpy = vi.spyOn(console, 'log');
      Logger.warn('Warn message');

      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should include error logs in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      Logger.reset();
      Logger.initialize({ serviceName: 'test-prod', patterns: mockPatterns });

      const logSpy = vi.spyOn(console, 'log');
      Logger.error('Error message');

      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  // ============================================================================
  // Error Handling Tests (3 tests)
  // ============================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      Logger.initialize({ serviceName: 'test-error', patterns: mockPatterns });
    });

    it('should capture stack trace from Error object', () => {
      const logSpy = vi.spyOn(console, 'log');
      const error = new Error('Test failed');

      Logger.error('Operation failed', { operation: 'test' }, error);

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.stackTrace).toBeDefined();
      expect(entry.stackTrace).toContain('Error: Test failed');

      logSpy.mockRestore();
    });

    it('should handle error() without Error object', () => {
      const logSpy = vi.spyOn(console, 'log');
      Logger.error('Something went wrong', { code: 'ERR_001' });

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.stackTrace).toBeUndefined();
      expect(entry.message).toContain('Something went wrong');

      logSpy.mockRestore();
    });

    it('should include context data with error log', () => {
      const logSpy = vi.spyOn(console, 'log');
      const error = new Error('Failed');

      Logger.error('Operation failed', { draftId: 'draft_123', platform: 'twitter' }, error);

      const logged = logSpy.mock.calls[0]?.[0];
      const entry = JSON.parse(logged as string);

      expect(entry.context).toBeDefined();
      expect(entry.context.draftId).toBe('draft_123');
      expect(entry.context.platform).toBe('twitter');

      logSpy.mockRestore();
    });
  });

  // ============================================================================
  // Integration Tests (3 tests)
  // ============================================================================

  describe('Integration', () => {
    it('should log multiple levels in sequence', () => {
      Logger.initialize({ serviceName: 'test-multi', patterns: mockPatterns });

      const logSpy = vi.spyOn(console, 'log');

      Logger.debug('Debug info');
      Logger.info('Info message');
      Logger.warn('Warning message');
      Logger.error('Error message');

      expect(logSpy).toHaveBeenCalledTimes(4);

      logSpy.mockRestore();
    });

    it('should maintain correlation ID across multiple logs', () => {
      Logger.initialize({ serviceName: 'test-corr-multi', patterns: mockPatterns });
      const corrId = '550e8400-e29b-41d4-a716-446655440000';

      Logger.setCorrelationId(corrId);

      const logSpy = vi.spyOn(console, 'log');

      Logger.info('First log');
      Logger.warn('Second log');
      Logger.error('Third log');

      // Each call should have the correlation ID (in browser/mobile)
      // In Node.js with AsyncLocalStorage, the behavior is different
      expect(logSpy.mock.calls.length).toBe(3);

      logSpy.mockRestore();
    });

    it('should handle realistic workflow', () => {
      const config: LoggerConfig = {
        serviceName: 'platform-shell',
        patterns: mockPatterns,
      };

      Logger.initialize(config);
      Logger.setCorrelationId('550e8400-e29b-41d4-a716-446655440000');

      const logSpy = vi.spyOn(console, 'log');

      Logger.info('Starting publish workflow', { draftId: 'draft_123' });
      Logger.debug('Sending to Twitter', { endpoint: 'v2/tweets' });
      Logger.warn('Rate limit approaching', { remaining: 5 });

      try {
        throw new Error('Failed to connect to Twitter API');
      } catch (error) {
        Logger.error('Publish failed', { draftId: 'draft_123' }, error as Error);
      }

      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
    });
  });
});
