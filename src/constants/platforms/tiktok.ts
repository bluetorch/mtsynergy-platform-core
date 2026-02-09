import type { PlatformConfig } from '../types';

/**
 * TikTok platform configuration
 *
 * Complete specifications for TikTok posting requirements including text,
 * video, and image constraints based on TikTok Creator Portal documentation.
 *
 * @see {@link https://www.tiktok.com/creators/creator-portal/|TikTok Creator Portal}
 * @see {@link ../../../docs/PLATFORM_LIMITS.md|Platform Limits Research}
 *
 * @example
 * ```typescript
 * import { TIKTOK_CONFIG } from '@mtsynergy/platform-core/constants';
 *
 * const maxLength = TIKTOK_CONFIG.text.maxCaptionLength; // 2200
 * const maxVideo = TIKTOK_CONFIG.video.maxDurationSeconds; // 600 (10 min)
 * ```
 *
 * @public
 */
export const TIKTOK_CONFIG: PlatformConfig = {
  /** Platform identifier */
  platform: 'tiktok',

  /** Display name for UI */
  displayName: 'TikTok',

  /** TikTok brand color (hex) */
  brandColor: '#000000',
  text: {
    /** Maximum caption length in characters */
    maxCaptionLength: 2200,

    /** Maximum hashtags allowed per post */
    maxHashtags: 30,

    /** Maximum @mentions allowed per post */
    maxMentions: 20,

    /** Markdown formatting not supported */
    supportsMarkdown: false,

    /** Emoji support enabled */
    supportsEmojis: true,

    /** Clickable links not supported in captions (bio only) */
    supportsLinks: false,
  },
  video: {
    maxDurationSeconds: 600, // 10 minutes
    minDurationSeconds: 1,
    maxFileSizeMB: 287.6,
    maxResolution: {
      width: 1080,
      height: 1920,
    },
    minResolution: {
      width: 360,
      height: 640,
    },
    supportedCodecs: ['h264', 'h265'],
    maxBitrateMbps: 16,
    maxFrameRate: 60,
    aspectRatios: ['9:16', '1:1'],
    supportedExtensions: ['mp4', 'mov', 'webm'],
  },
  image: {
    maxFileSizeMB: 10,
    maxResolution: {
      width: 1080,
      height: 1920,
    },
    minResolution: {
      width: 360,
      height: 640,
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxImagesPerPost: 35, // Photo carousel
  },
  apiRateLimits: {
    requestsPerHour: 100,
    requestsPerDay: 1000,
  },
};
