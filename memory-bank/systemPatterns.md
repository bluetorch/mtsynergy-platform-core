# System Patterns

_Version: 1.0_
_Created: 2026-02-03_
_Last Updated: 2026-02-03_

## Architecture Overview

**platform-core** is a **shared TypeScript library** that acts as the single source of truth for:

- Type definitions (auto-generated from BFF OpenAPI specification)
- Platform-specific constants and configuration
- Validation and formatting utilities
- Internationalization (i18n) strings and utilities

### Architectural Principles

1. **Zero Dependencies** - No production dependencies to minimize bundle size and avoid version conflicts
2. **Modular Exports** - Tree-shakeable exports allow consumers to import only what they need
3. **Runtime Agnostic** - Works in browsers (CloudFlare Workers), Node.js, and React Native
4. **Type-First** - All utilities are fully typed with TypeScript strict mode
5. **Auto-Generated Truth** - BFF OpenAPI spec is the single source of truth for API types
6. **Backward Compatible** - Semantic versioning enforced via automated compatibility checks

### Distribution Model

**Dual Distribution:**

- **npm Package** → OneDev internal registry (Node.js, React Native, build tools)
- **CDN Bundle** → CloudFlare R2 (browsers via import maps)

**Consumers:**

- **platform-shell** - MFE orchestrator (browser)
- **platform-mfe-\*** - Individual micro frontends (browser)
- **platform-mobile** - React Native iOS/Android app
- **platform-bff** - Kotlin/Spring Boot backend (i18n error messages only)

## Key Components

| Component                | Responsibility                                              | Location                     |
| ------------------------ | ----------------------------------------------------------- | ---------------------------- |
| **OpenAPI Types**        | Auto-generated TypeScript interfaces from BFF spec          | `src/openapi/index.ts`       |
| **Domain Types**         | Hand-written domain models (Workspace, SocialAccount, etc.) | `src/types/*.ts`             |
| **Platform Constants**   | Platform-specific limits, configs (Twitter, TikTok, etc.)   | `src/constants/platforms.ts` |
| **Validation Utilities** | Caption, video, email, URL validators                       | `src/utils/validation.ts`    |
| **Formatting Utilities** | Date, number, metric formatters (locale-aware)              | `src/utils/formatting.ts`    |
| **i18n Strings**         | Translation files for supported locales                     | `src/i18n/[locale].ts`       |
| **i18n Utilities**       | Translation function with interpolation                     | `src/i18n/index.ts`          |
| **API Utilities**        | Optional API client helpers                                 | `src/utils/api.ts`           |
| **Generated API Client** | Optional fetch-based client (Node.js/Mobile only)           | `src/generated/api.ts`       |

## Design Patterns in Use

### Pattern 1: Code Generation (OpenAPI → TypeScript)

- **Purpose**: Maintain type safety between BFF API and all frontend/mobile clients
- **Implementation**:
  - BFF publishes OpenAPI 3.0 specification
  - OneDev CI/CD triggers `openapi-generator-cli` on spec changes
  - Generated types committed to `src/openapi/index.ts`
  - Consuming projects get autocomplete for all API requests/responses
- **Files**:
  - `openapi-generator.config.yml` - Generator configuration
  - `src/openapi/index.ts` - Generated output
  - `.onedev-buildspec.yml` - CI/CD pipeline

### Pattern 2: Modular Exports (Tree-Shaking)

- **Purpose**: Allow consumers to import only what they need (minimal bundle size)
- **Implementation**:
  - Each module exports from dedicated barrel file
  - package.json defines granular export paths
  - Browser consumers only pull in required functions via import maps
- **Files**:
  - `src/types/index.ts` - Re-exports all type modules
  - `src/constants/index.ts` - Re-exports all constant modules
  - `src/utils/index.ts` - Re-exports all utility modules
  - `package.json` - Defines export paths

**Example:**

```typescript
// Consumer only loads validation.ts, not entire utils/
import { validateCaption } from "@mtsynergy/core/utils/validation";
```

### Pattern 3: Factory Pattern (Platform Configs)

