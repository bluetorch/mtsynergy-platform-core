# System Patterns

_Version: 1.1_
_Created: 2026-02-03_
_Last Updated: 2026-02-06_

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

## SC-803: Validation & Formatting Utilities - Design Approaches (INNOVATE MODE)

_Added: 2026-02-06_

### Approach 1: Validation Return Types

**Option A: Boolean Returns (Simple)**
```typescript
function validateEmail(email: string): boolean
function validateUrl(url: string): boolean
```
- ✅ **Pros:** Simple, clear success/failure, minimal overhead
- ❌ **Cons:** No error details, caller can't explain what failed
- 💡 **Use Case:** Quick yes/no checks in UI validation

**Option B: Error Array Returns (Detailed)**
```typescript
function validateEmail(email: string): ValidationError[]
function validateCaption(text: string, platforms: Platform[]): ValidationError[]
```
- ✅ **Pros:** Detailed error messages, multi-error support, consumer can display specific issues
- ❌ **Cons:** Caller must check array length for success, slightly more overhead
- 💡 **Use Case:** Complex validations where users need specific feedback

**Option C: Result Type (Functional)**
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
function validateEmail(email: string): Result<true, string>
```
- ✅ **Pros:** Type-safe error handling, explicit success/failure states, Rust-like pattern
- ❌ **Cons:** Adds complexity, unfamiliar to many JS/TS developers, requires wrapper type
- 💡 **Use Case:** Functional programming style codebases

**Option D: Hybrid Approach (Pragmatic)**
```typescript
// Simple validators return boolean
function validateEmail(email: string): boolean
function validateUrl(url: string): boolean

// Complex validators return error arrays
function validateCaption(text: string, platforms: Platform[]): ValidationError[]
function validateVideoFile(file: File): ValidationError[]
```
- ✅ **Pros:** Right tool for right job, simple when possible, detailed when needed
- ❌ **Cons:** Inconsistent API, developers must remember which returns what
- 💡 **Use Case:** Balances simplicity and functionality

**Recommendation to Explore:** Option D (Hybrid) - matches patterns already shown in README.md

---

### Approach 2: Video File Validation Depth

**Option A: Basic Validation Only**
```typescript
function validateVideoFile(file: File): ValidationError[] {
  // Only check: file size, extension
  // NO codec, resolution, fps checks
}
```
- ✅ **Pros:** Zero dependencies, works in browser, fast
- ❌ **Cons:** Incomplete validation, user might upload invalid video
- 💡 **Trade-off:** Document that full validation requires server-side processing

**Option B: Deep Validation with Optional Dependency**
```typescript
// Add dev dependency: video-metadata-thumbnailer or similar
function validateVideoFileDeep(file: File): Promise<ValidationError[]> {
  // Check: codec, resolution, fps, bitrate
}
```
- ✅ **Pros:** Complete validation, catches all issues client-side
- ❌ **Cons:** Breaks zero-dependency principle, adds ~500KB to bundle, async complexity
- 💡 **Trade-off:** Violates project principle of zero production dependencies

**Option C: Two Functions (Basic + Server Validation Helper)**
```typescript
// Client-side: basic checks
function validateVideoFileBasic(file: File): ValidationError[]

