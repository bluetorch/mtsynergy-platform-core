/**
 * Supported social media platforms
 */
export type Platform = 'twitter' | 'tiktok' | 'facebook' | 'instagram' | 'linkedin' | 'youtube';

/**
 * Video codec types
 */
export type VideoCodec = 'h264' | 'h265' | 'vp9' | 'av1';

/**
 * Image format types
 */
export type ImageFormat = 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'heic';

/**
 * Video requirements for a platform
 */
export interface VideoRequirements {
  maxDurationSeconds: number;
  minDurationSeconds: number;
  maxFileSizeMB: number;
  maxResolution: {
    width: number;
    height: number;
  };
  minResolution: {
    width: number;
    height: number;
  };
  supportedCodecs: VideoCodec[];
  maxBitrateMbps: number;
  maxFrameRate: number;
  aspectRatios: string[]; // e.g., "16:9", "9:16", "1:1"
  supportedExtensions: string[]; // e.g., "mp4", "mov", "webm"
}

/**
 * Image requirements for a platform
 */
export interface ImageRequirements {
  maxFileSizeMB: number;
  maxResolution: {
    width: number;
    height: number;
  };
  minResolution: {
    width: number;
    height: number;
  };
  supportedFormats: ImageFormat[];
  maxImagesPerPost: number;
}

/**
 * Text/caption requirements for a platform
 */
export interface TextRequirements {
  maxCaptionLength: number;
  maxHashtags: number;
  maxMentions: number;
  supportsMarkdown: boolean;
  supportsEmojis: boolean;
  supportsLinks: boolean;
}

/**
 * Complete platform configuration
 */
export interface PlatformConfig {
  platform: Platform;
  displayName: string;
  brandColor: string; // Hex color code
  iconUrl?: string; // Optional icon reference
  text: TextRequirements;
  video: VideoRequirements;
  image: ImageRequirements;
  apiRateLimits?: {
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

/**
 * Workspace role types
 */
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

/**
 * Social account role types
 */
export type SocialRole = 'ADMIN' | 'MODERATOR' | 'EDITOR' | 'GUEST';

/**
 * IANA timezone identifier
 */
export type Timezone = string; // IANA timezone strings
