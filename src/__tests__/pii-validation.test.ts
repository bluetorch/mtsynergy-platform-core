import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isValidPiiPattern,
  isValidRegexString,
  validatePatterns,
  compileRegex,
} from '../utils/pii-validation';
import type { PiiPattern } from '../utils/pii-types';

describe('PII Validation Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isValidPiiPattern', () => {
    it('should validate a correct pattern object', () => {
      const pattern: PiiPattern = {
        name: 'email',
        pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
        replacement: '[REDACTED-EMAIL]',
      };
      const result = isValidPiiPattern(pattern);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-object input', () => {
      const result = isValidPiiPattern('not an object');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    it('should reject pattern missing name field', () => {
      const pattern = {
        pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
        replacement: '[REDACTED-EMAIL]',
      };
      const result = isValidPiiPattern(pattern);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('name field');
    });

    it('should reject pattern missing pattern field', () => {
      const pattern = {
        name: 'email',
        replacement: '[REDACTED-EMAIL]',
      };
      const result = isValidPiiPattern(pattern);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('pattern field');
    });

    it('should reject pattern missing replacement field', () => {
      const pattern = {
        name: 'email',
        pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
      };
      const result = isValidPiiPattern(pattern);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('replacement field');
    });

    it('should reject pattern with invalid regex string', () => {
      const pattern = {
        name: 'email',
        pattern: '[invalid{regex',
        replacement: '[REDACTED-EMAIL]',
      };
      const result = isValidPiiPattern(pattern);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid regex');
    });

    it('should reject pattern with empty string fields', () => {
      const pattern = {
        name: '',
        pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
        replacement: '[REDACTED-EMAIL]',
      };
      const result = isValidPiiPattern(pattern);
      expect(result.isValid).toBe(false);
    });

    it('should reject pattern with non-string fields', () => {
      const pattern = {
        name: 'email',
        pattern: 123,
        replacement: '[REDACTED-EMAIL]',
      };
      const result = isValidPiiPattern(pattern);
      expect(result.isValid).toBe(false);
    });
  });

  describe('isValidRegexString', () => {
    it('should validate a simple regex string', () => {
      const result = isValidRegexString('[\\w+.-]+@[\\w.-]+\\.\\w{2,}');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate complex regex with groups', () => {
      const result = isValidRegexString('(\\w+)@(\\w+)\\.(\\w+)');
      expect(result.isValid).toBe(true);
    });

    it('should validate regex with flags', () => {
      const result = isValidRegexString('^test$');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid regex (unmatched bracket)', () => {
      const result = isValidRegexString('[invalid{regex');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('compilation failed');
    });

    it('should reject invalid regex (bad escape)', () => {
      const result = isValidRegexString('(?P<invalid)group');
      expect(result.isValid).toBe(false);
    });

    it('should reject empty regex string', () => {
      const result = isValidRegexString('');
      expect(result.isValid).toBe(false);
    });

    it('should validate regex with special characters', () => {
      const result = isValidRegexString('[-+*/=!<>]');
      expect(result.isValid).toBe(true);
    });

    it('should validate regex with lookahead/lookbehind', () => {
      const result = isValidRegexString('(?=.*\\d)(?=.*[a-z]).*');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePatterns', () => {
    it('should validate array of valid patterns', () => {
      const patterns: PiiPattern[] = [
        {
          name: 'email',
          pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
          replacement: '[REDACTED-EMAIL]',
        },
        {
          name: 'phone',
          pattern: '(?:\\+\\d{1,3})?[\\s.-]?\\d{2,4}[\\s.-]?\\d{2,4}',
          replacement: '[REDACTED-PHONE]',
        },
      ];
      const result = validatePatterns(patterns);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate empty array', () => {
      const result = validatePatterns([]);
      expect(result.isValid).toBe(true);
    });

    it('should reject non-array input', () => {
      const result = validatePatterns('not an array' as any);
      expect(result.isValid).toBe(false);
    });

    it('should reject array with mixed valid/invalid patterns (fails on first invalid)', () => {
      const patterns = [
        {
          name: 'email',
          pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
          replacement: '[REDACTED-EMAIL]',
        },
        {
          name: 'invalid',
          pattern: '[invalid{regex',
          replacement: '[REDACTED]',
        },
      ] as any;
      const result = validatePatterns(patterns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('index 1');
    });

    it('should reject array with missing required pattern field', () => {
      const patterns = [
        {
          name: 'email',
          replacement: '[REDACTED-EMAIL]',
        },
      ] as any;
      const result = validatePatterns(patterns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('index 0');
    });

    it('should validate patterns with different names', () => {
      const patterns: PiiPattern[] = [
        { name: 'email', pattern: '.*@.*', replacement: '[REDACTED]' },
        { name: 'phone', pattern: '\\d+', replacement: '[REDACTED]' },
        { name: 'token', pattern: '[a-z0-9]+', replacement: '[REDACTED]' },
        { name: 'api_key', pattern: 'sk_[a-z0-9]+', replacement: '[REDACTED]' },
        { name: 'jwt', pattern: '[a-z0-9]+\\.[a-z0-9]+\\.[a-z0-9]+', replacement: '[REDACTED]' },
        { name: 'custom', pattern: 'custom.*', replacement: '[REDACTED]' },
      ];
      const result = validatePatterns(patterns);
      expect(result.isValid).toBe(true);
    });
  });

  describe('compileRegex', () => {
    it('should compile a valid regex string', () => {
      const result = compileRegex('[\\w+.-]+@[\\w.-]+\\.\\w{2,}');
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(RegExp);
    });

    it('should return null for invalid regex', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const result = compileRegex('[invalid{regex');
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should compile regex with flags', () => {
      const result = compileRegex('^test$');
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(RegExp);
    });

    it('should log warning on invalid regex', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      compileRegex('(?P<invalid)group');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[PII]'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to compile'));
      warnSpy.mockRestore();
    });

    it('should compile regex that works correctly', () => {
      const regex = compileRegex('[\\w+.-]+@[\\w.-]+\\.\\w{2,}');
      expect(regex).not.toBeNull();
      if (regex) {
        const testString = 'test@example.com';
        expect(regex.test(testString)).toBe(true);
      }
    });

    it('should compile regex with special characters', () => {
      const result = compileRegex('[-+*/=!<>]');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.test('+')).toBe(true);
        expect(result.test('-')).toBe(true);
        expect(result.test('a')).toBe(false);
      }
    });
  });
});
