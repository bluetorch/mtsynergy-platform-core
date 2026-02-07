# SC-802 Implementation Plan: Platform-Specific Constants

_Created: 2026-02-06_
_Mode: PLAN_
_Status: Awaiting Approval_

## Overview

Detailed step-by-step implementation plan for SC-802 (Export platform-specific limits and configurations).

**Approach:** Data-driven constants library with TypeScript type safety  
**Dependency Strategy:** Zero external dependencies (pure TypeScript)  
**Validation:** Type-checked constants, comprehensive tests, integration validation  
**Timeline:** Estimate 2-3 work days

---

## Phase 1: Data Model Design & Type Definitions

### 1.1 Create Platform Configuration Types

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/types.ts`

**Purpose:** Define TypeScript interfaces for all platform-specific configuration structures

**Content:**
```typescript
/**
 * Supported social media platforms
 */
export type Platform = 
  | 'twitter' 
  | 'tiktok' 
  | 'facebook' 
  | 'instagram' 
  | 'linkedin' 
  | 'youtube';

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
  aspectRatios: string[];  // e.g., "16:9", "9:16", "1:1"
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
  brandColor: string;  // Hex color code
  iconUrl?: string;    // Optional icon reference
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
export type Timezone = string;  // IANA timezone strings
```

**Validation:**
- Run `npm run type-check` to verify type definitions compile
- No external dependencies required
- All types are exportable and reusable

---

### 1.2 Research & Document Platform-Specific Limits

**File:** `/Users/bholt/dev/mtsynergy/platform-core/docs/PLATFORM_LIMITS.md`

**Purpose:** Document research sources and platform API documentation references

**Content:**
```markdown
# Platform Limits Research

Last Updated: 2026-02-06

## Sources

### Twitter/X
- API Documentation: https://developer.twitter.com/en/docs/twitter-api
- Character Limit: 280 characters (4,000 for Premium)
- Video: Max 2:20 (140s), 512MB, 1920x1200, 16:9/1:1
- Images: Max 5MB, 8192x8192, PNG/JPG/GIF/WEBP

### TikTok
- Creator Portal: https://www.tiktok.com/creators/creator-portal/
- Caption: 2,200 characters
- Video: 10 minutes max (600s), 287.6MB, 1080x1920, 9:16
- Hashtags: 30 max

### Facebook
- Business Help Center: https://www.facebook.com/business/help
- Text: 63,206 characters
- Video: Max 240 minutes, 10GB, various aspect ratios
- Images: Max 10MB, up to 10 images per post

### Instagram
- Business Resources: https://business.instagram.com/
- Caption: 2,200 characters
- Video: 60s (Feed), 15m (IGTV), 90s (Reels)
- Images: Max 8MB, 1:1/4:5/16:9, up to 10 images

### LinkedIn
- Marketing Solutions: https://www.linkedin.com/help/linkedin
- Text: 3,000 characters
- Video: Max 10 minutes, 5GB
- Images: Max 10MB, PNG/JPG

### YouTube
- Creator Academy: https://creatoracademy.youtube.com/
- Description: 5,000 characters
- Video: 12 hours max, 256GB, various resolutions
- Thumbnails: Max 2MB, 1280x720

## Notes
- Limits are subject to change by platform providers
- Premium/Business accounts may have different limits
- Some limits vary by region or account status
```

**Validation:**
- Cross-reference with official platform documentation
- Note date of research for future updates

---

## Phase 2: Platform Configurations Implementation

### 2.1 Create Twitter Configuration

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/platforms/twitter.ts`