// Server-side metadata type for full validation
interface VideoMetadata { codec, resolution, fps, bitrate }
function validateVideoMetadata(metadata: VideoMetadata): ValidationError[]
```
- ✅ **Pros:** Maintains zero-dependency, provides server-side helper, clear separation
- ❌ **Cons:** Requires server-side tools (ffmpeg), two-step validation process
- 💡 **Trade-off:** Best of both worlds - basic client checks, full server validation

**Option D: Placeholder with Documentation**
```typescript
function validateVideoFile(file: File): ValidationError[] {
  // Only basic validation
  // Full validation requires server-side ffmpeg - see docs
}
```
- ✅ **Pros:** Single function, zero dependencies, clear limitations
- ❌ **Cons:** Misleading name (implies full validation), incomplete validation
- 💡 **Trade-off:** Simplest approach but may confuse consumers

**Recommendation to Explore:** Option C (Two Functions) - maintains principles, provides server helper

---

### Approach 3: Error Handling in Formatting Functions

**Option A: Throw Exceptions**
```typescript
function formatDate(date: ISO8601DateTime, locale: string): string {
  if (!isValidDate(date)) throw new Error('Invalid date');
  return new Intl.DateTimeFormat(locale).format(new Date(date));
}
```
- ✅ **Pros:** Fails fast, forces caller to handle errors, clear contract
- ❌ **Cons:** Requires try/catch, can crash if not handled, verbose for consumers
- 💡 **Use Case:** Critical operations where bad input shouldn't proceed

**Option B: Return Fallback Values**
```typescript
function formatDate(date: ISO8601DateTime, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale).format(new Date(date));
  } catch {
    return 'Invalid Date';
  }
}
```
- ✅ **Pros:** Never crashes, graceful degradation, simple for consumers
- ❌ **Cons:** Hides errors, consumer doesn't know validation failed, could mask bugs
- 💡 **Use Case:** Display layer where showing something is better than crashing

**Option C: Optional Return (null on error)**
```typescript
function formatDate(date: ISO8601DateTime, locale: string): string | null {
  try {
    return new Intl.DateTimeFormat(locale).format(new Date(date));
  } catch {
    return null;
  }
}
```
- ✅ **Pros:** Explicit failure, caller chooses fallback, type-safe
- ❌ **Cons:** Caller must check for null, more boilerplate
- 💡 **Use Case:** Balanced approach - safe but consumer has control

**Option D: Validate + Format Pattern**
```typescript
function isValidDate(date: string): boolean { /* ... */ }
function formatDate(date: ISO8601DateTime, locale: string): string {
  // Assumes valid input, caller should validate first
  return new Intl.DateTimeFormat(locale).format(new Date(date));
}
```
- ✅ **Pros:** Separation of concerns, consumer chooses when to validate, performant
- ❌ **Cons:** Caller must remember to validate, could pass bad data
- 💡 **Use Case:** Performance-critical scenarios where validation is already done

**Recommendation to Explore:** Option B (Fallback) for display functions, Option D (Validate+Format) for advanced users

---

### Approach 4: Locale Validation Strategy

**Option A: No Locale Validation**
```typescript
function formatDate(date: ISO8601DateTime, locale: string = 'en-US'): string {
  // Pass locale directly to Intl.DateTimeFormat
  // Let browser handle invalid locales
}
```
- ✅ **Pros:** Simple, trusts browser/Node.js implementation, no maintenance
- ❌ **Cons:** Unexpected fallback behavior, caller doesn't know if locale is invalid
- 💡 **Trade-off:** Simplest approach, relies on platform behavior

**Option B: Validate Against Hardcoded List**
```typescript
const SUPPORTED_LOCALES = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'] as const;
function formatDate(date: ISO8601DateTime, locale: string = 'en-US'): string {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    locale = 'en-US'; // fallback
  }
  // ...
}
```
- ✅ **Pros:** Explicit support, predictable behavior, type-safe locale list
- ❌ **Cons:** Requires maintaining locale list, limits consumer choice
- 💡 **Trade-off:** Control vs flexibility

**Option C: Accept Any IANA Identifier**
```typescript
function formatDate(date: ISO8601DateTime, locale: string = 'en-US'): string {
  // Accept any valid IANA locale
  // Document that behavior depends on runtime support
}
```
- ✅ **Pros:** Maximum flexibility, works with any locale, future-proof
- ❌ **Cons:** Inconsistent behavior across browsers/Node versions
- 💡 **Trade-off:** Flexibility vs predictability

**Option D: Locale Validation Helper**
```typescript
function isLocaleSupported(locale: string): boolean {
  try {
    new Intl.DateTimeFormat(locale);
    return true;
  } catch {
    return false;
  }
}

