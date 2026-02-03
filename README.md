# platform-core

**Shared TypeScript Library — Types, Utilities, Validators**

## Overview

**platform-core** is a shared TypeScript library consumed by all frontend projects (Shell, MFEs, Mobile). It contains:

- Auto-generated TypeScript types from BFF OpenAPI specification
- Validation constants (platform limits, video requirements, etc.)
- Helper utilities (formatting, API client base)
- Shared types for team/workspace/social account domain models

**Technology Stack:**
- **Language:** TypeScript 5.3+
- **Build Tool:** Vite (ESM output for all environments)
- **Distribution:** npm package (published to OneDev registry)
- **Documentation:** Auto-generated from JSDoc comments
- **Testing:** Vitest

## Project Structure

```
platform-core/
├── src/
│   ├── index.ts                    # Main entry point (exports all)
│   ├── types/
│   │   ├── index.ts                # All exported types
│   │   ├── auth.ts                 # User, Session, OAuth types
│   │   ├── workspace.ts            # Workspace, WorkspaceMember
│   │   ├── social.ts               # SocialAccount, Platform
│   │   ├── content.ts              # Draft, Post, InboxItem
│   │   ├── metrics.ts              # Metrics, Report
│   │   └── api.ts                  # API response wrappers (Result, Error)
│   ├── constants/
│   │   ├── index.ts                # All exported constants
│   │   ├── platforms.ts            # Platform configs (Twitter, TikTok, etc.)
│   │   ├── limits.ts               # PLATFORM_LIMITS, VIDEO_REQUIREMENTS
│   │   ├── roles.ts                # WORKSPACE_ROLES, SOCIAL_ROLES
│   │   └── timezones.ts            # TIMEZONES list
│   ├── utils/
│   │   ├── index.ts                # All exported utilities
│   │   ├── formatting.ts           # formatDate, formatNumber, formatNumber
│   │   ├── validation.ts           # validateEmail, validateUrl, etc.
│   │   ├── api.ts                  # createApiClient(), handleApiError()
│   │   └── storage.ts              # getJwt(), setJwt(), clearStorage()
│   ├── openapi/
│   │   └── index.ts                # Auto-generated types from BFF OpenAPI
│   ├── generated/
│   │   └── api.ts                  # Auto-generated API client (optional, for Node.js)
│   └── __tests__/
│       ├── validation.test.ts
│       └── formatting.test.ts
├── vite.config.ts
├── package.json                    # Exports ESM + CJS
├── tsconfig.json
├── vitest.config.ts
├── openapi-generator.config.yml    # Config for OpenAPI code generation
├── README.md
├── SPECIFICATION.md
└── USER_STORIES.md
```

## Responsibilities

### 1. **Auto-Generated Types from BFF OpenAPI (SC-801)**
Every change to BFF OpenAPI spec (e.g., new `/api/v1/drafts` endpoint) triggers automatic type generation:

```typescript
// src/openapi/index.ts (auto-generated)

export interface CreateDraftRequest {
  caption: string;
  platforms: Platform[];
  scheduledAt?: ISO8601DateTime;
  mediaIds?: string[];
}

export interface CreateDraftResponse {
  id: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED';
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

// ... all endpoint types
```

Generation happens in CI/CD (OneDev):
```yaml
# In platform-bff/.onedev-buildspec.yml
jobs:
  - openapi-generate:
      script: openapi-generator-cli generate -c platform-core/openapi-generator.config.yml
      then:
        - submit-merge-request:
            target: "platform-core"
            branch: "feat/openapi-update-$(date +%s)"
```

### 2. **Platform-Specific Constants (SC-801, SC-802)**

```typescript
// src/constants/platforms.ts

export const PLATFORM_CONFIGS = {
  TWITTER: {
    id: 'twitter',
    name: 'Twitter/X',
    maxCaption: 280,
    supportedFormats: ['jpg', 'png', 'gif', 'mp4'],
    maxVideoLength: 140, // seconds
    maxFileSize: 15 * 1024 * 1024, // bytes
    schedulingHorizon: 180, // days
    rateLimit: { requests: 450, windowSeconds: 900 },
  },
  TIKTOK: {
    id: 'tiktok',
    name: 'TikTok',
    maxCaption: 2200,
    supportedFormats: ['mp4', 'webm'],
    maxVideoLength: 60,
    maxFileSize: 1024 * 1024 * 1024, // 1 GB
    schedulingHorizon: 30,
    rateLimit: { requests: 10, windowSeconds: 3600 },
  },
  // ... Facebook, Instagram, LinkedIn, etc.
};

export const VIDEO_REQUIREMENTS = {
  resolution: {
    min: { width: 640, height: 480 },
    max: { width: 3840, height: 2160 },
  },
  bitrate: {
    min: '500k',
    max: '50M',
  },
  fps: { min: 1, max: 60 },
  codec: 'h264',
};

export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'MEMBER'];

export const SOCIAL_ROLES = ['ADMIN', 'MODERATOR', 'EDITOR', 'GUEST'];

export const TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  // ... all IANA timezones
];
```