**Content:**
```typescript
import type { PlatformConfig } from '../types';

export const TWITTER_CONFIG: PlatformConfig = {
  platform: 'twitter',
  displayName: 'Twitter / X',
  brandColor: '#1DA1F2',
  text: {
    maxCaptionLength: 280,
    maxHashtags: 30,
    maxMentions: 50,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: true,
  },
  video: {
    maxDurationSeconds: 140,  // 2:20
    minDurationSeconds: 0.5,
    maxFileSizeMB: 512,
    maxResolution: {
      width: 1920,
      height: 1200,
    },
    minResolution: {
      width: 32,
      height: 32,
    },
    supportedCodecs: ['h264', 'h265'],
    maxBitrateMbps: 25,
    maxFrameRate: 60,
    aspectRatios: ['16:9', '1:1'],
  },
  image: {
    maxFileSizeMB: 5,
    maxResolution: {
      width: 8192,
      height: 8192,
    },
    minResolution: {
      width: 4,
      height: 4,
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxImagesPerPost: 4,
  },
  apiRateLimits: {
    requestsPerHour: 300,
    requestsPerDay: 2400,
  },
};
```

### 2.2 Create TikTok Configuration

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/platforms/tiktok.ts`

**Content:**
```typescript
import type { PlatformConfig } from '../types';

export const TIKTOK_CONFIG: PlatformConfig = {
  platform: 'tiktok',
  displayName: 'TikTok',
  brandColor: '#000000',
  text: {
    maxCaptionLength: 2200,
    maxHashtags: 30,
    maxMentions: 20,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: false,  // No clickable links in captions
  },
  video: {
    maxDurationSeconds: 600,  // 10 minutes
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
    maxImagesPerPost: 35,  // Photo carousel
  },
  apiRateLimits: {
    requestsPerHour: 100,
    requestsPerDay: 1000,
  },
};
```

### 2.3 Create Facebook Configuration

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/platforms/facebook.ts`

**Content:**
```typescript
import type { PlatformConfig } from '../types';

export const FACEBOOK_CONFIG: PlatformConfig = {
  platform: 'facebook',
  displayName: 'Facebook',
  brandColor: '#1877F2',
  text: {
    maxCaptionLength: 63206,
    maxHashtags: 30,
    maxMentions: 50,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: true,
  },
  video: {
    maxDurationSeconds: 14400,  // 240 minutes
    minDurationSeconds: 1,
    maxFileSizeMB: 10240,  // 10GB
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
```

### 2.4 Create Instagram Configuration

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/platforms/instagram.ts`

**Content:**
```typescript
import type { PlatformConfig } from '../types';

