import type { Platform, PlatformConfig, VideoRequirements } from '../types';
import { TWITTER_CONFIG } from './twitter';
import { TIKTOK_CONFIG } from './tiktok';
import { FACEBOOK_CONFIG } from './facebook';
import { INSTAGRAM_CONFIG } from './instagram';
import { LINKEDIN_CONFIG } from './linkedin';
import { YOUTUBE_CONFIG } from './youtube';

/**
 * All platform configurations mapped by platform identifier
 */
export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: TWITTER_CONFIG,
  tiktok: TIKTOK_CONFIG,
  facebook: FACEBOOK_CONFIG,
  instagram: INSTAGRAM_CONFIG,
  linkedin: LINKEDIN_CONFIG,
  youtube: YOUTUBE_CONFIG,
};

/**
 * Array of all platforms
 */
export const ALL_PLATFORMS: readonly Platform[] = [
  'twitter',
  'tiktok',
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
] as const;

/**
 * Aggregate video requirements across all platforms
 * Uses the most restrictive limits to ensure compatibility
 */
export const VIDEO_REQUIREMENTS: VideoRequirements = {
  maxDurationSeconds: 600, // 10 minutes (TikTok/LinkedIn limit)
  minDurationSeconds: 1,
  maxFileSizeMB: 200, // Conservative limit for most platforms
  maxResolution: {
    width: 1920,
    height: 1080,
  },
  minResolution: {
    width: 640,
    height: 480,
  },
  supportedCodecs: ['h264', 'h265'],
  maxBitrateMbps: 10,
  maxFrameRate: 60,
  aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
  supportedExtensions: ['mp4', 'mov', 'webm'],
};

/**
 * Get configuration for a specific platform
 *
 * Retrieves the complete configuration object for a given platform,
 * including text, video, image requirements, and API rate limits.
 *
 * @param platform - The platform identifier
 * @returns Complete platform configuration object
 *
 * @example
 * ```typescript
 * import { getPlatformConfig } from '@mtsynergy/platform-core/constants';
 *
 * const config = getPlatformConfig('twitter');
 * console.log(config.text.maxCaptionLength); // 280
 * console.log(config.video.maxDurationSeconds); // 140
 * ```
 *
 * @public
 */
export function getPlatformConfig(platform: Platform): PlatformConfig {
  return PLATFORM_CONFIGS[platform];
}

/**
 * Get configurations for multiple platforms
 *
 * Retrieves an array of platform configurations for the specified platforms.
 * Useful for finding the most restrictive limits across multiple platforms.
 *
 * @param platforms - Array of platform identifiers
 * @returns Array of platform configurations in the same order as input
 *
 * @example
 * ```typescript
 * import { getPlatformConfigs } from '@mtsynergy/platform-core/constants';
 *
 * const configs = getPlatformConfigs(['twitter', 'instagram', 'tiktok']);
 * const minCaptionLimit = Math.min(...configs.map(c => c.text.maxCaptionLength));
 * console.log(minCaptionLimit); // 280 (Twitter's limit)
 *
 * // Find most restrictive video duration
 * const maxVideoDuration = Math.min(...configs.map(c => c.video.maxDurationSeconds));
 * ```
 *
 * @public
 */
export function getPlatformConfigs(platforms: Platform[]): PlatformConfig[] {
  return platforms.map((p) => PLATFORM_CONFIGS[p]);
}

// Re-export individual configs
export { TWITTER_CONFIG } from './twitter';
export { TIKTOK_CONFIG } from './tiktok';
export { FACEBOOK_CONFIG } from './facebook';
export { INSTAGRAM_CONFIG } from './instagram';
export { LINKEDIN_CONFIG } from './linkedin';
export { YOUTUBE_CONFIG } from './youtube';
