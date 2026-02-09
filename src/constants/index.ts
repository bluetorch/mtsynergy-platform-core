/**
 * Platform Constants Module
 *
 * Provides platform-specific configurations, role definitions, and timezone data
 * for all supported social media platforms.
 *
 * Includes:
 * - Platform configurations (text/video/image limits)
 * - Workspace and social account roles
 * - IANA timezone identifiers
 * - Helper functions for retrieving platform configs
 *
 * @packageDocumentation
 */

// Types
export type {
  Platform,
  VideoCodec,
  ImageFormat,
  VideoRequirements,
  ImageRequirements,
  TextRequirements,
  PlatformConfig,
  WorkspaceRole,
  SocialRole,
  Timezone,
} from './types';

// Platform configurations
export {
  PLATFORM_CONFIGS,
  ALL_PLATFORMS,
  VIDEO_REQUIREMENTS,
  getPlatformConfig,
  getPlatformConfigs,
  TWITTER_CONFIG,
  TIKTOK_CONFIG,
  FACEBOOK_CONFIG,
  INSTAGRAM_CONFIG,
  LINKEDIN_CONFIG,
  YOUTUBE_CONFIG,
} from './platforms';

// Roles
export {
  WORKSPACE_ROLES,
  SOCIAL_ROLES,
  WORKSPACE_ROLE_HIERARCHY,
  SOCIAL_ROLE_HIERARCHY,
  hasWorkspacePermission,
  hasSocialPermission,
} from './roles';

// Timezones
export { TIMEZONES, TIMEZONE_DISPLAY_NAMES, isValidTimezone } from './timezones';
