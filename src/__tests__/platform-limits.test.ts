import { describe, it, expect } from 'vitest';
import {
  TWITTER_CONFIG,
  TIKTOK_CONFIG,
  FACEBOOK_CONFIG,
  INSTAGRAM_CONFIG,
  LINKEDIN_CONFIG,
  YOUTUBE_CONFIG,
} from '../constants';

describe('Platform Limits - Twitter', () => {
  it('should have correct character limit', () => {
    expect(TWITTER_CONFIG.text.maxCaptionLength).toBe(280);
  });

  it('should have correct video duration limit', () => {
    expect(TWITTER_CONFIG.video.maxDurationSeconds).toBe(140); // 2:20
  });

  it('should have correct max images', () => {
    expect(TWITTER_CONFIG.image.maxImagesPerPost).toBe(4);
  });

  it('should support correct video codecs', () => {
    expect(TWITTER_CONFIG.video.supportedCodecs).toContain('h264');
  });
});

describe('Platform Limits - TikTok', () => {
  it('should have correct character limit', () => {
    expect(TIKTOK_CONFIG.text.maxCaptionLength).toBe(2200);
  });

  it('should have correct video duration limit', () => {
    expect(TIKTOK_CONFIG.video.maxDurationSeconds).toBe(600); // 10 minutes
  });

  it('should not support clickable links in captions', () => {
    expect(TIKTOK_CONFIG.text.supportsLinks).toBe(false);
  });
});

describe('Platform Limits - Facebook', () => {
  it('should have correct character limit', () => {
    expect(FACEBOOK_CONFIG.text.maxCaptionLength).toBe(63206);
  });

  it('should have correct max images', () => {
    expect(FACEBOOK_CONFIG.image.maxImagesPerPost).toBe(10);
  });

  it('should support long videos', () => {
    expect(FACEBOOK_CONFIG.video.maxDurationSeconds).toBe(14400); // 240 minutes
  });
});

describe('Platform Limits - Instagram', () => {
  it('should have correct character limit', () => {
    expect(INSTAGRAM_CONFIG.text.maxCaptionLength).toBe(2200);
  });

  it('should have correct max hashtags', () => {
    expect(INSTAGRAM_CONFIG.text.maxHashtags).toBe(30);
  });

  it('should have correct max images', () => {
    expect(INSTAGRAM_CONFIG.image.maxImagesPerPost).toBe(10);
  });
});

describe('Platform Limits - LinkedIn', () => {
  it('should have correct character limit', () => {
    expect(LINKEDIN_CONFIG.text.maxCaptionLength).toBe(3000);
  });

  it('should have correct video duration limit', () => {
    expect(LINKEDIN_CONFIG.video.maxDurationSeconds).toBe(600); // 10 minutes
  });

  it('should support links', () => {
    expect(LINKEDIN_CONFIG.text.supportsLinks).toBe(true);
  });
});

describe('Platform Limits - YouTube', () => {
  it('should have correct description limit', () => {
    expect(YOUTUBE_CONFIG.text.maxCaptionLength).toBe(5000);
  });

  it('should support very long videos', () => {
    expect(YOUTUBE_CONFIG.video.maxDurationSeconds).toBe(43200); // 12 hours
  });

  it('should support multiple codecs', () => {
    expect(YOUTUBE_CONFIG.video.supportedCodecs).toContain('h264');
    expect(YOUTUBE_CONFIG.video.supportedCodecs).toContain('vp9');
    expect(YOUTUBE_CONFIG.video.supportedCodecs).toContain('av1');
  });
});

describe('Platform Limits - Aspect Ratios', () => {
  it('Twitter should support 16:9 and 1:1', () => {
    expect(TWITTER_CONFIG.video.aspectRatios).toContain('16:9');
    expect(TWITTER_CONFIG.video.aspectRatios).toContain('1:1');
  });

  it('TikTok should support 9:16 (vertical)', () => {
    expect(TIKTOK_CONFIG.video.aspectRatios).toContain('9:16');
  });

  it('Instagram should support square and portrait', () => {
    expect(INSTAGRAM_CONFIG.video.aspectRatios).toContain('1:1');
    expect(INSTAGRAM_CONFIG.video.aspectRatios).toContain('4:5');
  });
});