function formatDate(date: ISO8601DateTime, locale: string = 'en-US'): string {
  // Consumer can pre-validate with isLocaleSupported() if needed
}
```
- ✅ **Pros:** Provides validation without enforcing it, consumer choice, flexible
- ❌ **Cons:** Extra function to document, consumer must know to use it
- 💡 **Trade-off:** Best of both - validation available but optional

**Recommendation to Explore:** Option A (No Validation) or Option D (Helper) - trust platform, provide tools if needed

---

### Approach 5: File Organization

**Option A: Monolithic utils/index.ts**
```
src/utils/
├── index.ts  # All 7 functions in one file (~300 lines)
```
- ✅ **Pros:** Simple, everything in one place, minimal files
- ❌ **Cons:** Large file, poor tree-shaking, mixes concerns
- 💡 **Use Case:** Very small utility libraries

**Option B: Separate Files by Function Type**
```
src/utils/
├── index.ts         # Barrel export
├── validation.ts    # 4 validation functions
├── formatting.ts    # 3 formatting functions
└── types.ts         # ValidationError interface
```
- ✅ **Pros:** Clear separation, better tree-shaking, organized by purpose
- ❌ **Cons:** More files, need barrel export
- 💡 **Use Case:** Medium-sized utility libraries (our case)

**Option C: One File Per Function**
```
src/utils/
├── index.ts
├── validateCaption.ts
├── validateVideoFile.ts
├── validateEmail.ts
├── validateUrl.ts
├── formatDate.ts
├── formatNumber.ts
└── formatMetric.ts
```
- ✅ **Pros:** Perfect tree-shaking, easy to find functions, scalable
- ❌ **Cons:** Many files, barrel export complexity, overhead for small functions
- 💡 **Use Case:** Large utility libraries with dozens of functions

**Option D: Hybrid (Group Small, Separate Large)**
```
src/utils/
├── index.ts
├── validation.ts      # validateEmail, validateUrl (simple)
├── platform.ts        # validateCaption, validateVideoFile (complex, uses constants)
├── formatting.ts      # All formatters
└── types.ts
```
- ✅ **Pros:** Balanced organization, logical grouping, good tree-shaking
- ❌ **Cons:** Subjective grouping decisions
- 💡 **Use Case:** When functions have clear logical groups

**Recommendation to Explore:** Option B (Function Type) - matches SC-802 pattern, clear and simple

---

### Approach 6: Testing Strategy

**Option A: Test Files Mirror Source Files**
```
src/__tests__/
├── validation.test.ts    # Tests for validation.ts
├── formatting.test.ts    # Tests for formatting.ts
└── utils-exports.test.ts # Module export verification
```
- ✅ **Pros:** Easy to find tests, clear 1:1 mapping, standard pattern
- ❌ **Cons:** None significant
- 💡 **Use Case:** Standard approach (matches SC-801, SC-802)

**Option B: Test by Function**
```
src/__tests__/
├── validateCaption.test.ts
├── validateVideoFile.test.ts
├── validateEmail.test.ts
├── validateUrl.test.ts
├── formatDate.test.ts
├── formatNumber.test.ts
└── formatMetric.test.ts
```
- ✅ **Pros:** Very granular, easy to run single function tests
- ❌ **Cons:** Many files, harder to see overall coverage
- 💡 **Use Case:** When functions are very large/complex

**Option C: Test by Category**
```
src/__tests__/
├── platform-validation.test.ts  # validateCaption, validateVideoFile
├── basic-validation.test.ts     # validateEmail, validateUrl
├── formatting.test.ts           # All formatters
└── utils-integration.test.ts    # Cross-function tests
```
- ✅ **Pros:** Logical grouping, integration tests separate
- ❌ **Cons:** Arbitrary categories, inconsistent with source organization
- 💡 **Use Case:** When functions have complex interactions

**Recommendation to Explore:** Option A (Mirror Source) - matches established project patterns

---

### Approach 7: Type Definition Location

**Option A: Co-located with Implementation**
```typescript
// src/utils/validation.ts
export interface ValidationError { /* ... */ }
export function validateCaption() { /* ... */ }
```
- ✅ **Pros:** Everything in one place, easy to find
- ❌ **Cons:** Type not reusable if split into multiple files
- 💡 **Use Case:** When types are only used in one file

**Option B: Separate types.ts File**
```typescript
// src/utils/types.ts
export interface ValidationError { /* ... */ }

