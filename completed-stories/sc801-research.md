# SC-801 Research: OpenAPI Type Generation

_Created: 2026-02-03_
_Mode: RESEARCH_
_Status: In Progress_

## Story Overview

**Story ID:** SC-801-CORE  
**Title:** Auto-generate TypeScript types from BFF OpenAPI spec  
**Owner:** platform-core team  
**Consumer Projects:** platform-shell, platform-mfe-*, platform-mobile  
**Status:** Feature Development Ready

## User Story Definition

### Core Requirements

1. **Type Generation on OpenAPI Spec Updates**
   - Triggered by CI/CD when `platform-bff` OpenAPI spec changes
   - Tool: `openapi-generator-cli`
   - Output: `src/openapi/index.ts` (TypeScript module)
   - Types generated: `CreateDraftRequest`, `CreateDraftResponse`, `InboxItem`, `Metrics`, etc.

2. **On-Demand Generation**
   - Command: `npm run generate:types`
   - Developers can manually regenerate without CI/CD
   - Should preserve backwards compatibility

3. **Backwards Compatibility**
   - No breaking type changes across versions
   - Version changes follow semantic versioning:
     - MAJOR: Breaking type changes (type removed, API redesigned)
     - MINOR: New types/constants added, backwards-compatible
     - PATCH: Bug fixes, internal refactoring

## Technical Context

### BFF OpenAPI Specification Source

**Location:** `platform-bff/.onedev-buildspec.yml`

The BFF (Kotlin/Spring Boot) generates an OpenAPI 3.0 specification that serves as the single source of truth for all API contracts. This spec includes:

- **Endpoints:** REST endpoints with request/response schemas
- **Request/Response Models:** DTOs for all API operations
- **Error Models:** Standard error response structure
- **Security Schemes:** OAuth, JWT, API key definitions
- **Content Types:** JSON, form-data, file uploads

### OpenAPI Generation Flow (Current BFF CI/CD)

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

**Flow:**
1. BFF builds and generates OpenAPI spec at `build/openapi.json`
2. BFF CI/CD reads `platform-core/openapi-generator.config.yml`
3. Runs `openapi-generator-cli` to generate TypeScript types
4. Submits PR to platform-core with generated types
5. CI/CD validates new types (linting, type-checking, tests pass)
6. Manual approval → merge → npm publish

### Expected Type Examples

Based on domain model requirements, the generated `src/openapi/index.ts` will contain:

```typescript
// Types for Publishing domain
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

export interface UpdateDraftRequest {
  caption?: string;
  platforms?: Platform[];
  scheduledAt?: ISO8601DateTime;
  mediaIds?: string[];
}

// Types for Inbox domain
export interface InboxItem {
  id: string;
  workspaceId: string;
  platform: Platform;
  platformItemId: string;
  author: string;
  content: string;
  contentType: 'COMMENT' | 'MESSAGE' | 'MENTION';
  status: 'NEW' | 'ASSIGNED' | 'RESOLVED' | 'SPAM';
  createdAt: ISO8601DateTime;
}

export interface ListInboxResponse {
  items: InboxItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// Types for Metrics domain
export interface Metrics {
  reach: number;
  reachPrevious: number;
  engagement: number;
  engagementPrevious: number;
  impressions: number;
  impressionsPrevious: number;
  growth: number;
}

export interface Report {
  id: string;
  modules: string[];
  dateRange: {
    from: ISO8601DateTime;
    to: ISO8601DateTime;
  };
  format: 'PDF' | 'CSV';
  status: 'PENDING' | 'READY' | 'FAILED';
  downloadUrl?: string;
  createdAt: ISO8601DateTime;
}

// Common/API types
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
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: ISO8601DateTime;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Enum types
export type Platform = 'twitter' | 'tiktok' | 'facebook' | 'instagram' | 'linkedin' | 'youtube';
export type ISO8601DateTime = string; // ISO8601 format validation should happen at runtime
```

## Current State Analysis

### What Exists

1. ✅ **Project Structure Ready**
   - `src/openapi/` directory planned
   - `src/openapi/index.ts` ready for generated content
   - Placeholder content: `export interface ApiResponse<T> { ... }`

2. ✅ **Build System Ready**
   - Vite configured for library output
   - TypeScript build chain via tsc
   - ESM + CJS export configured

3. ✅ **Testing Framework Ready**
   - Vitest configured
   - Coverage thresholds: 80%
   - Test infrastructure in place

4. ✅ **npm Scripts Ready**
   - `npm run build` works
   - `npm run lint` works
   - `npm run test` works
   - Ready to add `npm run generate:types`

### What's Missing

1. ❌ **openapi-generator-cli Dependency**
   - Not yet installed
   - Needs to be added to devDependencies

