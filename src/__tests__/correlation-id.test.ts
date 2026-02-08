import { describe, it, expect } from 'vitest';
import { generateCorrelationId, isValidCorrelationId } from '../utils/observability/correlation-id';
import type { CorrelationId } from '../utils/observability/correlation-id';

describe('Correlation ID Utilities', () => {
  describe('generateCorrelationId', () => {
    it('should generate a valid UUID v4', () => {
      const id = generateCorrelationId();
      expect(isValidCorrelationId(id)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<CorrelationId>();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        ids.add(generateCorrelationId());
      }

      expect(ids.size).toBe(count);
    });

    it('should generate valid UUIDs with correct format', () => {
      const id = generateCorrelationId();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where y is 8, 9, a, or b
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidV4Regex.test(id)).toBe(true);
    });

    it('should return a correlation ID type', () => {
      const id = generateCorrelationId();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(36); // Standard UUID length with hyphens
    });
  });

  describe('isValidCorrelationId', () => {
    it('should accept valid UUID v4', () => {
      const validId = generateCorrelationId();
      expect(isValidCorrelationId(validId)).toBe(true);
    });

    it('should reject invalid string', () => {
      expect(isValidCorrelationId('not-a-uuid')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidCorrelationId('')).toBe(false);
    });

    it('should reject null-like strings', () => {
      expect(isValidCorrelationId('null')).toBe(false);
      expect(isValidCorrelationId('undefined')).toBe(false);
    });

    it('should reject malformed UUID', () => {
      // Invalid checksum
      expect(isValidCorrelationId('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
      // Too short
      expect(isValidCorrelationId('550e8400-e29b-41d4-a71')).toBe(false);
      // Invalid characters
      expect(isValidCorrelationId('550e8400-e29b-41d4-a716-44665544000z')).toBe(false);
    });

    it('should reject UUID v1', () => {
      // UUID v1 example (different version number in 3rd group: 1 instead of 4)
      const v1UUID = '550e8400-e29b-11d4-a716-446655440000';
      expect(isValidCorrelationId(v1UUID)).toBe(false);
    });

    it('should reject UUID v3', () => {
      // UUID v3 example (version 3 in 3rd group)
      const v3UUID = '550e8400-e29b-31d4-a716-446655440000';
      expect(isValidCorrelationId(v3UUID)).toBe(false);
    });

    it('should reject UUID v5', () => {
      // UUID v5 example (version 5 in 3rd group)
      const v5UUID = '550e8400-e29b-51d4-a716-446655440000';
      expect(isValidCorrelationId(v5UUID)).toBe(false);
    });

    it('should accept valid UUID v4 with uppercase letters', () => {
      const uppercaseId = generateCorrelationId().toUpperCase();
      expect(isValidCorrelationId(uppercaseId)).toBe(true);
    });

    it('should accept valid UUID v4 with mixed case', () => {
      const mixedCaseId = generateCorrelationId().split('').map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c)).join('');
      expect(isValidCorrelationId(mixedCaseId)).toBe(true);
    });

    it('should reject invalid variant bits', () => {
      // UUID with invalid variant in 4th group (should be 8, 9, a, or b)
      expect(isValidCorrelationId('550e8400-e29b-4fd4-c716-446655440000')).toBe(false); // 'c' is invalid
      expect(isValidCorrelationId('550e8400-e29b-4fd4-d716-446655440000')).toBe(false); // 'd' is invalid
      expect(isValidCorrelationId('550e8400-e29b-4fd4-e716-446655440000')).toBe(false); // 'e' is invalid
      expect(isValidCorrelationId('550e8400-e29b-4fd4-f716-446655440000')).toBe(false); // 'f' is invalid
    });

    it('should accept valid variant bits', () => {
      // These should be valid (or at least recognized as UUID)
      expect(isValidCorrelationId('550e8400-e29b-4fd4-8716-446655440000')).toBe(true); // '8' is valid
      expect(isValidCorrelationId('550e8400-e29b-4fd4-9716-446655440000')).toBe(true); // '9' is valid
      expect(isValidCorrelationId('550e8400-e29b-4fd4-a716-446655440000')).toBe(true); // 'a' is valid
      expect(isValidCorrelationId('550e8400-e29b-4fd4-b716-446655440000')).toBe(true); // 'b' is valid
    });

    it('should reject string with trailing/leading whitespace', () => {
      const validId = generateCorrelationId();
      expect(isValidCorrelationId(` ${validId}`)).toBe(false);
      expect(isValidCorrelationId(`${validId} `)).toBe(false);
      expect(isValidCorrelationId(` ${validId} `)).toBe(false);
    });

    it('should act as type guard for CorrelationId', () => {
      const id: string = generateCorrelationId();
      if (isValidCorrelationId(id)) {
        // TypeScript should narrow id to CorrelationId here
        const _correlationId: CorrelationId = id;
        expect(true).toBe(true); // Type check passed
      }
    });
  });

  describe('Type Safety', () => {
    it('should maintain correlation ID through generation and validation', () => {
      const generated = generateCorrelationId();
      const isValid = isValidCorrelationId(generated);
      expect(isValid).toBe(true);

      // TypeScript type narrowing test (compile-time check)
      if (isValid) {
        const _typed: CorrelationId = generated;
        expect(_typed).toBe(generated);
      }
    });
  });
});