- **Purpose**: Centralize platform-specific configuration in typed objects
- **Implementation**:
  - Single `PLATFORM_CONFIGS` object maps platform → config
  - Type-safe access prevents typos
  - Easy to extend for new platforms
- **Files**: `src/constants/platforms.ts`

**Example:**

```typescript
const twitterConfig = PLATFORM_CONFIGS.twitter;
if (caption.length > twitterConfig.maxCaption) {
  // Validation error
}
```

### Pattern 4: Strategy Pattern (Locale-Aware Formatting)

- **Purpose**: Format dates/numbers/metrics according to user's locale
- **Implementation**:
  - Formatting functions accept `locale` parameter
  - Use native Intl API for internationalization
  - Fallback to en-US if locale unsupported
- **Files**: `src/utils/formatting.ts`

**Example:**

```typescript
formatDate("2026-02-03T12:00:00Z", "de-DE"); // "3.2.2026"
formatNumber(1234.56, "fr-FR", "decimal"); // "1 234,56"
```

### Pattern 5: Template Method (Translation with Interpolation)

- **Purpose**: Provide translations with dynamic parameter substitution
- **Implementation**:
  - Translation keys stored as templates: `"Hello {name}"`
  - `t()` function replaces placeholders with params object
  - Fallback to en-US if translation missing
- **Files**: `src/i18n/index.ts`, `src/i18n/[locale].ts`

**Example:**

```typescript
t("errors.invalidCaption", "es-ES", { platform: "Twitter" });
// Returns: "El título excede el límite de caracteres para Twitter"
```

### Pattern 6: Semantic Versioning (Automated)

- **Purpose**: Prevent breaking changes without major version bump
- **Implementation**:
  - Conventional commits determine version bump type
  - CI/CD extracts public API surface before/after changes
  - Build fails if breaking changes detected in patch/minor
  - semantic-release auto-publishes new version
- **Files**:
  - `.releaserc.json` - semantic-release config
  - `scripts/compare-types.ts` - Breaking change detector

## Data Flow

### 1. Type Generation Flow (BFF → platform-core → Consumers)

```
┌─────────────────┐
│  platform-bff   │
│  (Kotlin/Spring)│
└────────┬────────┘
         │ 1. OpenAPI spec changes
         ↓
┌─────────────────┐
│ OneDev CI/CD    │
│ Webhook trigger │
└────────┬────────┘
         │ 2. Run openapi-generator-cli
         ↓
┌─────────────────┐
│ platform-core   │
│ src/openapi/    │
│ index.ts        │
└────────┬────────┘
         │ 3. Commit & publish new version
         ↓
┌─────────────────────────────────────┐
│ Consumers (Shell, MFEs, Mobile)     │
│ - npm update @mtsynergy/core        │
│ - Get new types via autocomplete    │
└─────────────────────────────────────┘
```

### 2. Validation Flow (User Input → Validator → UI Feedback)

```
┌──────────────┐
│ User Input   │
│ (Caption)    │
└──────┬───────┘
       │
       ↓
┌──────────────────────┐
│ platform-shell/MFE   │
│ Composer Component   │
└──────┬───────────────┘
       │ import { validateCaption } from '@mtsynergy/core'
       ↓
┌──────────────────────┐
│ platform-core        │
│ validateCaption()    │
│ - Check vs. PLATFORM_CONFIGS
│ - Return errors[]    │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ UI Error Display     │
│ "Exceeds 280 chars"  │
└──────────────────────┘
```

### 3. Localization Flow (Locale Selection → Translated UI)

```
┌──────────────┐
│ User         │
│ Selects      │
│ Locale: es-ES│
└──────┬───────┘
       │
       ↓
┌──────────────────────┐
│ platform-shell       │
│ Store locale in      │
│ localStorage         │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ All MFEs/Components  │
│ import { t } from    │
│ '@mtsynergy/core'    │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ t('labels.publish',  │
│   'es-ES')           │
│ → "Publicar"         │
└──────────────────────┘
```

### 4. Browser Import Flow (CDN → Import Map → Module)