export const INSTAGRAM_CONFIG: PlatformConfig = {
  platform: 'instagram',
  displayName: 'Instagram',
  brandColor: '#E4405F',
  text: {
    maxCaptionLength: 2200,
    maxHashtags: 30,
    maxMentions: 30,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: false,  // Only in stories/bio
  },
  video: {
    maxDurationSeconds: 900,  // 15 minutes (IGTV), 60s (Feed), 90s (Reels)
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
```

### 2.5 Create LinkedIn Configuration

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/platforms/linkedin.ts`

**Content:**
```typescript
import type { PlatformConfig } from '../types';

export const LINKEDIN_CONFIG: PlatformConfig = {
  platform: 'linkedin',
  displayName: 'LinkedIn',
  brandColor: '#0A66C2',
  text: {
    maxCaptionLength: 3000,
    maxHashtags: 30,
    maxMentions: 50,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: true,
  },
  video: {
    maxDurationSeconds: 600,  // 10 minutes
    minDurationSeconds: 3,
    maxFileSizeMB: 5120,  // 5GB
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
```

### 2.6 Create YouTube Configuration

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/platforms/youtube.ts`

**Content:**
```typescript
import type { PlatformConfig } from '../types';

export const YOUTUBE_CONFIG: PlatformConfig = {
  platform: 'youtube',
  displayName: 'YouTube',
  brandColor: '#FF0000',
  text: {
    maxCaptionLength: 5000,  // Description
    maxHashtags: 15,
    maxMentions: 100,
    supportsMarkdown: false,
    supportsEmojis: true,
    supportsLinks: true,
  },
  video: {
    maxDurationSeconds: 43200,  // 12 hours
    minDurationSeconds: 1,
    maxFileSizeMB: 262144,  // 256GB
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
  },
  image: {
    maxFileSizeMB: 2,  // Thumbnail
    maxResolution: {
      width: 1280,
      height: 720,
    },
    minResolution: {
      width: 640,
      height: 360,
    },
    supportedFormats: ['jpg', 'jpeg', 'png'],
    maxImagesPerPost: 1,  // Custom thumbnail
  },
  apiRateLimits: {
    requestsPerHour: 10000,
    requestsPerDay: 1000000,  // Very high quota system
  },
};
```

**Validation:**
- All configs use `PlatformConfig` type for consistency
- Data sourced from platform API documentation (see PLATFORM_LIMITS.md)
- Each file exports one constant

---

## Phase 3: Role & Timezone Constants

### 3.1 Create Role Constants

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/roles.ts`

**Content:**
```typescript
import type { WorkspaceRole, SocialRole } from './types';

/**
 * All available workspace roles
 */
export const WORKSPACE_ROLES: readonly WorkspaceRole[] = [
  'OWNER',
  'ADMIN',
  'MEMBER',
] as const;

/**
 * All available social account roles
 */
export const SOCIAL_ROLES: readonly SocialRole[] = [
  'ADMIN',
  'MODERATOR',
  'EDITOR',
  'GUEST',
] as const;

/**
 * Role hierarchy for workspace roles (higher number = more permissions)
 */
export const WORKSPACE_ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

/**
 * Role hierarchy for social account roles (higher number = more permissions)
 */
export const SOCIAL_ROLE_HIERARCHY: Record<SocialRole, number> = {
  ADMIN: 4,
  MODERATOR: 3,
  EDITOR: 2,
  GUEST: 1,
};

/**
 * Check if a workspace role has at least the specified permission level
 */
export function hasWorkspacePermission(
  userRole: WorkspaceRole,
  requiredRole: WorkspaceRole
): boolean {
  return WORKSPACE_ROLE_HIERARCHY[userRole] >= WORKSPACE_ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a social role has at least the specified permission level
 */
export function hasSocialPermission(
  userRole: SocialRole,
  requiredRole: SocialRole
): boolean {
  return SOCIAL_ROLE_HIERARCHY[userRole] >= SOCIAL_ROLE_HIERARCHY[requiredRole];
}
```

**Validation:**
- `readonly` arrays prevent accidental mutation
- `as const` provides literal type inference
- Permission check functions use hierarchy mapping

---

### 3.2 Create Timezone Constants

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/timezones.ts`

**Content:**
```typescript
import type { Timezone } from './types';

/**
 * All IANA timezone identifiers
 * Source: IANA Time Zone Database (https://www.iana.org/time-zones)
 * Last updated: 2026-02-06
 */
export const TIMEZONES: readonly Timezone[] = [
  // Africa
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Addis_Ababa',
  'Africa/Algiers',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  
  // America - North
  'America/Anchorage',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/New_York',
  'America/Phoenix',
  'America/Toronto',
  'America/Vancouver',
  
  // America - Central & South
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Caracas',
  'America/Lima',
  'America/Mexico_City',
  'America/Santiago',
  'America/Sao_Paulo',
  
  // Asia
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Kolkata',
  'Asia/Manila',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  
  // Europe
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Dublin',
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Zurich',
  
  // Pacific
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',
  'Pacific/Sydney',
  
  // UTC
  'UTC',
] as const;

/**
 * Common timezone display names
 */
export const TIMEZONE_DISPLAY_NAMES: Record<string, string> = {
  'America/New_York': 'Eastern Time (US & Canada)',
  'America/Chicago': 'Central Time (US & Canada)',
  'America/Denver': 'Mountain Time (US & Canada)',
  'America/Los_Angeles': 'Pacific Time (US & Canada)',
  'America/Phoenix': 'Arizona',
  'America/Anchorage': 'Alaska',
  'Pacific/Honolulu': 'Hawaii',
  'Europe/London': 'London',
  'Europe/Paris': 'Paris',
  'Europe/Berlin': 'Berlin',
  'Asia/Tokyo': 'Tokyo',
  'Asia/Shanghai': 'Beijing, Shanghai',
  'Asia/Singapore': 'Singapore',
  'Asia/Dubai': 'Dubai',
  'Australia/Sydney': 'Sydney',
  'UTC': 'Coordinated Universal Time',
};

/**
 * Check if a string is a valid IANA timezone
 */
export function isValidTimezone(tz: string): tz is Timezone {
  return TIMEZONES.includes(tz as Timezone);
}
```

**Notes:**
- Full IANA timezone list is very long (~600 entries)
- This includes most commonly used timezones
- Can be expanded as needed
- Provides both identifier list and display name mapping

---

## Phase 4: Aggregation & Exports

### 4.1 Create Platform Configs Index

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/platforms/index.ts`

**Content:**
```typescript
import type { Platform, PlatformConfig } from '../types';
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
 * Get configuration for a specific platform
 */
export function getPlatformConfig(platform: Platform): PlatformConfig {
  return PLATFORM_CONFIGS[platform];
}

/**
 * Get configurations for multiple platforms
 */
export function getPlatformConfigs(platforms: Platform[]): PlatformConfig[] {
  return platforms.map(p => PLATFORM_CONFIGS[p]);
}

// Re-export individual configs
export { TWITTER_CONFIG } from './twitter';
export { TIKTOK_CONFIG } from './tiktok';
export { FACEBOOK_CONFIG } from './facebook';
export { INSTAGRAM_CONFIG } from './instagram';
export { LINKEDIN_CONFIG } from './linkedin';
export { YOUTUBE_CONFIG } from './youtube';
```

---

### 4.2 Create Main Constants Index

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/index.ts`

**Purpose:** Main entry point for all constants

**Content:**
```typescript
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
export {
  TIMEZONES,
  TIMEZONE_DISPLAY_NAMES,
  isValidTimezone,
} from './timezones';
```

**Validation:**
- All types exported
- All constants exported
- All utility functions exported
- Single import entry point for consumers

---

## Phase 5: Testing & Validation

### 5.1 Create Constants Type Tests

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/__tests__/constants-types.test.ts`

**Purpose:** Validate constant structure and type safety

**Content:**
```typescript
import { describe, it, expect } from 'vitest';
import type { PlatformConfig, Platform } from '../constants/types';
import {
  PLATFORM_CONFIGS,
  ALL_PLATFORMS,
  getPlatformConfig,
} from '../constants';

describe('Constants - Type Safety', () => {
  it('should have config for every platform', () => {
    ALL_PLATFORMS.forEach(platform => {
      expect(PLATFORM_CONFIGS[platform]).toBeDefined();
      expect(PLATFORM_CONFIGS[platform].platform).toBe(platform);
    });
  });

  it('should have correct platform count', () => {
    expect(ALL_PLATFORMS).toHaveLength(6);
    expect(Object.keys(PLATFORM_CONFIGS)).toHaveLength(6);
  });

  it('should have valid platform config structure', () => {
    const platforms: Platform[] = ['twitter', 'tiktok', 'facebook', 'instagram', 'linkedin', 'youtube'];
    
    platforms.forEach(platform => {
      const config = PLATFORM_CONFIGS[platform];
      
      // Basic properties
      expect(config.platform).toBe(platform);
      expect(config.displayName).toBeTruthy();
      expect(config.brandColor).toMatch(/^#[0-9A-F]{6}$/i);
      
      // Text requirements
      expect(config.text.maxCaptionLength).toBeGreaterThan(0);
      expect(config.text.maxHashtags).toBeGreaterThan(0);
      expect(typeof config.text.supportsEmojis).toBe('boolean');
      
      // Video requirements
      expect(config.video.maxDurationSeconds).toBeGreaterThan(0);
      expect(config.video.maxFileSizeMB).toBeGreaterThan(0);
      expect(config.video.supportedCodecs.length).toBeGreaterThan(0);
      expect(config.video.maxResolution.width).toBeGreaterThan(0);
      expect(config.video.maxResolution.height).toBeGreaterThan(0);
      
      // Image requirements
      expect(config.image.maxFileSizeMB).toBeGreaterThan(0);
      expect(config.image.supportedFormats.length).toBeGreaterThan(0);
      expect(config.image.maxImagesPerPost).toBeGreaterThan(0);
    });
  });

  it('should return correct config from getPlatformConfig', () => {
    const twitterConfig = getPlatformConfig('twitter');
    expect(twitterConfig.platform).toBe('twitter');
    expect(twitterConfig.displayName).toBe('Twitter / X');
  });
});
```

---

### 5.2 Create Platform Limits Tests

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/__tests__/platform-limits.test.ts`

**Purpose:** Validate platform-specific limits match specifications

**Content:**
```typescript
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
```

---

### 5.3 Create Role Tests

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/__tests__/roles.test.ts`

**Purpose:** Validate role constants and permission checks

**Content:**
```typescript
import { describe, it, expect } from 'vitest';
import {
  WORKSPACE_ROLES,
  SOCIAL_ROLES,
  hasWorkspacePermission,
  hasSocialPermission,
} from '../constants';

describe('Workspace Roles', () => {
  it('should have all workspace roles', () => {
    expect(WORKSPACE_ROLES).toEqual(['OWNER', 'ADMIN', 'MEMBER']);
  });

  it('should check workspace permissions correctly', () => {
    // OWNER has all permissions
    expect(hasWorkspacePermission('OWNER', 'OWNER')).toBe(true);
    expect(hasWorkspacePermission('OWNER', 'ADMIN')).toBe(true);
    expect(hasWorkspacePermission('OWNER', 'MEMBER')).toBe(true);
    
    // ADMIN has admin and member permissions
    expect(hasWorkspacePermission('ADMIN', 'OWNER')).toBe(false);
    expect(hasWorkspacePermission('ADMIN', 'ADMIN')).toBe(true);
    expect(hasWorkspacePermission('ADMIN', 'MEMBER')).toBe(true);
    
    // MEMBER has only member permissions
    expect(hasWorkspacePermission('MEMBER', 'OWNER')).toBe(false);
    expect(hasWorkspacePermission('MEMBER', 'ADMIN')).toBe(false);
    expect(hasWorkspacePermission('MEMBER', 'MEMBER')).toBe(true);
  });
});

describe('Social Roles', () => {
  it('should have all social roles', () => {
    expect(SOCIAL_ROLES).toEqual(['ADMIN', 'MODERATOR', 'EDITOR', 'GUEST']);
  });

  it('should check social permissions correctly', () => {
    // ADMIN has all permissions
    expect(hasSocialPermission('ADMIN', 'ADMIN')).toBe(true);
    expect(hasSocialPermission('ADMIN', 'GUEST')).toBe(true);
    
    // EDITOR cannot do moderator actions
    expect(hasSocialPermission('EDITOR', 'MODERATOR')).toBe(false);
    expect(hasSocialPermission('EDITOR', 'EDITOR')).toBe(true);
    expect(hasSocialPermission('EDITOR', 'GUEST')).toBe(true);
    
    // GUEST has minimal permissions
    expect(hasSocialPermission('GUEST', 'ADMIN')).toBe(false);
    expect(hasSocialPermission('GUEST', 'GUEST')).toBe(true);
  });
});
```

---

### 5.4 Create Timezone Tests

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/__tests__/timezones.test.ts`

**Purpose:** Validate timezone constants

**Content:**
```typescript
import { describe, it, expect } from 'vitest';
import {
  TIMEZONES,
  TIMEZONE_DISPLAY_NAMES,
  isValidTimezone,
} from '../constants';

describe('Timezones', () => {
  it('should have UTC timezone', () => {
    expect(TIMEZONES).toContain('UTC');
  });

  it('should have common US timezones', () => {
    expect(TIMEZONES).toContain('America/New_York');
    expect(TIMEZONES).toContain('America/Chicago');
    expect(TIMEZONES).toContain('America/Denver');
    expect(TIMEZONES).toContain('America/Los_Angeles');
  });

  it('should have common European timezones', () => {
    expect(TIMEZONES).toContain('Europe/London');
    expect(TIMEZONES).toContain('Europe/Paris');
    expect(TIMEZONES).toContain('Europe/Berlin');
  });

  it('should have common Asian timezones', () => {
    expect(TIMEZONES).toContain('Asia/Tokyo');
    expect(TIMEZONES).toContain('Asia/Singapore');
    expect(TIMEZONES).toContain('Asia/Shanghai');
  });

  it('should validate timezones correctly', () => {
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Invalid/Timezone')).toBe(false);
  });

  it('should have display names for common timezones', () => {
    expect(TIMEZONE_DISPLAY_NAMES['America/New_York']).toBe('Eastern Time (US & Canada)');
    expect(TIMEZONE_DISPLAY_NAMES['Europe/London']).toBe('London');
    expect(TIMEZONE_DISPLAY_NAMES['UTC']).toBe('Coordinated Universal Time');
  });

  it('should have readonly array', () => {
    // TypeScript compile-time check - arrays are readonly
    // @ts-expect-error - Cannot push to readonly array
    expect(() => TIMEZONES.push('Invalid' as any)).toThrow();
  });
});
```

---

### 5.5 Create Integration Tests

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/__tests__/constants-integration.test.ts`

**Purpose:** Test real-world usage scenarios

**Content:**
```typescript
import { describe, it, expect } from 'vitest';
import {
  PLATFORM_CONFIGS,
  getPlatformConfig,
  getPlatformConfigs,
  hasWorkspacePermission,
  isValidTimezone,
  type Platform,
} from '../constants';

describe('Constants Integration', () => {
  it('should validate caption length across platforms', () => {
    const caption = 'A'.repeat(300);
    
    // Twitter: max 280
    expect(caption.length <= PLATFORM_CONFIGS.twitter.text.maxCaptionLength).toBe(false);
    
    // Instagram: max 2200
    expect(caption.length <= PLATFORM_CONFIGS.instagram.text.maxCaptionLength).toBe(true);
  });

  it('should check video requirements for multi-platform post', () => {
    const videoDuration = 90; // 1:30 seconds
    const platforms: Platform[] = ['twitter', 'instagram', 'tiktok'];
    
    const configs = getPlatformConfigs(platforms);
    
    configs.forEach(config => {
      const isValid = videoDuration <= config.video.maxDurationSeconds;
      
      // All three should support 90s video
      expect(isValid).toBe(true);
    });
  });

  it('should validate permissions for workspace actions', () => {
    // Only OWNER or ADMIN can delete workspace
    expect(hasWorkspacePermission('OWNER', 'ADMIN')).toBe(true);
    expect(hasWorkspacePermission('ADMIN', 'ADMIN')).toBe(true);
    expect(hasWorkspacePermission('MEMBER', 'ADMIN')).toBe(false);
  });

  it('should support timezone selection', () => {
    const userSelectedTimezone = 'America/New_York';
    
    expect(isValidTimezone(userSelectedTimezone)).toBe(true);
    
    // Invalid timezone
    expect(isValidTimezone('Not/A/Timezone')).toBe(false);
  });

  it('should get platform configs dynamically', () => {
    const platforms: Platform[] = ['twitter', 'facebook'];
    const configs = getPlatformConfigs(platforms);
    
    expect(configs).toHaveLength(2);
    expect(configs[0].platform).toBe('twitter');
    expect(configs[1].platform).toBe('facebook');
  });
});
```

---

### 5.6 Update Package Exports

**File:** `/Users/bholt/dev/mtsynergy/platform-core/package.json`

**Update exports field:**
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.mjs",
      "require": "./dist/types/index.cjs"
    },
    "./constants": {
      "types": "./dist/constants/index.d.ts",
      "import": "./dist/constants/index.mjs",
      "require": "./dist/constants/index.cjs"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.cjs"
    }
  }
}
```

**Validation:**
- Consumers can import from `@mtsynergy/platform-core/constants`
- TypeScript declarations exported correctly
- ESM and CJS both supported

---

## Phase 6: Documentation & Review

### 6.1 Update DEVELOPMENT.md

**File:** `/Users/bholt/dev/mtsynergy/platform-core/DEVELOPMENT.md`

**Add section:** "SC-802: Platform Constants"

**Content:**
```markdown
## SC-802: Platform Constants

