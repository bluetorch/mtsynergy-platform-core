# platform-core - Shared TypeScript Library User Stories

## Overview

This document lists user stories owned by **platform-core** (shared library). This library provides auto-generated TypeScript types, validation constants, and utilities consumed by all frontend and mobile projects.

**Full story definitions:** See [../USER_STORIES.md](../USER_STORIES.md)

## Core-Owned User Stories

### Type Generation (SC-801)

- **SC-801-CORE:** Auto-generate TypeScript types from BFF OpenAPI spec
  - OneDev CI/CD hook: when BFF OpenAPI spec updates, trigger type generation
  - `openapi-generator-cli` generates `src/openapi/index.ts`
  - Types include: `CreateDraftRequest`, `CreateDraftResponse`, `InboxItem`, `Metrics`, etc.
  - Maintain backwards compatibility (no breaking type changes)
  - Generate types on-demand: `npm run generate:types`

### Shared Constants (SC-802)

- **SC-802-CORE:** Export platform-specific limits and configurations
  - `PLATFORM_CONFIGS`: Twitter (280 char limit, 140s max video), TikTok (2200 chars, 60s max), etc.
  - `VIDEO_REQUIREMENTS`: Resolution, bitrate, codec, fps constraints
  - `WORKSPACE_ROLES`: ['OWNER', 'ADMIN', 'MEMBER']
  - `SOCIAL_ROLES`: ['ADMIN', 'MODERATOR', 'EDITOR', 'GUEST']
  - `TIMEZONES`: All IANA timezone strings
  - Export as versioned npm package

### Validation & Utilities (SC-803)

- **SC-803-CORE:** Export validation functions & formatting utilities
  - `validateCaption(text, platforms)`: Check length limits per platform
  - `validateVideoFile(file)`: Verify codec, resolution, bitrate
  - `validateEmail(email)`: Email format validation
  - `validateUrl(url)`: URL format validation
  - `formatDate(date, locale)`: Localized date formatting
  - `formatNumber(num, style)`: Formatted numbers (1.5K, 50%)
  - `formatMetric(value, metric)`: Short metric notation (150K reach)

### Localization Support (I18N-1101, I18N-1102, I18N-1103)

- **I18N-1101-CORE:** Export localized labels & messages
  - Translation keys: `labels.publish`, `messages.confirmDelete`, etc.
  - Locale selection: `en-US`, `es-ES`, `fr-FR`, `de-DE`, `ja-JP`, etc.
  - Used by BFF to localize API error messages

- **I18N-1102-CORE:** Workspace messages in user's locale
  - Invitation emails in recipient's language
  - Audit log descriptions in user's selected language

- **I18N-1103-CORE:** Mobile app localization support
  - i18n strings exported for React Native usage