```
┌──────────────────┐
│ CloudFlare R2    │
│ r2.cdn/core/1.0/ │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────┐
│ platform-shell Worker    │
│ Injects import map:      │
│ <script type=importmap>  │
│ { "@mtsynergy/core":     │
│   "https://r2.../1.0/"} │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│ MFE Fragment             │
│ import { ... } from      │
│ '@mtsynergy/core'        │
│ → Resolves via CDN       │
└──────────────────────────┘
```

## Key Technical Decisions

| Decision                                | Rationale                                                              | Date       |
| --------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| **Vite+tsc hybrid build**               | Vite for fast dual ESM+CJS bundling, tsc for accurate .d.ts generation | 2026-02-03 |
| **Vitest native integration**           | Seamless Vite integration, fast ESM testing, modern tooling            | 2026-02-03 |
| **ESM-first package (type: "module")**  | Future-proof, aligns with CloudFlare Workers, better tree-shaking      | 2026-02-03 |
| **Incremental dependency installation** | Add dependencies when stories need them, avoid premature dependencies  | 2026-02-03 |
| **Bottom-up implementation**            | Complete tooling infrastructure before feature work                    | 2026-02-03 |
| **Defer observability utilities**       | SC-804-808 implemented when those stories are prioritized              | 2026-02-03 |
| **Zero production dependencies**        | Minimize bundle size, avoid version conflicts, maximize compatibility  | 2026-02-03 |
| **Auto-generate types from OpenAPI**    | Single source of truth (BFF), prevents manual sync errors              | 2026-02-03 |
| **Store i18n strings in platform-core** | Avoid duplication across 5+ projects, type-safe translation keys       | 2026-02-03 |
| **Use TypeDoc (Apache 2.0)**            | License compliance, self-hosted, widely adopted                        | 2026-02-03 |
| **Custom breaking change detection**    | Avoid heavy API Extractor dependency, full control over process        | 2026-02-03 |
| **TypeScript strict mode**              | Maximum type safety, catch errors at compile-time                      | 2026-02-03 |

## Component Relationships

### Dependency Graph

```
index.ts (main export)
├── types/
│   ├── auth.ts
│   ├── workspace.ts
│   ├── social.ts
│   ├── content.ts
│   ├── metrics.ts
│   └── api.ts
├── openapi/ (auto-generated)
│   └── index.ts
├── constants/
│   ├── platforms.ts → types/social.ts (Platform type)
│   ├── limits.ts
│   ├── roles.ts
│   └── timezones.ts
├── utils/
│   ├── validation.ts → constants/platforms.ts, types/
│   ├── formatting.ts → types/
│   ├── api.ts → types/api.ts, openapi/
│   └── storage.ts
├── i18n/
│   ├── en-US.ts
│   ├── es-ES.ts
│   ├── fr-FR.ts
│   ├── de-DE.ts
│   ├── ja-JP.ts
│   └── index.ts → all locale files, utils/formatting.ts
└── generated/ (optional)
    └── api.ts → openapi/, utils/api.ts
```

### External Relationships

**Upstream (Producers):**

- **platform-bff** → Publishes OpenAPI spec → Triggers type generation

**Downstream (Consumers):**

- **platform-shell** → Imports types, constants, utils (browser, via CDN)
- **platform-mfe-publishing** → Imports validation, constants (browser, via CDN)
- **platform-mfe-inbox** → Imports types, formatting (browser, via CDN)
- **platform-mfe-reporting** → Imports types, formatting (browser, via CDN)
- **platform-mobile** → Imports all modules (React Native, via npm)
- **platform-bff** → Imports i18n for error messages (Kotlin, via npm)

### Runtime Dependencies

**None** - This is a zero-dependency library. All functionality is self-contained.

## Folder Structure

