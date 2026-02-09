import type { PlatformConfig } from '../types';

/**
 * Facebook platform configuration
 *
 * Complete specifications for Facebook posting requirements including text,
 * video, and image constraints based on Facebook Business documentation.
 *
 * @see {@link https://www.facebook.com/business/help|Facebook Business Help Center}
 * @see {@link ../../../docs/PLATFORM_LIMITS.md|Platform Limits Research}
 *
 * @example
 * ```typescript
 * import { FACEBOOK_CONFIG } from '@mtsynergy/platform-core/constants';
 *
 * const maxLength = FACEBOOK_CONFIG.text.maxCaptionLength; // 63206
 * const maxVideo = FACEBOOK_CONFIG.video.maxDurationSeconds; // 14400 (240 min)
 * ```
 *
 * @public
 */
export const FACEBOOK_CONFIG: PlatformConfig = {
  /** Platform identifier */
  platform: 'facebook',

  /** Display name for UI */
  displayName: 'Facebook',

  /** Facebook brand color (hex) */
  brandColor: '#1877F2',
  text: {
    /** Maximum caption length in characters (exceptionally high limit) */
    maxCaptionLength: 63206,

    /** Maximum hashtags allowed per post */
    maxHashtags: 30,

    /** Maximum @mentions allowed per post */
    maxMentions: 50,

    /** Markdown formatting not supported */
    supportsMarkdown: false,

    /** Emoji support enabled */
    supportsEmojis: true,

    /** URL links supported and auto-previewed */
    supportsLinks: true,
  },
  video: {
    maxDurationSeconds: 14400, // 240 minutes
    minDurationSeconds: 1,
    maxFileSizeMB: 10240, // 10GB
    maxResolution: {
      width: 4096,
      height: 4096,
    },
    minResolution: {
      width: 120,
      height: 120,
    },
    supportedCodecs: ['h264', 'vp9'],
    maxBitrateMbps: 8,
    maxFrameRate: 60,
    aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
    supportedExtensions: ['mp4', 'mov'],
  },
  image: {
    maxFileSizeMB: 10,
    maxResolution: {
      width: 8192,
      height: 8192,
    },
    minResolution: {
      width: 200,
      height: 200,
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif'],
    maxImagesPerPost: 10,
  },
  apiRateLimits: {
    requestsPerHour: 200,
    requestsPerDay: 4800,
  },
};