2. ❌ **openapi-generator.config.yml**
   - Configuration file not yet created
   - Must specify:
     - Input: Remote URL to BFF OpenAPI spec (or local file)
     - Output: `src/openapi/index.ts`
     - Language: TypeScript
     - Generator options (strict types, no null safety workarounds)

3. ❌ **generate:types npm Script**
   - Not yet added to package.json scripts
   - Command: `openapi-generator-cli generate -c openapi-generator.config.yml`

4. ❌ **Mock BFF OpenAPI Spec (for development)**
   - For local development/testing without BFF
   - Can be stored as `openapi/bff-spec-mock.json`
   - Used when running `npm run generate:types` locally

5. ❌ **Generated Type Tests**
   - Tests to verify generated types are importable
   - Tests to verify type structure matches expected schema
   - Integration test with mock OpenAPI spec

6. ❌ **CI/CD Integration**
   - BFF → platform-core type generation hook not yet configured
   - Merge request automation not yet set up
   - Type validation in CI/CD not yet configured

## Dependency Investigation

### openapi-generator-cli

**Purpose:** CLI tool for generating code from OpenAPI specifications

**Key Info:**
- npm package: `@openapitools/openapi-generator-cli`
- Supports TypeScript generation (uses TypeScript templates)
- Configurable via YAML file or CLI arguments
- Outputs to disk (can be `src/openapi/index.ts`)

**Installation:**
```bash
npm install --save-dev @openapitools/openapi-generator-cli
```

**Version Considerations:**
- Latest stable: 2.x (actively maintained)
- Requires Java runtime (JVM) on system
  - Check: `java -version` (must be ≥ Java 11)
  - May need to install via Homebrew on macOS: `brew install java` or `brew install openjdk`

**Configuration File Format (YAML):**
```yaml
# openapi-generator.config.yml
generatorName: typescript-fetch
inputSpec: https://platform-bff.mtsynergy.internal/api/v1/openapi.json
outputDir: src/openapi
packageName: '@mtsynergy/core'
typescriptVersion: 5.3
useRxJS: false
modelPackage: ''
exportModels: true
exportOperations: false
```

### TypeScript Version Compatibility

- **Current:** TypeScript 5.3.3
- **openapi-generator-cli:** Supports TS 4.0+
- **No compatibility issues**

### Java Runtime Requirement

**Critical Discovery:** `openapi-generator-cli` requires Java 11+ on the system running `npm run generate:types`

- Developers must have Java installed
- CI/CD must have Java available in build environment
- This is acceptable (OneDev has Java in containers)

## Architecture Decisions

### Type Generation Strategy

**Option A: Full Endpoint Client Generation (Rejected)**
- Generate full API client with methods for all endpoints
- Pro: Developers don't write fetch boilerplate
- Con: Couples platform-core to BFF contract changes
- Con: Difficult to maintain backwards compatibility

**Option B: Types-Only Generation (Selected) ✅**
- Generate only TypeScript interface/type definitions
- No runtime client code
- Pro: Types can be used with any HTTP client
- Pro: Easy to maintain backwards compatibility
- Pro: Lighter package size
- Implementation: Use `typescript-fetch` generator with `exportOperations: false`

### OpenAPI Spec Source

**Option A: Remote URL (Current Plan)**
- Source: `https://platform-bff.mtsynergy.internal/api/v1/openapi.json`
- Pro: Always reflects current BFF state
- Con: Requires BFF to be running/accessible
- Con: CI/CD dependency on BFF availability

**Option B: Local File in platform-bff**
- Source: Git-tracked `openapi.json` file
- Pro: Version controlled with BFF
- Pro: No external dependencies for generation
- Con: Must be manually kept in sync with BFF code

**Recommended Hybrid Approach:**
- Primary: Fetch from BFF in CI/CD (OneDev pipeline)
- Fallback: Developers can use local mock spec for development
- Store mock at: `openapi/bff-spec-mock.json`

### Configuration File Location

**Decision:** Place `openapi-generator.config.yml` at project root

Reasoning:
- Easy to find
- Follows npm package convention (alongside package.json, tsconfig.json, etc.)
- Referenced in BFF CI/CD pipeline

### Type Export Strategy

**Decision:** Export from `src/openapi/index.ts`

```typescript
// src/openapi/index.ts (auto-generated)
export * from './generated/index'; // Re-export from openapi-generator output
```

Alternative: Generate directly to `src/openapi/index.ts`
- Simpler, no re-export needed
- openapi-generator must be configured with `outputDir: src/openapi` and `packageName: index`

## Development Workflow

### Local Development (Without BFF Running)

