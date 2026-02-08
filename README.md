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

### 3. **Validation & Formatting Utilities (SC-803)**

Provides validation functions for user input and formatting functions for display.

#### Validation Functions

```typescript
import {
  validateCaption,
  validateVideoFile,
  validateVideoMetadata,
  validateEmail,
  validateUrl,
} from '@mtsynergy/platform-core/utils';

// Validate caption against platform limits
const captionErrors = validateCaption('Hello world', ['twitter', 'tiktok']);
if (captionErrors.length > 0) {
  console.log('Caption too long for:', captionErrors.map(e => e.platform));
}

// Validate video file from input element
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
if (fileInput.files && fileInput.files[0]) {
  const fileErrors = validateVideoFile(fileInput.files[0]);
  if (fileErrors.length > 0) {
    console.error('File validation failed:', fileErrors);
  }
}

// Server-side video metadata validation (after ffmpeg processing)
const metadata = {
  codec: 'h264',
  width: 1920,
  height: 1080,
  fps: 30,
  bitrateMbps: 5,
};
const metadataErrors = validateVideoMetadata(metadata);

// Validate email
if (validateEmail('user@example.com')) {
  console.log('Valid email');
}

// Validate URL
if (validateUrl('https://example.com')) {
  console.log('Valid URL');
}
```

#### Formatting Functions

```typescript
import {
  formatDate,
  formatNumber,
  formatMetric,
} from '@mtsynergy/platform-core/utils';

// Format date for locale
const formatted = formatDate('2026-02-06T15:30:00Z', 'en-US');
console.log(formatted); // "2/6/2026"

// Format number with locale-aware separators
const num = formatNumber(1234.56, 'de-DE', 'decimal');
console.log(num); // "1.234,56"

// Format percent
const percent = formatNumber(0.1234, 'en-US', 'percent');
console.log(percent); // "12%"

// Format metric with K/M suffix
const reach = formatMetric(2500000, 'reach');
console.log(reach); // "2.5M"
```

### 4. **Validation Utilities**

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

### 4. **PII Sanitization Utilities (SC-804)**

Provides functions to remove personally identifiable information (PII) from strings and objects for secure logging and observability.

#### Sanitization Functions

```typescript
import {
  sanitizeEmail,
  sanitizePhone,
  redactToken,
  maskIdentifier,
  scrubObject,
  type PiiPattern,
} from '@mtsynergy/platform-core/utils';

// Sanitize individual email addresses
const logMessage = 'User john@example.com logged in';
const sanitized = sanitizeEmail(logMessage);
console.log(sanitized); // "User [REDACTED-EMAIL] logged in"

// Sanitize phone numbers
const contactInfo = 'Call +1-555-1234 for support';
const sanitized = sanitizePhone(contactInfo);
console.log(sanitized); // "Call [REDACTED-PHONE] for support"

// Sanitize Bearer tokens and API keys
const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0...';
const sanitized = redactToken(authHeader);
console.log(sanitized); // "Bearer [REDACTED-TOKEN]"

// Mask long API keys and tokens
const apiKey = 'sk_live_1234567890abcdefghijklmnopqrstuvwxyz';
const sanitized = maskIdentifier(apiKey);
console.log(sanitized); // "[REDACTED-IDENTIFIER]"

// Recursively sanitize objects (deep copy, pattern-based)
const userObject = {
  id: 'user123',
  profile: {
    email: 'john@example.com',
    phone: '555-1234',
  },
  apiKey: 'sk_live_1234567890abcdefghijklmnopqrstuvwxyz',
};

const patterns: PiiPattern[] = [
  { name: 'email', pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}', replacement: '[REDACTED-EMAIL]' },
  { name: 'token', pattern: 'Bearer\\s+[a-zA-Z0-9._-]+', replacement: 'Bearer [REDACTED-TOKEN]' },
  { name: 'api_key', pattern: '[a-z]{2}_[a-z0-9_]{30,}', replacement: '[REDACTED-API-KEY]' },
];

const sanitizedObject = scrubObject(userObject, patterns);
// Result:
// {
//   id: 'user123',
//   profile: {
//     email: '[REDACTED-EMAIL]',
//     phone: '[REDACTED-PHONE]',
//   },
//   apiKey: '[REDACTED-API-KEY]',
// }

// Custom replacement tokens per function call
const email = 'test@example.com';
const result = sanitizeEmail(email, '[HIDDEN]');
console.log(result); // "[HIDDEN]"
```

**Key Features:**
- **Pattern-Based:** Regex-based matching with customizable replacement tokens
- **Circular Reference Safe:** Uses WeakSet to detect and handle circular references without stack overflow
- **Non-Mutating:** Returns new objects; never modifies input
- **Failure-Safe:** Warns on invalid patterns but continues execution (never breaks logging)
- **Configurable Depth:** Optional maxDepth limit for deeply nested objects (default: 50)

**Default Replacement Tokens:**
- Email: `[REDACTED-EMAIL]`
- Phone: `[REDACTED-PHONE]`
- Token: `Bearer [REDACTED-TOKEN]`
- Identifier: `[REDACTED-IDENTIFIER]`

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

### OpenAPI Type Generation

This project automatically generates TypeScript types from the BFF OpenAPI specification:

**Configuration:**
- **Config file:** `openapi-generator.config.yml` — Generator options (TypeScript-fetch, strict naming)
- **Mock spec:** `openapi/bff-spec-mock.json` — Local development spec (when BFF unavailable)
- **Output:** `src/openapi/src/models/` — Generated model files (auto-exported via `src/openapi/index.ts`)

**Generate types locally:**
```bash
# From mock spec (local development)
npm run generate:types

# From live BFF spec (CI/CD)
npm run generate:types -- --input-spec https://bff.mtsynergy.internal/api/spec.json
```

**Generated types include:**
- Model interfaces (Platform, CreateDraftRequest, CreateDraftResponse, InboxItem, ListInboxResponse)
- Enum types (with string literal values)
- Converter functions (FromJSON, ToJSON, instanceOf)
- Full TypeScript declarations with JSDoc

**Note:** Generated code is excluded from linting, strict type-checking, and coverage thresholds. It's tested via `src/__tests__/module-exports.test.ts`.

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