### 3. **Validation Utilities**

```typescript
// src/utils/validation.ts

export function validateCaption(text: string, platforms: Platform[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const platform of platforms) {
    const config = PLATFORM_CONFIGS[platform];
    if (text.length > config.maxCaption) {
      errors.push({
        platform,
        message: `Caption exceeds ${config.maxCaption} character limit`,
      });
    }
  }

  return errors;
}

export function validateVideoFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];
  const reqs = VIDEO_REQUIREMENTS;

  if (file.size > reqs.maxFileSize) {
    errors.push({ message: 'File size exceeds limit' });
  }

  // Parse video metadata (via ffmpeg in web context)
  // Validate codec, fps, resolution

  return errors;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### 4. **Shared Domain Types**

```typescript
// src/types/workspace.ts

export interface Workspace {
  id: string;
  name: string;
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  createdAt: ISO8601DateTime;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  name: string;
  role: WorkspaceRole;
  joinedAt: ISO8601DateTime;
}

// src/types/social.ts

export interface SocialAccount {
  id: string;
  workspaceId: string;
  platform: Platform;
  username: string;
  platformUserId: string;
  profileImageUrl: string;
  connectedAt: ISO8601DateTime;
  tokenExpiresAt?: ISO8601DateTime;
}

export type Platform = 'twitter' | 'tiktok' | 'facebook' | 'instagram' | 'linkedin' | 'youtube';

// src/types/content.ts

export interface Draft {
  id: string;
  workspaceId: string;
  caption: string;
  platforms: Platform[];
  mediaIds: string[];
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'CHANGES_REQUESTED' | 'APPROVED' | 'PUBLISHED';
  approverNotes?: string;
  scheduledAt?: ISO8601DateTime;
  createdAt: ISO8601DateTime;
  createdBy: string; // user ID
  updatedAt: ISO8601DateTime;
}

export interface InboxItem {
  id: string;
  workspaceId: string;
  platform: Platform;
  platformItemId: string;
  author: {
    name: string;
    username: string;
    avatarUrl: string;
  };
  content: string;
  contentType: 'COMMENT' | 'MESSAGE' | 'MENTION' | 'REVIEW';
  status: 'NEW' | 'ASSIGNED' | 'RESOLVED' | 'SPAM';
  createdAt: ISO8601DateTime;
}
```

### 5. **API Response Wrappers**

```typescript
// src/types/api.ts

export interface ApiSuccessResponse<T> {
  data: T;
  meta: {
    timestamp: ISO8601DateTime;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: ISO8601DateTime;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### 6. **Formatting Utilities**

```typescript
// src/utils/formatting.ts

export function formatDate(date: ISO8601DateTime, locale: string = 'en-US'): string {
  return new Date(date).toLocaleDateString(locale);
}

export function formatNumber(num: number, style: 'decimal' | 'percent' = 'decimal'): string {
  return new Intl.NumberFormat('en-US', { style }).format(num);
}

export function formatMetric(value: number, metric: 'reach' | 'engagement' | 'impressions'): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}
```

## Build & Distribution

### Local Development

```bash
npm install
npm run build      # Generate ESM + CJS
npm run test       # Run tests
npm run docs       # Generate TypeScript documentation
```

### Publishing

```bash
# Generate types from BFF OpenAPI spec
npm run generate:types

# Build library
npm run build

# Publish to OneDev registry
npm run publish

# Or publish to npm (for public consumption)
npm run publish:npm
```

### package.json Exports

```json
{
  "name": "@mtsynergy/core",
  "version": "1.0.0",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.esm.js",
      "require": "./dist/types/index.cjs.js",
      "types": "./dist/types/index.d.ts"
    },
    "./constants": {
      "import": "./dist/constants/index.esm.js",
      "require": "./dist/constants/index.cjs.js",
      "types": "./dist/constants/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.esm.js",
      "require": "./dist/utils/index.cjs.js",
      "types": "./dist/utils/index.d.ts"
    }
  }
}
```

### Usage in Other Projects

```typescript
// platform-shell
import { validateCaption, PLATFORM_CONFIGS } from '@mtsynergy/core/constants';
import type { Draft, Platform } from '@mtsynergy/core/types';

// platform-mobile
import { formatMetric, formatDate } from '@mtsynergy/core/utils';
import { VIDEO_REQUIREMENTS } from '@mtsynergy/core/constants';
```

## Import Map CDN Hosting

This package is deployed to CloudFlare R2 + CDN for browser consumption:

```html
<!-- In platform-shell response -->
<script type="importmap">
{
  "imports": {
    "@mtsynergy/core": "https://r2.cdn.com/@mtsynergy/core@1.0.0/dist/index.esm.js"
  }
}
</script>
```

## Related Projects

- **platform-bff** — OpenAPI spec source; generates types in this project
- **platform-shell** — Uses types, constants, utils via import map
- **platform-mfe-*** — All MFEs use shared types
- **platform-mobile** — Uses types, utils for offline validation
- **platform-design-system** — Builds on shared types for component APIs

---

**For story details:** See [USER_STORIES.md](USER_STORIES.md)

