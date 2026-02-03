# Project Brief

_Version: 1.0_
_Created: 2026-02-03_
_Last Updated: 2026-02-03_

## Project Overview

**Project Name:** platform-core  
**Package Name:** @mtsynergy/platform-core  
**Type:** Shared TypeScript Library  
**Version:** 0.0.1

**Purpose:** Provides auto-generated TypeScript types, platform-specific validation constants, formatting utilities, and localization support for all MTSynergy frontend and mobile applications.

**Parent Project:** MTSynergy - Social media management platform achieving full functional parity with Agorapulse

**Distribution:** Published to OneDev internal npm registry, deployed to CloudFlare R2 CDN for browser consumption via import maps

**Consumers:**

- platform-shell (Micro Frontend Shell)
- platform-mfe-\* (All Micro Frontend applications)
- platform-mobile (React Native iOS/Android)
- platform-bff (Kotlin/Spring Boot - for API error localization)

## Development Phases

**Phase 1: Scaffolding** ✅ COMPLETE (2026-02-03)
- Vite + TypeScript build system (dual ESM+CJS)
- Vitest testing framework with coverage
- ESLint + Prettier code quality
- All npm scripts (build, test, lint, format, type-check)
- CI simulation validated

**Phase 2: Feature Development** - Ready to Start
- SC-801: OpenAPI type generation
- SC-802: Platform constants
- SC-803: Validators & formatters
- SC-804: i18n strings & localization

### Must-Have Features

#### SC-801: Auto-Generated Types from BFF OpenAPI

- [ ] OpenAPI type generation pipeline (openapi-generator-cli)
- [ ] Auto-trigger on BFF OpenAPI spec updates via OneDev CI/CD
- [ ] Generate TypeScript interfaces in `src/openapi/index.ts`
- [ ] Backward compatibility enforcement (no breaking changes in patch/minor)
- [ ] Types: `CreateDraftRequest`, `CreateDraftResponse`, `InboxItem`, `Metrics`, etc.
- [ ] Semantic versioning automation (patch/minor/major based on change type)

#### SC-802: Platform-Specific Constants

- [ ] `PLATFORM_CONFIGS` - Twitter, TikTok, Facebook, Instagram, LinkedIn, YouTube configs
- [ ] Character limits, video requirements, supported formats per platform
- [ ] `VIDEO_REQUIREMENTS` - Resolution, bitrate, codec, fps constraints
- [ ] `WORKSPACE_ROLES` - ['OWNER', 'ADMIN', 'MEMBER']
- [ ] `SOCIAL_ROLES` - ['ADMIN', 'MODERATOR', 'EDITOR', 'GUEST']
- [ ] `TIMEZONES` - All IANA timezone strings

#### SC-803: Validation & Formatting Utilities

- [ ] `validateCaption(text, platforms)` - Check length limits per platform
- [ ] `validateVideoFile(file)` - Verify codec, resolution, bitrate
- [ ] `validateEmail(email)` - Email format validation
- [ ] `validateUrl(url)` - URL format validation
- [ ] `formatDate(date, locale)` - Localized date formatting
- [ ] `formatNumber(num, style)` - Formatted numbers (1.5K, 50%)
- [ ] `formatMetric(value, metric)` - Short metric notation (150K reach)

#### I18N-1101/1102/1103: Localization Support

- [ ] Translation strings for all supported locales (en-US, es-ES, fr-FR, de-DE, ja-JP)
- [ ] Translation keys: `labels.*`, `messages.*`, `errors.*`
- [ ] `t(key, locale, params)` - Translation function with parameter interpolation
- [ ] Locale-aware date/number formatting
- [ ] Fallback to en-US for missing translations
- [ ] BFF API error message localization support
- [ ] React Native i18n integration support

### Nice-to-Have Features

- [ ] Optional API client for Node.js/React Native (`src/generated/api.ts`)
- [ ] Lightweight API utilities (`createApiClient()`, `handleApiError()`)
- [ ] JSDoc auto-generated documentation
- [ ] Type-safe translation key autocomplete
- [ ] Storybook documentation for utility functions
- [ ] Performance benchmarks for validators/formatters

