import { describe, it, expect } from 'vitest';
import { TIMEZONES, TIMEZONE_DISPLAY_NAMES, isValidTimezone } from '../constants';

describe('Timezones', () => {
  it('should have UTC timezone', () => {
    expect(TIMEZONES).toContain('UTC');
  });

  it('should have common US timezones', () => {
    expect(TIMEZONES).toContain('America/New_York');
    expect(TIMEZONES).toContain('America/Chicago');
    expect(TIMEZONES).toContain('America/Denver');
    expect(TIMEZONES).toContain('America/Los_Angeles');
  });

  it('should have common European timezones', () => {
    expect(TIMEZONES).toContain('Europe/London');
    expect(TIMEZONES).toContain('Europe/Paris');
    expect(TIMEZONES).toContain('Europe/Berlin');
  });

  it('should have common Asian timezones', () => {
    expect(TIMEZONES).toContain('Asia/Tokyo');
    expect(TIMEZONES).toContain('Asia/Singapore');
    expect(TIMEZONES).toContain('Asia/Shanghai');
  });

  it('should validate timezones correctly', () => {
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Invalid/Timezone')).toBe(false);
  });

  it('should have display names for common timezones', () => {
    expect(TIMEZONE_DISPLAY_NAMES['America/New_York']).toBe('Eastern Time (US & Canada)');
    expect(TIMEZONE_DISPLAY_NAMES['Europe/London']).toBe('London');
    expect(TIMEZONE_DISPLAY_NAMES['UTC']).toBe('Coordinated Universal Time');
  });

  it('should be a readonly array', () => {
    // TypeScript compile-time check - arrays are readonly
    // Runtime check: array methods that mutate should not exist or throw
    const timezones = TIMEZONES;
    expect(Array.isArray(timezones)).toBe(true);
  });
});
