import type { PlatformConfig } from '../types';

/**
 * Instagram platform configuration
 *
 * Complete specifications for Instagram posting requirements including text,
 * video, and image constraints based on Instagram Business documentation.
 *
 * Note: Video duration limits vary by format - 60s for Feed, 90s for Reels, 15min for IGTV.
 *
 * @see {@link https://business.instagram.com/|Instagram Business Resources}
 * @see {@link ../../../docs/PLATFORM_LIMITS.md|Platform Limits Research}
 *
 * @example
 * ```typescript
 * import { INSTAGRAM_CONFIG } from '@mtsynergy/platform-core/constants';
 *
 * const maxLength = INSTAGRAM_CONFIG.text.maxCaptionLength; // 2200
 * const maxImages = INSTAGRAM_CONFIG.image.maxImagesPerPost; // 10
 * ```
 *
 * @public
 */
export const INSTAGRAM_CONFIG: PlatformConfig = {
  /** Platform identifier */
  platform: 'instagram',

  /** Display name for UI */
  displayName: 'Instagram',

  /** Instagram brand color (hex) */
  brandColor: '#E4405F',
  text: {
    /** Maximum caption length in characters */
    maxCaptionLength: 2200,

    /** Maximum hashtags allowed per post (up to 30 recommended) */
    maxHashtags: 30,

    /** Maximum @mentions allowed per post */
    maxMentions: 30,

    /** Markdown formatting not supported */
    supportsMarkdown: false,

    /** Emoji support enabled */
    supportsEmojis: true,

    /** Clickable links only supported in stories and bio, not in post captions */
    supportsLinks: false,
  },
  video: {
    maxDurationSeconds: 900, // 15 minutes (IGTV), 60s (Feed), 90s (Reels)
    minDurationSeconds: 3,
    maxFileSizeMB: 100,
    maxResolution: {
      width: 1920,
      height: 1920,
    },
    minResolution: {
      width: 600,
      height: 600,
    },
    supportedCodecs: ['h264'],
    maxBitrateMbps: 5,
    maxFrameRate: 30,
    aspectRatios: ['1:1', '4:5', '16:9', '9:16'],
    supportedExtensions: ['mp4', 'mov'],
  },
  image: {
    maxFileSizeMB: 8,
    maxResolution: {
      width: 1080,
      height: 1350,
    },
    minResolution: {
      width: 320,
      height: 320,
    },
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxImagesPerPost: 10,
  },
  apiRateLimits: {
    requestsPerHour: 200,
    requestsPerDay: 4800,
  },
};
