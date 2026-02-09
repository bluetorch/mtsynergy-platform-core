import type { PlatformConfig } from '../types';

/**
 * Twitter (X) platform configuration
 *
 * Complete specifications for Twitter/X posting requirements including text,
 * video, and image constraints based on Twitter API v2 documentation.
 *
 * @see {@link https://developer.twitter.com/en/docs/twitter-api|Twitter API Documentation}
 * @see {@link ../../../docs/PLATFORM_LIMITS.md|Platform Limits Research}
 *
 * @example
 * ```typescript
 * import { TWITTER_CONFIG } from '@mtsynergy/platform-core/constants';
 *
 * const maxLength = TWITTER_CONFIG.text.maxCaptionLength; // 280
 * const maxVideo = TWITTER_CONFIG.video.maxDurationSeconds; // 140 (2:20)
 * ```
 *
 * @public
 */
export const TWITTER_CONFIG: PlatformConfig = {
  /** Platform identifier */
  platform: 'twitter',

  /** Display name for UI */
  displayName: 'Twitter / X',

  /** Twitter brand color (hex) */
  brandColor: '#1DA1F2',

  text: {
    /** Maximum caption length - Twitter API v2 standard tier limit (280 chars for free, 4000 for Premium) */
    maxCaptionLength: 280,

    /** Maximum hashtags allowed per post */
    maxHashtags: 30,

    /** Maximum @mentions allowed per post */
    maxMentions: 50,

    /** Markdown formatting not supported in tweets */
    supportsMarkdown: false,

    /** Emoji support enabled */
    supportsEmojis: true,

    /** URL links supported and auto-shortened via t.co */
    supportsLinks: true,
  },

  video: {
    /** Maximum video duration in seconds (2 minutes 20 seconds) */
    maxDurationSeconds: 140,

    /** Minimum video duration (0.5 seconds) */
    minDurationSeconds: 0.5,

    /** Maximum video file size in megabytes */
    maxFileSizeMB: 512,

    /** Maximum video resolution */
    maxResolution: {
      /** Maximum width in pixels */
      width: 1920,
      /** Maximum height in pixels */
      height: 1200,
    },

    /** Minimum video resolution */
    minResolution: {
      /** Minimum width in pixels */
      width: 32,
      /** Minimum height in pixels */
      height: 32,
    },

    /** Supported video codecs */
    supportedCodecs: ['h264', 'h265'],

    /** Maximum video bitrate in megabits per second */
    maxBitrateMbps: 25,

    /** Maximum frame rate (frames per second) */
    maxFrameRate: 60,

    /** Supported aspect ratios */
    aspectRatios: ['16:9', '1:1'],

    /** Supported video file extensions */
    supportedExtensions: ['mp4', 'mov'],
  },

  image: {
    /** Maximum image file size in megabytes */
    maxFileSizeMB: 5,

    /** Maximum image resolution */
    maxResolution: {
      /** Maximum width in pixels */
      width: 8192,
      /** Maximum height in pixels */
      height: 8192,
    },

    /** Minimum image resolution */
    minResolution: {
      /** Minimum width in pixels */
      width: 4,
      /** Minimum height in pixels */
      height: 4,
    },

    /** Supported image formats */
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],

    /** Maximum number of images per post */
    maxImagesPerPost: 4,
  },

  /** Twitter API rate limits (approximate values) */
  apiRateLimits: {
    /** Maximum requests per hour */
    requestsPerHour: 300,

    /** Maximum requests per day */
    requestsPerDay: 2400,
  },
};
