import { describe, it, expect } from 'vitest';
import * as utils from '../utils/index';
import { ValidationErrorCode } from '../utils/types';

describe('Utils Module Exports', () => {
  describe('Validation function exports', () => {
    it('should export validateCaption function', () => {
      expect(typeof utils.validateCaption).toBe('function');
    });

    it('should export validateVideoFile function', () => {
      expect(typeof utils.validateVideoFile).toBe('function');
    });

    it('should export validateVideoMetadata function', () => {
      expect(typeof utils.validateVideoMetadata).toBe('function');
    });

    it('should export validateEmail function', () => {
      expect(typeof utils.validateEmail).toBe('function');
    });

    it('should export validateUrl function', () => {
      expect(typeof utils.validateUrl).toBe('function');
    });
  });

  describe('Formatting function exports', () => {
    it('should export formatDate function', () => {
      expect(typeof utils.formatDate).toBe('function');
    });

    it('should export formatNumber function', () => {
      expect(typeof utils.formatNumber).toBe('function');
    });

    it('should export formatMetric function', () => {
      expect(typeof utils.formatMetric).toBe('function');
    });
  });

  describe('Type and enum exports', () => {
    it('should export ValidationErrorCode enum', () => {
      expect(ValidationErrorCode.CAPTION_TOO_LONG).toBe('CAPTION_TOO_LONG');
      expect(ValidationErrorCode.CAPTION_EMPTY).toBe('CAPTION_EMPTY');
      expect(ValidationErrorCode.VIDEO_FILE_TOO_LARGE).toBe('VIDEO_FILE_TOO_LARGE');
      expect(ValidationErrorCode.VIDEO_INVALID_EXTENSION).toBe('VIDEO_INVALID_EXTENSION');
      expect(ValidationErrorCode.VIDEO_INVALID_TYPE).toBe('VIDEO_INVALID_TYPE');
      expect(ValidationErrorCode.EMAIL_INVALID_FORMAT).toBe('EMAIL_INVALID_FORMAT');
      expect(ValidationErrorCode.EMAIL_EMPTY).toBe('EMAIL_EMPTY');
      expect(ValidationErrorCode.URL_INVALID_FORMAT).toBe('URL_INVALID_FORMAT');
      expect(ValidationErrorCode.URL_EMPTY).toBe('URL_EMPTY');
    });

    it('should have ValidationErrorCode enum accessible from utils', () => {
      expect(utils.ValidationErrorCode).toBeDefined();
      expect(utils.ValidationErrorCode.CAPTION_TOO_LONG).toBe('CAPTION_TOO_LONG');
    });
  });

  describe('Module integration', () => {
    it('should allow importing all exports together', () => {
      const allExports = Object.keys(utils);
      expect(allExports).toContain('validateCaption');
      expect(allExports).toContain('validateVideoFile');
      expect(allExports).toContain('validateVideoMetadata');
      expect(allExports).toContain('validateEmail');
      expect(allExports).toContain('validateUrl');
      expect(allExports).toContain('formatDate');
      expect(allExports).toContain('formatNumber');
      expect(allExports).toContain('formatMetric');
      expect(allExports).toContain('ValidationErrorCode');
    });

    it('should have correct number of exports', () => {
      const exportedFunctions = Object.keys(utils).filter(
        (key) => typeof utils[key as keyof typeof utils] === 'function'
      );
      expect(exportedFunctions.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Function behavior verification', () => {
    it('should verify validateCaption works through barrel export', () => {
      const errors = utils.validateCaption('Hello', ['twitter']);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should verify formatDate works through barrel export', () => {
      const result = utils.formatDate('2026-02-06T15:30:00Z', 'en-US');
      expect(typeof result).toBe('string');
      expect(result).toBe('2/6/2026');
    });

    it('should verify formatMetric works through barrel export', () => {
      const result = utils.formatMetric(1500, 'reach');
      expect(result).toBe('1.5K');
    });
  });
});
