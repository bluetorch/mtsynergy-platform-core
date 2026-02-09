import type { PlatformConfig } from '../types';

/**
 * LinkedIn platform configuration
 *
 * Complete specifications for LinkedIn posting requirements including text,
 * video, and image constraints based on LinkedIn Marketing Solutions documentation.
 *
 * @see {@link https://www.linkedin.com/help/linkedin|LinkedIn Help Center}
 * @see {@link ../../../docs/PLATFORM_LIMITS.md|Platform Limits Research}
 *
 * @example
 * ```typescript
 * import { LINKEDIN_CONFIG } from '@mtsynergy/platform-core/constants';
 *
 * const maxLength = LINKEDIN_CONFIG.text.maxCaptionLength; // 3000
 * const maxImages = LINKEDIN_CONFIG.image.maxImagesPerPost; // 9
 * ```
 *
 * @public
 */
export const LINKEDIN_CONFIG: PlatformConfig = {
  /** Platform identifier */
  platform: 'linkedin',

  /** Display name for UI */
  displayName: 'LinkedIn',

  /** LinkedIn brand color (hex) */
  brandColor: '#0A66C2',
  text: {
    /** Maximum post text length in characters */
    maxCaptionLength: 3000,

    /** Maximum hashtags allowed per post (recommended: 3-5 for best engagement) */
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
    maxDurationSeconds: 600, // 10 minutes
    minDurationSeconds: 3,
    maxFileSizeMB: 5120, // 5GB
    maxResolution: {
      width: 4096,
      height: 2304,
    },
    minResolution: {
      width: 256,
      height: 144,
    },
    supportedCodecs: ['h264'],
    maxBitrateMbps: 10,
    maxFrameRate: 60,
    aspectRatios: ['16:9', '1:1', '9:16'],
    supportedExtensions: ['mp4', 'mov', 'avi'],
  },
  image: {
    maxFileSizeMB: 10,
    maxResolution: {
      width: 7680,
      height: 4320,
    },
    minResolution: {
      width: 200,
      height: 200,
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif'],
    maxImagesPerPost: 9,
  },
  apiRateLimits: {
    requestsPerHour: 100,
    requestsPerDay: 2000,
  },
};
