import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeEmail,
  sanitizePhone,
  redactToken,
  maskIdentifier,
  scrubObject,
} from '../utils/pii-sanitizers';
import type { PiiPattern } from '../utils/pii-types';

describe('PII Sanitizers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizeEmail', () => {
    it('should sanitize a single email address', () => {
      const input = 'Contact: john@example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe('Contact: [REDACTED-EMAIL]');
    });

    it('should sanitize multiple email addresses', () => {
      const input = 'Emails: john@example.com and jane@test.org';
      const result = sanitizeEmail(input);
      expect(result).toBe('Emails: [REDACTED-EMAIL] and [REDACTED-EMAIL]');
    });

    it('should handle email-like but invalid formats (no replacement)', () => {
      const input = 'Invalid: notanemail@, @nodomain';
      const result = sanitizeEmail(input);
      expect(result).toBe(input);
    });

    it('should return empty string unchanged', () => {
      const result = sanitizeEmail('');
      expect(result).toBe('');
    });

    it('should return string with no email (passthrough)', () => {
      const input = 'No email here';
      const result = sanitizeEmail(input);
      expect(result).toBe(input);
    });

    it('should use custom replacement token', () => {
      const input = 'Email: test@example.com';
      const result = sanitizeEmail(input, '[EMAIL]');
      expect(result).toBe('Email: [EMAIL]');
    });

    it('should Handle email at start of string', () => {
      const input = 'test@example.com is my email';
      const result = sanitizeEmail(input);
      expect(result).toBe('[REDACTED-EMAIL] is my email');
    });

    it('should handle email at end of string', () => {
      const input = 'Contact me at test@example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe('Contact me at [REDACTED-EMAIL]');
    });

    it('should handle plus-addressing (gmail+tag format)', () => {
      const input = 'gmail+tag@example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe('[REDACTED-EMAIL]');
    });

    it('should handle subdomains', () => {
      const input = 'contact@mail.example.co.uk';
      const result = sanitizeEmail(input);
      expect(result).toBe('[REDACTED-EMAIL]');
    });

    it('should handle non-string input (passthrough)', () => {
      const result = sanitizeEmail(12345 as any);
      expect(result).toBe(12345);
    });

    it('should handle malformed emails with multiple dots', () => {
      const input = 'test@sub.domain.example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe('[REDACTED-EMAIL]');
    });
  });

  describe('sanitizePhone', () => {
    it('should sanitize phone in US format (555) 123-4567', () => {
      const input = 'Call (555) 123-4567';
      const result = sanitizePhone(input);
      expect(result).toContain('[REDACTED-PHONE]');
    });

    it('should sanitize international format +1-555-1234', () => {
      const input = 'Call +1-555-1234';
      const result = sanitizePhone(input);
      expect(result).toContain('[REDACTED-PHONE]');
    });

    it('should sanitize phone with extension', () => {
      const input = '+1-555-1234 ext. 123';
      const result = sanitizePhone(input);
      expect(result).toContain('[REDACTED-PHONE]');
    });

    it('should return passthrough when no phone present', () => {
      const input = 'No phone here';
      const result = sanitizePhone(input);
      expect(result).toBe(input);
    });

    it('should sanitize multiple phone numbers', () => {
      const input = 'Call (555) 123-4567 or +1-666-9999';
      const result = sanitizePhone(input);
      expect(result).not.toContain('555');
      expect(result).not.toContain('666');
    });

    it('should use custom replacement token', () => {
      const input = 'Call +1-555-1234';
      const result = sanitizePhone(input, '[PHONE]');
      expect(result).toContain('[PHONE]');
    });

    it('should handle empty string', () => {
      const result = sanitizePhone('');
      expect(result).toBe('');
    });

    it('should handle phone in parentheses', () => {
      const input = '(555) 123-4567';
      const result = sanitizePhone(input);
      expect(result).toContain('[REDACTED-PHONE]');
    });

    it('should handle phone with spaces', () => {
      const input = '555 123 4567';
      const result = sanitizePhone(input);
      expect(result).toContain('[REDACTED-PHONE]');
    });

    it('should handle international codes', () => {
      const input = '+44-20-7946-0958';
      const result = sanitizePhone(input);
      expect(result).toContain('[REDACTED-PHONE]');
    });

    it('should handle non-string input (passthrough)', () => {
      const result = sanitizePhone(null as any);
      expect(result).toBe(null);
    });

    it('should not match incomplete phone pattern', () => {
      const input = 'Too short: 555';
      const result = sanitizePhone(input);
      expect(result).toContain('555');
    });
  });

  describe('redactToken', () => {
    it('should redact Bearer token', () => {
      const input = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const result = redactToken(input);
      expect(result).toBe('Bearer [REDACTED-TOKEN]');
    });

    it('should redact multiple Bearer tokens', () => {
      const input = 'Token1: Bearer abc123 and Token2: Bearer xyz789';
      const result = redactToken(input);
      expect(result).not.toContain('abc123');
      expect(result).not.toContain('xyz789');
    });

    it('should return passthrough when no token present', () => {
      const input = 'No token here';
      const result = redactToken(input);
      expect(result).toBe(input);
    });

    it('should use custom replacement token', () => {
      const input = 'Bearer realtoken123';
      const result = redactToken(input, 'Bearer [TOKEN]');
      expect(result).toBe('Bearer [TOKEN]');
    });

    it('should handle empty string', () => {
      const result = redactToken('');
      expect(result).toBe('');
    });

    it('should handle "Bearer" alone without token', () => {
      const input = 'Bearer';
      const result = redactToken(input);
      expect(result).toBe('Bearer');
    });

    it('should handle non-string input (passthrough)', () => {
      const result = redactToken(undefined as any);
      expect(result).toBe(undefined);
    });

    it('should handle Bearer with underscore/dash tokens', () => {
      const input = 'Bearer token_with_underscores-and-dashes';
      const result = redactToken(input);
      expect(result).toContain('[REDACTED-TOKEN]');
    });

    it('should handle case-insensitive Bearer prefix', () => {
      const input = 'bearer token123';
      const result = redactToken(input);
      expect(result).toContain('[REDACTED-TOKEN]');
    });

    it('should handle token at end of line', () => {
      const input = 'Authorization: Bearer token123xyz';
      const result = redactToken(input);
      expect(result).toBe('Authorization: Bearer [REDACTED-TOKEN]');
    });
  });

  describe('maskIdentifier', () => {
    it('should mask long API key patterns', () => {
      const input = 'Key: sk_live_1234567890abcdefghijklmnopqrstuvwxyz';
      const result = maskIdentifier(input);
      expect(result).toContain('[REDACTED-IDENTIFIER]');
    });

    it('should mask JWT tokens', () => {
      const input =
        'JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';
      const result = maskIdentifier(input);
      expect(result).toContain('[REDACTED-IDENTIFIER]');
    });

    it('should mask multiple long identifiers', () => {
      const input =
        'Key1: sk_live_1234567890abcdefghijklmnopqrstuvwxyz and Key2: pk_test_abcdefghijklmnopqrstuvwxyz1234567890';
      const result = maskIdentifier(input);
      expect(result).not.toContain('sk_live_');
      expect(result).not.toContain('pk_test_');
    });

    it('should use custom replacement token', () => {
      const input = 'API Key: sk_live_1234567890abcdefghijklmnopqrstuvwxyz';
      const result = maskIdentifier(input, '[API-KEY]');
      expect(result).toContain('[API-KEY]');
    });

    it('should handle empty string', () => {
      const result = maskIdentifier('');
      expect(result).toBe('');
    });

    it('should return passthrough when no long identifiers present', () => {
      const input = 'No long identifiers like short123';
      const result = maskIdentifier(input);
      expect(result).toBe(input);
    });

    it('should handle non-string input (passthrough)', () => {
      const result = maskIdentifier(0 as any);
      expect(result).toBe(0);
    });

    it('should match tokens at 40+ chars', () => {
      const input = 'Token: abcdefghijklmnopqrstuvwxyz0123456789ABCDE';
      const result = maskIdentifier(input);
      expect(result).toContain('[REDACTED-IDENTIFIER]');
    });

    it('should not match short sequences under 40 chars', () => {
      const input = 'Short: abc123defghijklmnopqrstuvwxyz';
      const result = maskIdentifier(input);
      expect(result).toBe(input);
    });
  });

  describe('scrubObject', () => {
    const emailPattern: PiiPattern = {
      name: 'email',
      pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
      replacement: '[REDACTED-EMAIL]',
    };

    const phonePattern: PiiPattern = {
      name: 'phone',
      pattern: '(?:\\+\\d{1,3}[-\\.\\s]?)?(\\(?\\d{2,4}\\)?[-\\.\\s]?\\d{2,4}[-\\.\\s]?\\d{2,4})',
      replacement: '[REDACTED-PHONE]',
    };

    it('should sanitize simple object with one email', () => {
      const obj = { email: 'test@example.com' };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.email).toBe('[REDACTED-EMAIL]');
    });

    it('should sanitize nested object (2 levels)', () => {
      const obj = {
        user: {
          email: 'john@example.com',
        },
      };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.user.email).toBe('[REDACTED-EMAIL]');
    });

    it('should sanitize deep nesting (5 levels)', () => {
      const obj = {
        a: {
          b: {
            c: {
              d: {
                e: 'test@example.com',
              },
            },
          },
        },
      };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.a.b.c.d.e).toBe('[REDACTED-EMAIL]');
    });

    it('should sanitize array of strings', () => {
      const obj = {
        emails: ['john@example.com', 'jane@example.com'],
      };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.emails[0]).toBe('[REDACTED-EMAIL]');
      expect(result.emails[1]).toBe('[REDACTED-EMAIL]');
    });

    it('should sanitize array of objects', () => {
      const obj = {
        users: [{ email: 'john@example.com' }, { email: 'jane@example.com' }],
      };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.users[0].email).toBe('[REDACTED-EMAIL]');
      expect(result.users[1].email).toBe('[REDACTED-EMAIL]');
    });

    it('should handle mixed arrays and objects', () => {
      const obj = {
        mixed: [
          { email: 'test1@example.com' },
          'Some string',
          { nested: { email: 'test2@example.com' } },
        ],
      };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.mixed[0].email).toBe('[REDACTED-EMAIL]');
      expect(result.mixed[2].nested.email).toBe('[REDACTED-EMAIL]');
    });

    it('should passthrough null values', () => {
      const obj = { email: null };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.email).toBe(null);
    });

    it('should passthrough undefined values', () => {
      const obj = { email: undefined };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.email).toBe(undefined);
    });

    it('should passthrough number values', () => {
      const obj = { count: 42 };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.count).toBe(42);
    });

    it('should passthrough boolean values', () => {
      const obj = { flag: true };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.flag).toBe(true);
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = scrubObject(obj, [emailPattern]);
      expect(result).toEqual({});
    });

    it('should handle empty arrays', () => {
      const obj = { items: [] };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.items).toEqual([]);
    });

    it('should detect circular reference (parent → child → parent)', () => {
      const obj: any = { email: 'test@example.com' };
      const child: any = { parent: obj, email: 'child@example.com' };
      obj.child = child;
      // Should not stack overflow
      const result = scrubObject(obj, [emailPattern]);
      expect(result).toBeDefined();
      expect(result.email).toBe('[REDACTED-EMAIL]');
    });

    it('should detect self-reference (obj → obj)', () => {
      const obj: any = { email: 'test@example.com' };
      obj.self = obj;
      // Should not stack overflow
      const result = scrubObject(obj, [emailPattern]);
      expect(result).toBeDefined();
      expect(result.email).toBe('[REDACTED-EMAIL]');
    });

    it('should handle multiple objects reference same child', () => {
      const child = { email: 'child@example.com' };
      const obj = {
        ref1: child,
        ref2: child,
      };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.ref1.email).toBe('[REDACTED-EMAIL]');
      expect(result.ref2.email).toBe('[REDACTED-EMAIL]');
    });

    it('should respect maxDepth option (exceed depth)', () => {
      const obj = {
        a: {
          b: {
            c: 'test@example.com',
          },
        },
      };
      const result = scrubObject(obj, [emailPattern], { maxDepth: 1 });
      // Should not reach the deep email
      expect(result.a.b.c).toBe('test@example.com');
    });

    it('should use default maxDepth of 50 for deep objects', () => {
      const obj: any = { email: 'test@example.com' };
      let current = obj;
      for (let i = 0; i < 40; i++) {
        current.next = {};
        current = current.next;
      }
      current.email = 'deep@example.com';

      const result = scrubObject(obj, [emailPattern]);
      expect(result.email).toBe('[REDACTED-EMAIL]');
    });

    it('should apply multiple patterns in sequence', () => {
      const obj = {
        email: 'test@example.com',
        phone: '555-123-4567',
      };
      const result = scrubObject(obj, [emailPattern, phonePattern]);
      expect(result.email).toBe('[REDACTED-EMAIL]');
      expect(result.phone).toContain('[REDACTED-PHONE]');
    });

    it('should not mutate original object', () => {
      const original = { email: 'test@example.com' };
      const originalEmail = original.email;
      scrubObject(original, [emailPattern]);
      expect(original.email).toBe(originalEmail);
    });

    it('should skip Symbol keys', () => {
      const sym = Symbol('hidden');
      const obj: any = {
        email: 'test@example.com',
        [sym]: 'secret@example.com',
      };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.email).toBe('[REDACTED-EMAIL]');
      // Symbol keys are not enumerable via Object.keys, so skipped
    });

    it('should passthrough Function values', () => {
      const fn = () => 'test@example.com';
      const obj = { callback: fn };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.callback).toBe(fn);
    });

    it('should passthrough Date objects', () => {
      const date = new Date('2026-02-07');
      const obj = { date };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.date).toBe(date);
    });

    it('should passthrough RegExp objects', () => {
      const regex = /test/;
      const obj = { regex };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.regex).toBe(regex);
    });

    it('should passthrough Set objects', () => {
      const set = new Set(['a', 'b']);
      const obj = { set };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.set).toBe(set);
    });

    it('should passthrough Map objects', () => {
      const map = new Map([['key', 'value']]);
      const obj = { map };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.map).toBe(map);
    });

    it('should handle large object (1000+ keys)', () => {
      const obj: any = {};
      for (let i = 0; i < 1000; i++) {
        obj[`key${i}`] = `test${i}@example.com`;
      }
      const result = scrubObject(obj, [emailPattern]);
      expect(result.key0).toBe('[REDACTED-EMAIL]');
      expect(result.key999).toBe('[REDACTED-EMAIL]');
    });

    it('should handle deep array (1000+ elements)', () => {
      const obj = {
        items: Array.from({ length: 1000 }, (_, i) => `item${i}@example.com`),
      };
      const result = scrubObject(obj, [emailPattern]);
      expect(result.items[0]).toBe('[REDACTED-EMAIL]');
      expect(result.items[999]).toBe('[REDACTED-EMAIL]');
    });

    it('should handle complex real-world object (user with nested data)', () => {
      const obj = {
        id: '12345',
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-123-4567',
          contact: {
            email: 'alt@example.com',
            address: {
              street: 'test@example.com',
            },
          },
        },
        metadata: {
          created: '2026-02-07',
          emails: ['test1@example.com', 'test2@example.com'],
        },
      };
      const result = scrubObject(obj, [emailPattern, phonePattern]);
      expect(result.user.email).toBe('[REDACTED-EMAIL]');
      expect(result.user.contact.email).toBe('[REDACTED-EMAIL]');
      expect(result.user.phone).toContain('[REDACTED-PHONE]');
      expect(result.metadata.emails[0]).toBe('[REDACTED-EMAIL]');
    });

    it('should warn and continue on invalid pattern array', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const obj = { email: 'test@example.com' };
      const badPatterns = [{ name: 'email' }] as any; // Missing required fields
      const result = scrubObject(obj, badPatterns);
      expect(warnSpy).toHaveBeenCalled();
      expect(result).toBeDefined();
      warnSpy.mockRestore();
    });

    it('should handle empty pattern array', () => {
      const obj = { email: 'test@example.com' };
      const result = scrubObject(obj, []);
      // No patterns, string should not be modified (patterns are applied via applyPatterns)
      expect(result.email).toBe('test@example.com');
    });

    it('should handle multiple circular paths', () => {
      const shared: any = { email: 'shared@example.com' };
      const obj1: any = { data: shared };
      const obj2: any = { data: shared };
      const root = { obj1, obj2 };
      // Should not crash on multiple paths to same circular reference
      const result = scrubObject(root, [emailPattern]);
      expect(result).toBeDefined();
    });

    it('should warn on non-array patterns', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const obj = { email: 'test@example.com' };
      scrubObject(obj, null as any);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should handle individual pattern validation failures gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const obj = { email: 'test@example.com', phone: '555-123-4567' };
      const patterns = [
        emailPattern,
        { name: 'invalid', pattern: '[invalid{regex', replacement: '[REDACTED]' } as any,
        phonePattern,
      ];
      const result = scrubObject(obj, patterns);
      expect(result.email).toBe('[REDACTED-EMAIL]');
      expect(warnSpy).toHaveBeenCalled(); // Warning for invalid pattern
      warnSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should sanitize API response with PII', () => {
      const response = {
        status: 'success',
        user: {
          id: 'user123',
          email: 'john@example.com',
          phone: '555-123-4567',
          verified: true,
        },
      };

      const emailPattern: PiiPattern = {
        name: 'email',
        pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
        replacement: '[REDACTED-EMAIL]',
      };
      const phonePattern: PiiPattern = {
        name: 'phone',
        pattern: '(?:\\+\\d{1,3}[-\\.\\s]?)?(\\(?\\d{2,4}\\)?[-\\.\\s]?\\d{2,4}[-\\.\\s]?\\d{2,4})',
        replacement: '[REDACTED-PHONE]',
      };

      const result = scrubObject(response, [emailPattern, phonePattern]);
      expect(result.user.email).toBe('[REDACTED-EMAIL]');
      expect(result.user.phone).toContain('[REDACTED-PHONE]');
      expect(result.status).toBe('success');
      expect(result.user.verified).toBe(true);
    });

    it('should sanitize form submission with email and token', () => {
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        authToken:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        apiKey: 'sk_live_1234567890abcdefghijklmnopqrstuvwxyz',
      };

      const patterns: PiiPattern[] = [
        {
          name: 'email',
          pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
          replacement: '[REDACTED-EMAIL]',
        },
        {
          name: 'token',
          pattern: 'Bearer\\s+[a-zA-Z0-9._-]+',
          replacement: 'Bearer [REDACTED-TOKEN]',
        },
        {
          name: 'api_key',
          pattern: '[a-z]{2}_[a-z0-9_]{30,}',
          replacement: '[REDACTED-API-KEY]',
        },
      ];

      const result = scrubObject(formData, patterns);
      expect(result.email).toBe('[REDACTED-EMAIL]');
      expect(result.authToken).toBe('Bearer [REDACTED-TOKEN]');
      expect(result.apiKey).toBe('[REDACTED-API-KEY]');
      expect(result.firstName).toBe('John');
    });

    it('should sanitize error log with sensitive data', () => {
      const errorLog = {
        timestamp: '2026-02-07T10:00:00Z',
        level: 'ERROR',
        message: 'API call failed',
        details: {
          endpoint: '/api/posts',
          statusCode: 401,
        },
        context: {
          userEmail: 'john@example.com',
          authToken: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.abc123',
          apiKey: 'sk_live_1234567890abcdefghijklmnopqrstuvwxyz',
        },
      };

      const tokenPattern: PiiPattern = {
        name: 'token',
        pattern: 'Bearer\\s+[a-zA-Z0-9._-]+',
        replacement: 'Bearer [REDACTED-TOKEN]',
      };
      const emailPattern: PiiPattern = {
        name: 'email',
        pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
        replacement: '[REDACTED-EMAIL]',
      };

      const result = scrubObject(errorLog, [emailPattern, tokenPattern]);
      expect(result.context.userEmail).toBe('[REDACTED-EMAIL]');
      expect(result.context.authToken).toBe('Bearer [REDACTED-TOKEN]');
      expect(result.timestamp).toBe('2026-02-07T10:00:00Z');
    });

    it('should sanitize with custom replacement tokens', () => {
      const obj = { email: 'test@example.com', phone: '555-1234' };

      const result1 = sanitizeEmail(obj.email, '[***EMAIL***]');
      expect(result1).toBe('[***EMAIL***]');

      const result2 = sanitizePhone(obj.phone, 'PHONE_HIDDEN');
      expect(result2).toContain('PHONE_HIDDEN');
    });

    it('should handle 1MB object performance', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        email: `user${i}@example.com`,
        data: `contains ${i % 100}@test.org`,
      }));

      const obj = { users: largeArray };

      const emailPattern: PiiPattern = {
        name: 'email',
        pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
        replacement: '[REDACTED-EMAIL]',
      };

      const start = performance.now();
      const result = scrubObject(obj, [emailPattern]);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(result.users[0].email).toBe('[REDACTED-EMAIL]');
      // Should complete in reasonable time (< 5 seconds for test)
      expect(duration).toBeLessThan(5000);
    });

    it('should maintain data integrity while sanitizing', () => {
      const original = {
        id: 'abc123',
        count: 42,
        active: true,
        tags: ['important', 'verified'],
        metadata: { version: '1.0', created: '2026-02-07' },
      };

      const emailPattern: PiiPattern = {
        name: 'email',
        pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
        replacement: '[REDACTED-EMAIL]',
      };

      const result = scrubObject(original, [emailPattern]);

      // Non-string values should be unchanged
      expect(result.id).toBe('abc123');
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.tags).toEqual(['important', 'verified']);
      expect(result.metadata).toEqual({ version: '1.0', created: '2026-02-07' });
    });
  });
});