### Overview

Platform-specific configuration constants for all supported social media platforms.

### File Structure

```
src/constants/
  ├── types.ts              # TypeScript type definitions
  ├── index.ts              # Main export file
  ├── roles.ts              # Workspace and social roles
  ├── timezones.ts          # IANA timezone identifiers
  └── platforms/
      ├── index.ts          # Platform configs aggregation
      ├── twitter.ts        # Twitter configuration
      ├── tiktok.ts         # TikTok configuration
      ├── facebook.ts       # Facebook configuration
      ├── instagram.ts      # Instagram configuration
      ├── linkedin.ts       # LinkedIn configuration
      └── youtube.ts        # YouTube configuration
```

### Usage Examples

#### Import platform configs
```typescript
import { PLATFORM_CONFIGS, getPlatformConfig } from '@mtsynergy/platform-core/constants';

const twitterConfig = getPlatformConfig('twitter');
console.log(twitterConfig.text.maxCaptionLength); // 280
```

#### Validate caption length
```typescript
import { PLATFORM_CONFIGS } from '@mtsynergy/platform-core/constants';

function validateCaption(text: string, platform: Platform): boolean {
  const maxLength = PLATFORM_CONFIGS[platform].text.maxCaptionLength;
  return text.length <= maxLength;
}
```