## API Response Types

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
    code: string;      // "VALIDATION_ERROR", "UNAUTHORIZED", etc.
    message: string;   // User-facing error
    details?: Record<string, unknown>;  // Debug info
  };
  meta: {
    timestamp: ISO8601DateTime;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

## Domain Model Types

```typescript
// src/types/workspace.ts
export interface Workspace { id, name, plan, createdAt }
export interface WorkspaceMember { id, workspaceId, userId, email, name, role, joinedAt }

// src/types/social.ts
export type Platform = 'twitter' | 'tiktok' | 'facebook' | 'instagram' | 'linkedin' | 'youtube';
export interface SocialAccount { id, workspaceId, platform, username, platformUserId, profileImageUrl, connectedAt, tokenExpiresAt }

// src/types/content.ts
export interface Draft { id, workspaceId, caption, platforms, mediaIds, status, approverNotes, scheduledAt, createdAt, createdBy, updatedAt }
export interface InboxItem { id, workspaceId, platform, platformItemId, author, content, contentType, status, createdAt }

// src/types/metrics.ts
export interface Metrics { reach, reachPrevious, engagement, engagementPrevious, impressions, impressionsPrevious, growth }
export interface Report { id, modules, dateRange, format, status, downloadUrl, createdAt }
```

## Distribution & Versioning

- **npm Package:** `@mtsynergy/core` (published to OneDev registry)
- **Entry Point:** `dist/index.esm.js`, `dist/index.cjs.js`
- **Package Exports:**
  ```json
  {
    ".": "./dist/index.js",
    "./types": "./dist/types/index.js",
    "./constants": "./dist/constants/index.js",
    "./utils": "./dist/utils/index.js"
  }
  ```

- **Versioning:** Semantic versioning (MAJOR.MINOR.PATCH)
  - MAJOR: Breaking type changes (type removed, API redesigned)
  - MINOR: New types/constants added, backwards-compatible
  - PATCH: Bug fixes, internal refactoring

## CDN Deployment (Import Maps)

The package is also deployed to CloudFlare R2 CDN for browser consumption:

```
dist/index.esm.js → https://r2.cdn.com/@mtsynergy/core@1.0.0/dist/index.esm.js

Injected via import map:
<script type="importmap">
{
  "imports": {
    "@mtsynergy/core": "https://r2.cdn.com/@mtsynergy/core@1.0.0/dist/index.esm.js"
  }
}
</script>
```

Versioned URLs allow safe concurrent deployments (1.0.0, 1.1.0, 1.2.0 all live).

## Build & Publishing

```bash
# 1. Generate types from BFF OpenAPI spec
npm run generate:types

# 2. Build library (ESM + CJS)
npm run build

# 3. Run tests
npm run test

# 4. Publish to npm registry
npm publish --registry https://git.example.com/api/npm/registry/

# 5. Deploy to R2 CDN
wrangler r2 cp ./dist/* r2://mtsynergy-cdn/@mtsynergy/core@1.0.0/ --recursive
```

### Observability Utilities (SC-804–SC-808)

- **SC-804:** ✅ **COMPLETE** - Shared PII sanitization functions
  - Fetch PII patterns from BFF GET /api/observability/pii-patterns on first import
  - Cache patterns in memory; refresh every 5 minutes or on version change
  - Export functions: sanitizeEmail(str), sanitizePhone(str), redactToken(str), maskIdentifier(str), scrubObject(obj)
  - Pattern matching uses regex from ConfigMap; replacement tokens: [REDACTED-EMAIL], [REDACTED-PHONE], etc.
  - scrubObject recursively scans object/array trees and applies sanitization to string values

- **SC-805:** Correlation ID generator & validator
  - generateCorrelationId(): string — Generate UUID v4 using crypto.randomUUID() (browser) or uuid library (Node/mobile)
  - isValidCorrelationId(id: string): boolean — Validate against UUID v4 regex pattern
  - Regex: ^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$
  - TypeScript type: CorrelationId = string & { __brand: 'CorrelationId' } (branded type for compile-time safety)

- **SC-806:** OpenTelemetry trace context helpers
  - extractTraceContext(headers: Headers): TraceContext | null — Parse W3C traceparent header
  - injectTraceContext(context: TraceContext, headers: Headers): void — Inject traceparent/tracestate headers
  - createSpan(name: string, attributes?: Record<string, any>): Span — Create manual span with correlation ID attribute
  - TraceContext type: { traceId: string, spanId: string, traceFlags: number }

- **SC-807:** Logging utility with automatic PII detection
  - Logger class with methods: debug(msg, context?), info(msg, context?), warn(msg, context?), error(msg, context?, error?)
  - Automatically scrubs PII from message and context before output
  - Output format: JSON with fields {timestamp, level, message, context, correlationId} (correlationId from global/AsyncStorage)
  - Browser: outputs to console.log; Mobile: outputs to native logger; Node: outputs to stdout

- **SC-808:** Breadcrumb manager with FIFO queue
  - BreadcrumbManager class: add(event), getAll(), clear()
  - Max 20 items, max 5KB total size; oldest items evicted when limit reached
  - Automatic PII scrubbing applied to each breadcrumb before storage
  - Event type: {type: 'click'|'navigation'|'network'|'error', data: any, timestamp: number}
  - Storage: sessionStorage (browser), AsyncStorage (mobile)

## Testing Strategy

- **Unit Tests:** Validation functions, formatting utilities
- **Integration:** Type generation from BFF spec (mock OpenAPI)
- **Compatibility:** Test ESM + CJS in different module systems

## Related Projects

**Consumers of platform-core:**
- **platform-shell** — Imports types, constants, utils via import map
- **platform-mfe-publishing** — Imports types, constants
- **platform-mfe-inbox** — Imports types, constants
- **platform-mfe-reporting** — Imports types, constants
- **platform-mobile** — Imports types, constants via npm
- **platform-design-system** — Imports types

**Producers:**
- **platform-bff** — Generates OpenAPI spec (consumed by core for type generation)

---

**For full story details:** See [../USER_STORIES.md](../USER_STORIES.md) Section 10 (Shared Core Library)