// src/utils/validation.ts
import type { ValidationError } from './types';
```
- ✅ **Pros:** Reusable types, clear separation, scalable
- ❌ **Cons:** Extra file, need to import
- 💡 **Use Case:** When types are shared across multiple files (our case)

**Option C: Export from constants/types.ts**
```typescript
// src/constants/types.ts (existing file)
export interface ValidationError { /* ... */ }

// src/utils/validation.ts
import type { ValidationError } from '../constants/types';
```
- ✅ **Pros:** Single source of truth for all types, consistent location
- ❌ **Cons:** Mixing utility types with platform types, coupling
- 💡 **Use Case:** When maintaining single types file

**Option D: Create src/types/utils.ts**
```typescript
// src/types/utils.ts (new file in existing types/ folder)
export interface ValidationError { /* ... */ }

// src/utils/validation.ts
import type { ValidationError } from '../types/utils';
```
- ✅ **Pros:** Follows existing types/ folder pattern, organized by domain
- ❌ **Cons:** Extra folder navigation, not co-located
- 💡 **Use Case:** When types/ folder is the established pattern for types

**Recommendation to Explore:** Option B (utils/types.ts) - keeps utils module self-contained

---

### Approach 8: JSDoc Documentation Depth

**Option A: Minimal JSDoc**
```typescript
/** Validates email format */
export function validateEmail(email: string): boolean
```
- ✅ **Pros:** Concise, low maintenance
- ❌ **Cons:** Lacks examples, parameter details
- 💡 **Use Case:** Self-explanatory functions

**Option B: Comprehensive JSDoc**
```typescript
/**
 * Validates email address format using RFC-compliant regex pattern.
 * 
 * @param email - Email address to validate
 * @returns True if email matches valid format, false otherwise
 * 
 * @example
 * ```typescript
 * validateEmail('user@example.com') // true
 * validateEmail('invalid') // false
 * ```
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email
 */
export function validateEmail(email: string): boolean
```
- ✅ **Pros:** Rich IDE tooltips, examples for consumers, links to resources
- ❌ **Cons:** Verbose, more maintenance
- 💡 **Use Case:** Public API libraries (our case)

**Option C: TypeDoc-Optimized**
```typescript
/**
 * Validates email format.
 * @public
 * @category Validation
 * @param email - Email to validate
 * @returns Validation result
 */
export function validateEmail(email: string): boolean
```
- ✅ **Pros:** Structured for doc generation, categorized, public/private markers
- ❌ **Cons:** Requires TypeDoc knowledge, extra tags
- 💡 **Use Case:** When generating documentation website

**Recommendation to Explore:** Option B (Comprehensive) - best IDE experience for consumers

---

### Key Decision Points Summary

| Decision Area | Options | Recommended Direction |
|--------------|---------|----------------------|
| Validation Returns | Boolean vs Error Arrays vs Result Type vs Hybrid | **Hybrid** - boolean for simple, arrays for complex |
| Video Validation | Basic Only vs Deep vs Two Functions vs Placeholder | **Two Functions** - basic client, metadata helper |
| Error Handling | Throw vs Fallback vs Null vs Validate+Format | **Fallback** for formatters, maintain zero-crash UX |
| Locale Validation | None vs Hardcoded vs Any IANA vs Helper | **No Validation** - trust platform, simple |
| File Organization | Monolithic vs By Type vs Per Function vs Hybrid | **By Type** - validation.ts + formatting.ts |
| Testing Strategy | Mirror Source vs Per Function vs By Category | **Mirror Source** - established pattern |
| Type Location | Co-located vs Separate vs Constants vs types/ | **Separate** - utils/types.ts |
| JSDoc Depth | Minimal vs Comprehensive vs TypeDoc-Optimized | **Comprehensive** - best consumer experience |

---

_This file is updated after architectural decisions and when new patterns are established._