#### Check workspace permissions
```typescript
import { hasWorkspacePermission } from '@mtsynergy/platform-core/constants';

const canDelete = hasWorkspacePermission(userRole, 'ADMIN');
```

### Data Sources

All platform limits are sourced from official API documentation. See [docs/PLATFORM_LIMITS.md](../docs/PLATFORM_LIMITS.md) for references and last updated dates.

### Maintenance

Platform limits may change. To update:

1. Check official platform documentation
2. Update relevant config file in `src/constants/platforms/`
3. Update `docs/PLATFORM_LIMITS.md` with new limits and date
4. Run tests: `npm run test`
5. Bump version appropriately (patch for limit updates)
```

---

### 6.2 Create README for Constants

**File:** `/Users/bholt/dev/mtsynergy/platform-core/src/constants/README.md`

**Content:**
```markdown
# Platform Constants

TypeScript constants for platform-specific configurations, roles, and timezones.

## Platform Configurations

Each platform has configuration for:
- **Text requirements**: Max caption length, hashtags, mentions
- **Video requirements**: Duration, file size, resolution, codecs, bitrate
- **Image requirements**: File size, resolution, formats, max images
- **API rate limits**: Requests per hour/day

### Supported Platforms
- Twitter / X
- TikTok
- Facebook
- Instagram
- LinkedIn
- YouTube

