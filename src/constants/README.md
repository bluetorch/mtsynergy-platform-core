# Platform Constants

TypeScript constants for platform-specific configurations, roles, and timezones.

## Overview

This module provides strongly-typed constants for all supported social media platforms, workspace and social roles, and IANA timezone identifiers.

## Platform Configurations

Each platform has configuration for:

- **Text requirements**: Max caption length, hashtags, mentions, markdown/emoji/link support
- **Video requirements**: Duration limits, file size, resolution, codecs, bitrate, aspect ratios
- **Image requirements**: File size, resolution, supported formats, max images per post
- **API rate limits**: Requests per hour/day (approximate)

### Supported Platforms

- **Twitter / X**: 280 char limit, 4 images, 2:20 video
- **TikTok**: 2,200 char limit, 35 images, 10 min video
- **Facebook**: 63,206 char limit, 10 images, 240 min video
- **Instagram**: 2,200 char limit, 10 images, 15 min video
- **LinkedIn**: 3,000 char limit, 9 images, 10 min video
- **YouTube**: 5,000 char limit, 1 thumbnail, 12 hour video

## Usage Examples

### Import platform configs

```typescript
import { PLATFORM_CONFIGS, getPlatformConfig } from '@mtsynergy/platform-core/constants';

const twitterConfig = getPlatformConfig('twitter');
console.log(twitterConfig.text.maxCaptionLength); // 280
```

### Validate caption length

```typescript
import { PLATFORM_CONFIGS, type Platform } from '@mtsynergy/platform-core/constants';

function validateCaption(text: string, platform: Platform): boolean {
  const maxLength = PLATFORM_CONFIGS[platform].text.maxCaptionLength;
  return text.length <= maxLength;
}
```

### Check video requirements

```typescript
import { getPlatformConfig } from '@mtsynergy/platform-core/constants';

const config = getPlatformConfig('instagram');
const isValidDuration = videoDuration <= config.video.maxDurationSeconds;
const isValidSize = fileSizeMB <= config.video.maxFileSizeMB;
const isCodecSupported = config.video.supportedCodecs.includes(codec);
```

### Get configs for multiple platforms

```typescript
import { getPlatformConfigs } from '@mtsynergy/platform-core/constants';

const configs = getPlatformConfigs(['twitter', 'instagram', 'tiktok']);
const minCaptionLimit = Math.min(...configs.map((c) => c.text.maxCaptionLength));
```

## Roles

### Workspace Roles

- **OWNER**: Full control over workspace
- **ADMIN**: Administrative permissions
- **MEMBER**: Basic access

### Social Account Roles

- **ADMIN**: Full account control
- **MODERATOR**: Moderation permissions
- **EDITOR**: Content editing
- **GUEST**: Read-only access

### Permission Checks

```typescript
import { hasWorkspacePermission } from '@mtsynergy/platform-core/constants';

const canDelete = hasWorkspacePermission(userRole, 'ADMIN');
// Returns true if user is ADMIN or OWNER
```

## Timezones

IANA timezone identifiers for scheduling and date formatting.

### Usage

```typescript
import { TIMEZONES, isValidTimezone } from '@mtsynergy/platform-core/constants';

const userTimezone = 'America/New_York';
if (isValidTimezone(userTimezone)) {
  // Valid timezone
}

// Get display name
import { TIMEZONE_DISPLAY_NAMES } from '@mtsynergy/platform-core/constants';
console.log(TIMEZONE_DISPLAY_NAMES['America/New_York']); // "Eastern Time (US & Canada)"
```

## Type Safety

All constants are fully typed with TypeScript for compile-time safety.

```typescript
import type { Platform, PlatformConfig, WorkspaceRole } from '@mtsynergy/platform-core/constants';

const platform: Platform = 'twitter';
const config: PlatformConfig = PLATFORM_CONFIGS[platform];
const role: WorkspaceRole = 'ADMIN';
```

## Readonly Arrays

Arrays are marked as `readonly` to prevent accidental mutation:

```typescript
import { ALL_PLATFORMS, WORKSPACE_ROLES } from '@mtsynergy/platform-core/constants';

// TypeScript compile error:
// ALL_PLATFORMS.push('newplatform'); // ❌ Error
```

## Data Sources

All platform limits are researched from official API documentation. See [../../docs/PLATFORM_LIMITS.md](../../docs/PLATFORM_LIMITS.md) for sources and maintenance notes.

## Maintenance

Platform limits should be reviewed quarterly against official platform documentation to ensure accuracy. When limits change:

1. Update the relevant config file
2. Update [PLATFORM_LIMITS.md](../../docs/PLATFORM_LIMITS.md)
3. Run tests to ensure no breaking changes
4. Bump package version appropriately
