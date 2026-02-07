import { describe, it, expect } from 'vitest';
import type { Platform } from '../constants/types';
import { PLATFORM_CONFIGS, ALL_PLATFORMS, getPlatformConfig } from '../constants';

describe('Constants - Type Safety', () => {
  it('should have config for every platform', () => {
    ALL_PLATFORMS.forEach((platform) => {
      expect(PLATFORM_CONFIGS[platform]).toBeDefined();
      expect(PLATFORM_CONFIGS[platform].platform).toBe(platform);
    });
  });

  it('should have correct platform count', () => {
    expect(ALL_PLATFORMS).toHaveLength(6);
    expect(Object.keys(PLATFORM_CONFIGS)).toHaveLength(6);
  });

  it('should have valid platform config structure', () => {
    const platforms: Platform[] = [
      'twitter',
      'tiktok',
      'facebook',
      'instagram',
      'linkedin',
      'youtube',
    ];

    platforms.forEach((platform) => {
      const config = PLATFORM_CONFIGS[platform];

      // Basic properties
      expect(config.platform).toBe(platform);
      expect(config.displayName).toBeTruthy();
      expect(config.brandColor).toMatch(/^#[0-9A-F]{6}$/i);

      // Text requirements
      expect(config.text.maxCaptionLength).toBeGreaterThan(0);
      expect(config.text.maxHashtags).toBeGreaterThan(0);
      expect(typeof config.text.supportsEmojis).toBe('boolean');

      // Video requirements
      expect(config.video.maxDurationSeconds).toBeGreaterThan(0);
      expect(config.video.maxFileSizeMB).toBeGreaterThan(0);
      expect(config.video.supportedCodecs.length).toBeGreaterThan(0);
      expect(config.video.maxResolution.width).toBeGreaterThan(0);
      expect(config.video.maxResolution.height).toBeGreaterThan(0);

      // Image requirements
      expect(config.image.maxFileSizeMB).toBeGreaterThan(0);
      expect(config.image.supportedFormats.length).toBeGreaterThan(0);
      expect(config.image.maxImagesPerPost).toBeGreaterThan(0);
    });
  });

  it('should return correct config from getPlatformConfig', () => {
    const twitterConfig = getPlatformConfig('twitter');
    expect(twitterConfig.platform).toBe('twitter');
    expect(twitterConfig.displayName).toBe('Twitter / X');
  });
});