## Roles

### Workspace Roles
- `OWNER`: Full control
- `ADMIN`: Administrative permissions
- `MEMBER`: Basic access

### Social Account Roles
- `ADMIN`: Full account control
- `MODERATOR`: Moderation permissions
- `EDITOR`: Content editing
- `GUEST`: Read-only access

## Timezones

IANA timezone identifiers for scheduling and date formatting.

## Type Safety

All constants are fully typed with TypeScript for compile-time safety.

```typescript
import type { Platform, PlatformConfig } from '@mtsynergy/platform-core/constants';

const platform: Platform = 'twitter';
const config: PlatformConfig = PLATFORM_CONFIGS[platform];
```
```

---

### 6.3 Run Full Test Suite

**Command:**
```bash
npm run test -- src/__tests__/constants*.test.ts src/__tests__/platform*.test.ts src/__tests__/roles.test.ts src/__tests__/timezones.test.ts
```

**Expected Output:**
- All platform config tests passing
- All role permission tests passing
- All timezone validation tests passing
- Integration tests passing
- Coverage for `src/constants/**` at 100%

---

### 6.4 Type Check Validation

**Command:**
```bash
npm run type-check
```

**Expected Output:**
- No TypeScript errors
- All types resolve correctly
- Readonly arrays enforced

---

### 6.5 Build Validation

**Command:**
```bash
npm run build
```

**Expected Output:**
```
dist/
  ├── constants/
  │   ├── index.d.ts
  │   ├── index.mjs
  │   └── index.cjs
  ├── index.d.ts
  ├── index.mjs
  └── index.cjs
```

**Verify exports:**
```bash
node -e "const { PLATFORM_CONFIGS } = require('./dist/constants/index.cjs'); console.log(Object.keys(PLATFORM_CONFIGS));"
# Should output: [ 'twitter', 'tiktok', 'facebook', 'instagram', 'linkedin', 'youtube' ]
```

---

## Phase 7: Final Validation & Sign-off

### 7.1 Manual Testing Checklist

- [ ] Import `@mtsynergy/platform-core/constants` from ESM context
- [ ] Import `@mtsynergy/platform-core/constants` from CJS context
- [ ] Verify autocomplete works for `PLATFORM_CONFIGS.`
- [ ] Verify type inference for `getPlatformConfig('twitter')`
- [ ] Verify readonly arrays prevent mutation
- [ ] Verify permission check functions work correctly
- [ ] Verify timezone validation function works

### 7.2 Code Review Checklist

- [ ] All files follow consistent naming convention
- [ ] All exports are documented with JSDoc
- [ ] No hardcoded values duplicated across files
- [ ] All configurations use TypeScript types
- [ ] Test coverage >= 95% for constants module
- [ ] No external dependencies added
- [ ] All files have proper copyright headers (if required)

### 7.3 Documentation Review

- [ ] DEVELOPMENT.md updated with SC-802 section
- [ ] README.md created in src/constants/
- [ ] PLATFORM_LIMITS.md created with research sources
- [ ] All exported functions have JSDoc comments
- [ ] Usage examples provided

---

## Success Criteria

✅ **6 platform configs** created (Twitter, TikTok, Facebook, Instagram, LinkedIn, YouTube)  
✅ **Role constants** exported (workspace + social roles with permission checks)  
✅ **Timezone constants** exported (IANA timezone list + validation)  
✅ **Type safety** enforced (all configs use TypeScript types)  
✅ **Test coverage** >= 95% for constants module  
✅ **Zero dependencies** (pure TypeScript constants)  
✅ **Build output** includes ESM + CJS for `./constants` export  
✅ **Documentation** complete (DEVELOPMENT.md, inline JSDoc, README)

---

## Estimated Timeline

- **Phase 1** (Types): 2 hours
- **Phase 2** (Platform Configs): 4 hours
- **Phase 3** (Roles & Timezones): 2 hours
- **Phase 4** (Aggregation): 1 hour
- **Phase 5** (Testing): 4 hours
- **Phase 6** (Documentation): 2 hours
- **Phase 7** (Validation): 1 hour

**Total:** ~16 hours (2 work days)

---

## Dependencies

**Blocked by:** SC-801 (must be complete for build system to work)  
**Blocks:** SC-803 (validators will use these constants)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Platform limits change | Medium | Low | Document update process, version appropriately |
| Missing platforms | Low | Medium | Can add new platforms incrementally |
| Timezone list incomplete | Low | Low | Start with common timezones, expand as needed |
| Bundle size concerns | Low | Low | Tree-shaking ensures only imported configs bundled |

---

## Notes

- Platform limits should be reviewed quarterly against official docs
- Consider adding platform changelog tracking for limit updates
- Future enhancement: Add validation utilities that use these constants (SC-803)
- Consider adding platform icon URLs in future iteration