```bash
# 1. Generate types from mock OpenAPI spec
npm run generate:types -- --input-spec openapi/bff-spec-mock.json

# 2. Verify types generated
ls -la src/openapi/

# 3. Run tests to verify types work
npm run test

# 4. Commit generated files (if including mock)
git add src/openapi/ openapi/bff-spec-mock.json
```

### CI/CD Workflow (With BFF)

```bash
# BFF CI/CD pipeline triggers on every build:

# 1. BFF generates OpenAPI spec at build/openapi.json
# 2. platform-core receives webhook or scheduled job
# 3. Pull latest BFF OpenAPI spec
npm run generate:types -- --input-spec https://platform-bff:8080/api/v1/openapi.json

# 4. Run validation (linting, type-checking, tests)
npm run lint
npm run type-check
npm run test

# 5. If all pass, create PR with new types
# 6. Manual approval and merge
```

## Implementation Roadmap

### Phase 1: Setup (PLAN mode → EXECUTE)
- [ ] Decide on openapi-generator-cli version
- [ ] Create `openapi-generator.config.yml`
- [ ] Create mock BFF OpenAPI spec (`openapi/bff-spec-mock.json`)
- [ ] Add `@openapitools/openapi-generator-cli` dependency
- [ ] Add `npm run generate:types` script
- [ ] Test manual type generation locally

### Phase 2: Testing (PLAN mode → EXECUTE)
- [ ] Create test file: `src/__tests__/openapi.test.ts`
- [ ] Tests verify generated types are importable
- [ ] Tests verify type structure (fields, optional props)
- [ ] Tests verify backwards compatibility checks
- [ ] Ensure 80% coverage maintained

### Phase 3: Integration (EXECUTE + REVIEW)
- [ ] Validate generated types pass linting
- [ ] Verify build includes generated types
- [ ] Verify npm package exports generated types correctly
- [ ] Test ESM and CJS consumption of generated types
- [ ] Document for developers

### Phase 4: CI/CD Integration (Future - Not in SC-801)
- [ ] BFF webhook → platform-core type generation
- [ ] Automated PR creation for type updates
- [ ] Type validation in CI/CD

## Risk Assessment

### Risks

1. **Java Dependency**
   - Risk: Developers without Java installed can't generate types
   - Mitigation: Document Java requirement; provide Dockerfile for CI/CD
   - Severity: Medium

2. **BFF Spec Changes Break Types**
   - Risk: Incompatible changes in BFF OpenAPI spec
   - Mitigation: Semantic versioning; maintain breaking change policy
   - Severity: Low (managed at BFF level)

3. **Generated Code Quality**
   - Risk: openapi-generator outputs unusable or non-idiomatic code
   - Mitigation: Configure generator carefully; review output manually once
   - Severity: Medium (can be addressed with config tweaks)

4. **Large Generated Files**
   - Risk: Type definitions become very large, slow build
   - Mitigation: Monitor file size; consider splitting types by domain
   - Severity: Low (TypeScript compilation is fast)

## Questions & Decisions Needed

### Q1: Should we generate the full API client?
**A:** No - types-only approach. Less coupling, easier to maintain backwards compatibility.

### Q2: Where does the BFF OpenAPI spec come from?
**A:** Primary: Remote URL `https://platform-bff.mtsynergy.internal/api/v1/openapi.json` (CI/CD)  
Fallback: Local mock file for developers

### Q3: Should generated types be committed to git?
**A:** Yes - for deterministic builds. Developers can diff type changes in PRs.

### Q4: How do we ensure backwards compatibility?
**A:** 
- Semantic versioning (major bump for breaking changes)
- Code review of type changes
- Automated breaking change detection (future tooling)

### Q5: Do we need a separate npm script for mock spec?
**A:** No - developers use `--input-spec openapi/bff-spec-mock.json` flag

## Success Criteria

✅ **Development Ready When:**
1. `npm run generate:types` produces `src/openapi/index.ts` with valid TypeScript
2. Generated types import successfully in tests and are used
3. All tests pass (≥80% coverage maintained)
4. Generated types work in both ESM and CJS contexts
5. Documentation updated with usage examples
6. No TypeScript errors or ESLint violations in generated code

## Related Stories

- **SC-802:** Shared Constants (depends on SC-801 infrastructure)
- **SC-803:** Validation & Utilities (may use types from SC-801)
- **SC-804-808:** Observability utilities (may use types from SC-801)

## References

- [User Stories - SC-801](../USER_STORIES.md#type-generation-sc-801)
- [OpenAPI Generator CLI Docs](https://openapi-generator.tech/)
- [SPECIFICATION.md - Observability](../SPECIFICATION.md#56-observability--error-tracking)
- [BFF Contract: API Response Types](#expected-type-examples)

---

_End of SC-801 Research Document_
