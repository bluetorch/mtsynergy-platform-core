import { describe, it, expect } from 'vitest';
import {
  validateCaption,
  validateVideoFile,
  validateVideoMetadata,
  validateEmail,
  validateUrl,
} from '../utils/validation';
import type { VideoMetadata } from '../utils/types';
import { ValidationErrorCode } from '../utils/types';
import { PLATFORM_CONFIGS } from '../constants';

describe('Validation Utilities', () => {
  describe('validateCaption', () => {
    it('should accept caption within platform limits', () => {
      const result = validateCaption('Hello world', ['twitter']);
      expect(result).toHaveLength(0);
    });

    it('should reject caption exceeding platform limit', () => {
      const longCaption = 'a'.repeat(300);
      const result = validateCaption(longCaption, ['twitter']);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe(ValidationErrorCode.CAPTION_TOO_LONG);
      expect(result[0].platform).toBe('twitter');
      expect(result[0].details?.length).toBe(300);
    });

    it('should validate against multiple platforms', () => {
      const longCaption = 'a'.repeat(300);
      const result = validateCaption(longCaption, ['twitter', 'facebook']);
      expect(result).toHaveLength(1); // Only Twitter should fail
      expect(result[0].platform).toBe('twitter');
    });

    it('should reject empty caption', () => {
      const result = validateCaption('', ['twitter']);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe(ValidationErrorCode.CAPTION_EMPTY);
    });

    it('should reject whitespace-only caption', () => {
      const result = validateCaption('   ', ['twitter']);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe(ValidationErrorCode.CAPTION_EMPTY);
    });

    it('should handle caption exactly at limit', () => {
      const twitterLimit = PLATFORM_CONFIGS.twitter.text.maxCaptionLength;
      const exactCaption = 'a'.repeat(twitterLimit);
      const result = validateCaption(exactCaption, ['twitter']);
      expect(result).toHaveLength(0);
    });

    it('should handle caption one character over limit', () => {
      const twitterLimit = PLATFORM_CONFIGS.twitter.text.maxCaptionLength;
      const overCaption = 'a'.repeat(twitterLimit + 1);
      const result = validateCaption(overCaption, ['twitter']);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe(ValidationErrorCode.CAPTION_TOO_LONG);
    });

    it('should handle unicode characters correctly', () => {
      const unicodeCaption = '👍'.repeat(100);
      const result = validateCaption(unicodeCaption, ['twitter']);
      expect(result).toHaveLength(0);
    });
  });

  describe('validateVideoFile', () => {
    it('should accept valid video file', () => {
      const file = new File(['content'], 'video.mp4', {
        type: 'video/mp4',
      });
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 }); // 50MB
      const result = validateVideoFile(file);
      expect(result).toHaveLength(0);
    });

    it('should reject file exceeding size limit', () => {
      const file = new File(['content'], 'video.mp4', {
        type: 'video/mp4',
      });
      Object.defineProperty(file, 'size', { value: 500 * 1024 * 1024 }); // 500MB
      const result = validateVideoFile(file);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].code).toBe(ValidationErrorCode.VIDEO_FILE_TOO_LARGE);
    });

    it('should reject invalid file extension', () => {
      const file = new File(['content'], 'video.avi', {
        type: 'video/x-msvideo',
      });
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 });
      const result = validateVideoFile(file);
      expect(result.some((e) => e.code === ValidationErrorCode.VIDEO_INVALID_EXTENSION)).toBe(true);
    });

    it('should reject non-video MIME type', () => {
      const file = new File(['content'], 'video.mp4', {
        type: 'image/png',
      });
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 });
      const result = validateVideoFile(file);
      expect(result.some((e) => e.code === ValidationErrorCode.VIDEO_INVALID_TYPE)).toBe(true);
    });

    it('should handle file without extension', () => {
      const file = new File(['content'], 'video', {
        type: 'video/mp4',
      });
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 });
      const result = validateVideoFile(file);
      // Should not crash, may have validation errors
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept file exactly at size limit', () => {
      const maxSize = 200 * 1024 * 1024; // Assuming 200MB limit
      const file = new File(['content'], 'video.mp4', {
        type: 'video/mp4',
      });
      Object.defineProperty(file, 'size', { value: maxSize });
      const result = validateVideoFile(file);
      expect(result.some((e) => e.code === ValidationErrorCode.VIDEO_FILE_TOO_LARGE)).toBe(false);
    });
  });

  describe('validateVideoMetadata', () => {
    it('should accept valid metadata', () => {
      const metadata: VideoMetadata = {
        codec: 'h264',
        width: 1920,
        height: 1080,
        fps: 30,
        bitrateMbps: 5,
      };
      const result = validateVideoMetadata(metadata);
      expect(result).toHaveLength(0);
    });

    it('should reject unsupported codec', () => {
      const metadata: VideoMetadata = {
        codec: 'av1',
        width: 1920,
        height: 1080,
        fps: 30,
        bitrateMbps: 5,
      };
      const result = validateVideoMetadata(metadata);
      expect(result.some((e) => e.code === ValidationErrorCode.VIDEO_INVALID_TYPE)).toBe(true);
      expect(result.some((e) => e.details?.codec === 'av1')).toBe(true);
    });

    it('should reject resolution below minimum', () => {
      const metadata: VideoMetadata = {
        codec: 'h264',
        width: 320,
        height: 240,
        fps: 30,
        bitrateMbps: 5,
      };
      const result = validateVideoMetadata(metadata);
      expect(result.some((e) => e.message.includes('below minimum'))).toBe(true);
    });

    it('should reject resolution above maximum', () => {
      const metadata: VideoMetadata = {
        codec: 'h264',
        width: 8000,
        height: 6000,
        fps: 30,
        bitrateMbps: 5,
      };
      const result = validateVideoMetadata(metadata);
      expect(result.some((e) => e.message.includes('exceeds maximum'))).toBe(true);
    });

    it('should reject frame rate exceeding limit', () => {
      const metadata: VideoMetadata = {
        codec: 'h264',
        width: 1920,
        height: 1080,
        fps: 120,
        bitrateMbps: 5,
      };
      const result = validateVideoMetadata(metadata);
      expect(result.some((e) => e.message.includes('Frame rate'))).toBe(true);
    });

    it('should reject bitrate exceeding limit', () => {
      const metadata: VideoMetadata = {
        codec: 'h264',
        width: 1920,
        height: 1080,
        fps: 30,
        bitrateMbps: 100,
      };
      const result = validateVideoMetadata(metadata);
      expect(result.some((e) => e.message.includes('Bitrate'))).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should accept email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
    });

    it('should accept email with plus addressing', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject email without @ symbol', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should reject email without TLD', () => {
      expect(validateEmail('user@example')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(validateEmail('user @example.com')).toBe(false);
    });

    it('should reject email with multiple @ symbols', () => {
      expect(validateEmail('user@@example.com')).toBe(false);
    });

    it('should reject empty email', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should accept valid http URL', () => {
      expect(validateUrl('http://example.com')).toBe(true);
    });

    it('should accept valid https URL', () => {
      expect(validateUrl('https://example.com')).toBe(true);
    });

    it('should accept URL with path', () => {
      expect(validateUrl('https://example.com/path/to/resource')).toBe(true);
    });

    it('should accept URL with query parameters', () => {
      expect(validateUrl('https://example.com?param=value&other=123')).toBe(true);
    });

    it('should accept URL with fragment', () => {
      expect(validateUrl('https://example.com#section')).toBe(true);
    });

    it('should reject malformed URL', () => {
      expect(validateUrl('not a url')).toBe(false);
    });

    it('should reject URL without protocol', () => {
      expect(validateUrl('example.com')).toBe(false);
    });

    it('should accept localhost URL', () => {
      expect(validateUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject empty URL', () => {
      expect(validateUrl('')).toBe(false);
    });
  });
});