## Success Criteria

1. **Type Safety**: All consuming projects (Shell, MFEs, Mobile) have TypeScript autocomplete for BFF API responses
2. **Validation Accuracy**: 0 false positives/negatives in platform-specific validation (caption length, video requirements)
3. **Test Coverage**: 80%+ overall coverage, 95%+ for critical validators/formatters
4. **Build Performance**: Type generation completes in < 30 seconds on BFF spec update
5. **Bundle Size**: Browser-optimized exports < 50KB (types + constants + utils, tree-shaken)
6. **Localization Coverage**: 100% of user-facing strings available in 5 target locales
7. **Breaking Change Protection**: CI/CD fails build if breaking changes detected in patch/minor version bump
8. **Compatibility**: Works in Browser (ES2020), Node.js 20+, React Native (Hermes engine)
9. **Documentation**: All exported functions have JSDoc with usage examples
10. **Zero Runtime Errors**: Validators handle all edge cases (null, undefined, empty strings, extreme values)

## Scope

### In Scope

- **Auto-generated TypeScript types** from BFF OpenAPI specification
- **Platform configuration constants** (Twitter, TikTok, Facebook, Instagram, LinkedIn, YouTube)
- **Validation utilities** for captions, videos, emails, URLs
- **Formatting utilities** for dates, numbers, metrics (locale-aware)
- **Translation strings** for 5 locales (en-US, es-ES, fr-FR, de-DE, ja-JP)
- **i18n utilities** with parameter interpolation and fallback support
- **Optional API client generation** for Node.js/React Native (not for browsers)
- **Lightweight API helpers** (`createApiClient()`, `handleApiError()`)
- **Comprehensive test suite** with 80%+ coverage
- **CI/CD pipeline integration** for automated type generation and publishing
- **Semantic versioning** with backward compatibility enforcement
- **ESM + CJS dual exports** for maximum compatibility
- **CloudFlare R2 CDN deployment** for browser import maps
- **OneDev npm registry publishing** for internal consumption

### Out of Scope

- **Heavy API client code for browsers** (Shell/MFEs use native fetch)
- **UI components** (handled by platform-design-system)
- **State management** (handled by individual consuming projects)
- **Runtime API calls** (this is a types/utils library, not a service)
- **Authentication logic** (handled by BFF and consuming applications)
- **Database schemas** (backend concern)
- **Direct social platform API integrations** (handled by Core Microservices)
- **Media encoding/transcoding** (handled by separate media service)
- **Business logic** (validation only, not business rules)
- **E2E testing** (integration tests in consuming projects)

## Timeline

**Phase 1: Foundation (Week 1-2)**

- Project structure setup
- TypeScript configuration
- Basic types and constants
- Initial validation utilities

**Phase 2: OpenAPI Integration (Week 3)**

- openapi-generator-cli integration
- CI/CD pipeline for auto-generation
- Backward compatibility tooling

**Phase 3: Localization (Week 4)**

- Translation file structure
- i18n utilities implementation
- Locale-aware formatting

**Phase 4: Testing & Documentation (Week 5)**

- Comprehensive test suite
- JSDoc documentation
- Usage examples

**Phase 5: Distribution (Week 6)**

- npm package publishing
- CloudFlare R2 CDN deployment
- Import map configuration

## Stakeholders

**Primary Consumers:**

- **platform-shell team** - Needs types, constants, utils via CDN import maps
- **platform-mfe-\* teams** - Needs shared types for cross-MFE communication
- **platform-mobile team** - Needs validators for offline functionality
- **platform-bff team** - Triggers type generation, uses i18n for API errors

**Maintainers:**

- **Platform Core Team** - Owns this library, reviews auto-generated PRs

**Stakeholder Needs:**

1. **Frontend Teams**: Type safety, validation for user inputs, consistent formatting
2. **Mobile Team**: Offline validation, locale-aware formatting, small bundle size
3. **BFF Team**: Localized API error messages, shared type definitions
4. **DevOps**: Automated CI/CD, reliable versioning, minimal manual intervention

---

_This file is populated during the START Phase and updated when major requirements change._
