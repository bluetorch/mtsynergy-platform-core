import { describe, it, expect } from 'vitest';
import { formatDate, formatNumber, formatMetric } from '../utils/formatting';

describe('Formatting Utilities', () => {
  describe('formatDate', () => {
    it('should format ISO8601 date in en-US locale', () => {
      const result = formatDate('2026-02-06T15:30:00Z', 'en-US');
      expect(result).toBe('2/6/2026');
    });

    it('should format ISO8601 date in es-ES locale', () => {
      const result = formatDate('2026-02-06T15:30:00Z', 'es-ES');
      expect(result).toBe('6/2/2026');
    });

    it('should format ISO8601 date in ja-JP locale', () => {
      const result = formatDate('2026-02-06T15:30:00Z', 'ja-JP');
      expect(result).toBe('2026/2/6');
    });

    it('should format ISO8601 date in de-DE locale', () => {
      const result = formatDate('2026-02-06T15:30:00Z', 'de-DE');
      expect(result).toBe('6.2.2026');
    });

    it('should return fallback for invalid date string', () => {
      const result = formatDate('invalid-date', 'en-US');
      expect(result).toBe('Invalid Date');
    });

    it('should return fallback for empty date string', () => {
      const result = formatDate('', 'en-US');
      expect(result).toBe('Invalid Date');
    });

    it('should handle timezone in ISO8601 date', () => {
      const result = formatDate('2026-02-06T15:30:00-05:00', 'en-US');
      expect(result).toMatch(/2\/6\/2026/);
    });
  });

  describe('formatNumber', () => {
    it('should format decimal in en-US locale', () => {
      const result = formatNumber(1234.567, 'en-US', 'decimal');
      expect(result).toBe('1,234.567');
    });

    it('should format decimal in de-DE locale', () => {
      const result = formatNumber(1234.567, 'de-DE', 'decimal');
      expect(result).toBe('1.234,567');
    });

    it('should format decimal in fr-FR locale', () => {
      const result = formatNumber(1234.567, 'fr-FR', 'decimal');
      // French uses non-breaking space as thousands separator
      expect(result).toMatch(/1[\s\u00A0]234[,.]567/);
    });

    it('should format percent in en-US locale', () => {
      const result = formatNumber(0.1234, 'en-US', 'percent');
      expect(result).toBe('12%');
    });

    it('should format percent in fr-FR locale', () => {
      const result = formatNumber(0.1234, 'fr-FR', 'percent');
      // French typically uses space before %
      expect(result).toMatch(/12[\s\u00A0]?%/);
    });

    it('should format percent in de-DE locale', () => {
      const result = formatNumber(0.1234, 'de-DE', 'percent');
      expect(result).toMatch(/12[\s\u00A0]?%/);
    });

    it('should handle negative numbers', () => {
      const result = formatNumber(-1234.56, 'en-US', 'decimal');
      expect(result).toBe('-1,234.56');
    });

    it('should handle zero', () => {
      const result = formatNumber(0, 'en-US', 'decimal');
      expect(result).toBe('0');
    });

    it('should default to decimal style', () => {
      const result = formatNumber(1234, 'en-US');
      expect(result).toBe('1,234');
    });

    it('should handle very large numbers', () => {
      const result = formatNumber(1234567890, 'en-US', 'decimal');
      expect(result).toBe('1,234,567,890');
    });
  });

  describe('formatMetric', () => {
    it('should format value >= 1M as X.XM', () => {
      expect(formatMetric(2500000, 'reach')).toBe('2.5M');
    });

    it('should format value >= 1K as X.XK', () => {
      expect(formatMetric(150000, 'impressions')).toBe('150.0K');
    });

    it('should format value < 1K as plain number', () => {
      expect(formatMetric(456, 'engagement')).toBe('456');
    });

    it('should format zero as plain number', () => {
      expect(formatMetric(0, 'reach')).toBe('0');
    });

    it('should format exactly 1000 as 1.0K', () => {
      expect(formatMetric(1000, 'reach')).toBe('1.0K');
    });

    it('should format exactly 1000000 as 1.0M', () => {
      expect(formatMetric(1000000, 'reach')).toBe('1.0M');
    });

    it('should handle decimal results correctly', () => {
      expect(formatMetric(1500, 'reach')).toBe('1.5K');
      expect(formatMetric(15000, 'reach')).toBe('15.0K');
      expect(formatMetric(1500000, 'reach')).toBe('1.5M');
    });

    it('should round to one decimal place', () => {
      expect(formatMetric(1234, 'reach')).toBe('1.2K');
      expect(formatMetric(1567, 'reach')).toBe('1.6K');
      expect(formatMetric(1234567, 'reach')).toBe('1.2M');
    });

    it('should accept different metric types', () => {
      expect(formatMetric(1000, 'reach')).toBe('1.0K');
      expect(formatMetric(1000, 'engagement')).toBe('1.0K');
      expect(formatMetric(1000, 'impressions')).toBe('1.0K');
    });

    it('should handle very large numbers', () => {
      expect(formatMetric(999999999, 'reach')).toBe('1000.0M');
    });
  });
});