```
platform-core/
├── .github/
│   └── copilot/
│       └── rules.md              # RIPER framework rules
├── .copilot-instructions          # Quick reference for GitHub Copilot
├── memory-bank/                   # RIPER framework persistent context
│   ├── .state.md                  # Current framework state
│   ├── projectbrief.md            # Requirements, goals, scope
│   ├── systemPatterns.md          # Architecture and design patterns
│   ├── techContext.md             # Technology stack and setup
│   ├── activeContext.md           # Current focus and recent changes
│   └── progress.md                # Status, completed work, issues
├── src/
│   ├── index.ts                   # Main export barrel (re-exports all modules)
│   ├── types/                     # Hand-written domain types
│   │   ├── index.ts               # Type barrel (exports all types)
│   │   ├── auth.ts                # User, Session, OAuth types
│   │   ├── workspace.ts           # Workspace, WorkspaceMember
│   │   ├── social.ts              # SocialAccount, Platform enum
│   │   ├── content.ts             # Draft, Post, InboxItem
│   │   ├── metrics.ts             # Metrics, Report
│   │   └── api.ts                 # API response wrappers (Result, Error)
│   ├── openapi/                   # Auto-generated from BFF spec
│   │   └── index.ts               # Generated TypeScript interfaces
│   ├── constants/                 # Platform-specific configs
│   │   ├── index.ts               # Constants barrel
│   │   ├── platforms.ts           # PLATFORM_CONFIGS (Twitter, TikTok, etc.)
│   │   ├── limits.ts              # VIDEO_REQUIREMENTS, rate limits
│   │   ├── roles.ts               # WORKSPACE_ROLES, SOCIAL_ROLES
│   │   └── timezones.ts           # TIMEZONES (IANA)
│   ├── utils/                     # Helper utilities
│   │   ├── index.ts               # Utils barrel
│   │   ├── validation.ts          # validateCaption, validateVideoFile, etc.
│   │   ├── formatting.ts          # formatDate, formatNumber, formatMetric
│   │   ├── api.ts                 # createApiClient, handleApiError
│   │   └── storage.ts             # getJwt, setJwt, clearStorage
│   ├── i18n/                      # Internationalization
│   │   ├── index.ts               # t() function, locale types
│   │   ├── en-US.ts               # English translations
│   │   ├── es-ES.ts               # Spanish translations
│   │   ├── fr-FR.ts               # French translations
│   │   ├── de-DE.ts               # German translations
│   │   └── ja-JP.ts               # Japanese translations
│   ├── generated/                 # Optional API client (Node.js/Mobile only)
│   │   └── api.ts                 # Auto-generated fetch-based client
│   └── __tests__/                 # Shared test utilities
│       └── setup.ts               # Vitest global setup
├── scripts/                       # Build and deployment scripts
│   ├── compare-types.ts           # Breaking change detection
│   └── deploy-cdn.ts              # CloudFlare R2 deployment
├── dist/                          # Build output (gitignored)
│   ├── index.mjs                  # ESM bundle
│   ├── index.cjs                  # CommonJS bundle
│   ├── index.d.ts                 # TypeScript declarations
│   ├── types/                     # Modular type exports
│   ├── constants/                 # Modular constant exports
│   └── utils/                     # Modular utility exports
├── package.json                   # Package manifest with exports
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
├── vitest.config.ts               # Vitest test configuration
├── openapi-generator.config.yml   # OpenAPI code generation config
├── .releaserc.json                # semantic-release configuration
├── .eslintrc.json                 # ESLint rules
├── .prettierrc.json               # Prettier formatting rules
├── .gitignore                     # Git ignore rules
├── LICENSE                        # License file
├── README.md                      # Project documentation
├── SPECIFICATION.md               # MTSynergy platform specification
└── USER_STORIES.md                # User stories for this library
```

### Folder Purposes

| Folder/File        | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `.github/copilot/` | GitHub Copilot workspace instructions (RIPER framework rules) |
| `memory-bank/`     | RIPER framework persistent context (updated across sessions)  |
| `src/types/`       | Hand-written domain types (not auto-generated)                |
| `src/openapi/`     | Auto-generated TypeScript interfaces from BFF OpenAPI spec    |
| `src/constants/`   | Platform configs, validation limits, roles, timezones         |
| `src/utils/`       | Validation, formatting, API helpers                           |
| `src/i18n/`        | Translation strings and localization utilities                |
| `src/generated/`   | Optional API client (Node.js/React Native, not for browsers)  |
| `src/__tests__/`   | Shared test utilities and global setup                        |
| `scripts/`         | Build automation, breaking change detection, CDN deployment   |
| `dist/`            | Build output (ESM, CJS, type declarations) - gitignored       |

---

_This file is updated after architectural decisions and when new patterns are established._
