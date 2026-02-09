import type { PlatformConfig } from '../types';

/**
 * YouTube platform configuration
 *
 * Complete specifications for YouTube video upload requirements including description,
 * video processing, and thumbnail constraints based on YouTube Creator Academy documentation.
 *
 * Note: YouTube has extremely high limits compared to other platforms (256GB, 12 hours).
 *
 * @see {@link https://creatoracademy.youtube.com/|YouTube Creator Academy}
 * @see {@link ../../../docs/PLATFORM_LIMITS.md|Platform Limits Research}
 *
 * @example
 * ```typescript
 * import { YOUTUBE_CONFIG } from '@mtsynergy/platform-core/constants';
 *
 * const maxDescription = YOUTUBE_CONFIG.text.maxCaptionLength; // 5000
 * const maxDuration = YOUTUBE_CONFIG.video.maxDurationSeconds; // 43200 (12 hours)
 * ```
 *
 * @public
 */
export const YOUTUBE_CONFIG: PlatformConfig = {
  /** Platform identifier */
  platform: 'youtube',

  /** Display name for UI */
  displayName: 'YouTube',

  /** YouTube brand color (hex) */
  brandColor: '#FF0000',
  text: {
    /** Maximum video description length in characters */
    maxCaptionLength: 5000,

    /** Maximum hashtags allowed in description (recommended: 2-3 for discoverability) */
    maxHashtags: 15,

    /** Maximum @channel mentions allowed in description */
    maxMentions: 100,

    /** Markdown formatting not supported (limited text formatting via timestamps) */
    supportsMarkdown: false,

    /** Emoji support enabled */
    supportsEmojis: true,

    /** URL links supported in description (auto-linked with timestamps) */
    supportsLinks: true,
  },
  video: {
    maxDurationSeconds: 43200, // 12 hours
    minDurationSeconds: 1,
    maxFileSizeMB: 262144, // 256GB
    maxResolution: {
      width: 7680,
      height: 4320,
    },
    minResolution: {
      width: 426,
      height: 240,
    },
    supportedCodecs: ['h264', 'h265', 'vp9', 'av1'],
    maxBitrateMbps: 85,
    maxFrameRate: 60,
    aspectRatios: ['16:9', '9:16', '1:1', '4:3'],
    supportedExtensions: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
  },
  image: {
    maxFileSizeMB: 2, // Thumbnail
    maxResolution: {
      width: 1280,
      height: 720,
    },
    minResolution: {
      width: 640,
      height: 360,
    },
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxImagesPerPost: 1, // Custom thumbnail
  },
  apiRateLimits: {
    requestsPerHour: 10000,
    requestsPerDay: 1000000, // Very high quota system
  },
};
