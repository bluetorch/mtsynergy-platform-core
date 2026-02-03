# SC-801 Recommendations - Innovation Ideas

_Created: 2026-02-03_
_RIPER Mode: INNOVATE_

## Overview

Brainstorming implementation approaches for 10 recommendations from SC-801-REVIEW.md. These are POSSIBILITIES, not decisions.

## Critical Recommendations

### 1. BFF Spec URL Environment Variable

**Goal**: Replace hardcoded URL with configurable environment variable

**Options:**
- A) Shell parameter expansion: `${BFF_SPEC_URL:-https://bff.mtsynergy.internal/api/spec.json}`
  - ✅ Simple, no infrastructure changes
  - ✅ Works in any shell/CI environment
  - ⚠️ Default still hardcoded in buildspec
  
- B) OneDev Secret Management
  - ✅ Centralized, secure
  - ✅ Per-environment configuration
  - ⚠️ Requires OneDev admin access
  - ⚠️ Not documented how to configure
  
- C) Config file approach (`.env`, `config.yml`)
  - ✅ Supports multiple environments easily
  - ✅ Can include other config (timeouts, retries)
  - ⚠️ Adds file management complexity

**Recommendation**: Option A for simplicity, can upgrade to B later

### 2. Lock OpenAPI Generator Version

**Goal**: Prevent unexpected behavior from major version updates

**Options:**
- A) Remove caret: `2.28.0` instead of `^2.28.0`
  - ✅ Simple one-character change
  - ✅ Still allows `npm update` when intentional
  - ⚠️ Might miss security patches
  
- B) Git SHA pinning: `github:OpenAPITools/openapi-generator-cli#abc123`
  - ✅ Ultimate stability
  - ⚠️ Hard to update, confusing syntax
  
- C) Vendor generator binary
  - ✅ Complete control
  - ⚠️ Large binary, maintenance burden

**Recommendation**: Option A - industry standard approach

### 3. Integration Test for Real BFF Spec

**Goal**: Validate generated types match expected shape

**Test Strategy Options:**
- A) Mock BFF server (MSW, nock)
  - ✅ Fast, deterministic
  - ⚠️ Doesn't catch real BFF drift
  
- B) Hit real BFF in CI
  - ✅ Most realistic
  - ⚠️ Fragile (network, BFF availability)
  - ⚠️ Requires BFF to be running
  
- C) Contract testing (Pact)
  - ✅ Industry standard for API evolution
  - ✅ Catches breaking changes early
  - ⚠️ Learning curve, infrastructure overhead
  
- D) Snapshot testing
  - ✅ Simple, catches all changes
  - ✅ Easy to review diffs
  - ⚠️ Needs manual review to determine if change is valid

**Validation Approach:**
```typescript
// Pseudo-code for validation
const criticalTypes = [
  'CreateDraftRequest',
  'CreateDraftResponse',
  'InboxItem',
  'ListInboxResponse',
  'Platform'
];

criticalTypes.forEach(type => {
  expect(generatedExports).toHaveProperty(type);
  expect(typeof generatedExports[type]).toBe('function' | 'object');
});
```

**Recommendation**: Combination of D (snapshots) + custom assertion script

### 4. Publishing Strategy

**Goal**: Define how package gets to npm registry

**Registry Options:**
- A) OneDev internal registry (already configured)
  - ✅ Already in package.json publishConfig
  - ✅ Keeps package private
  - ⚠️ Requires VPN/network access
  
- B) npm public registry
  - ✅ Widely accessible
  - ⚠️ Makes code public (licensing concern?)
  
- C) GitHub Packages
  - ✅ Tied to repo, good access control
  - ⚠️ Requires GitHub auth in .npmrc
  
- D) Hybrid (internal for dev, public for prod)
  - ✅ Best of both worlds
  - ⚠️ Complex CI/CD logic

**Versioning:**
- Semantic versioning (major.minor.patch)
- Auto-bump on merge to main (conventional commits)
- Git tags for releases

**CI/CD Publishing Flow:**
```yaml
- name: Publish Package
  condition: branch == 'main' && !pr
  commands:
    - npm version patch -m "Release %s"
    - npm publish
```

**Recommendation**: Start with A (OneDev), document for future migration to B/C

## High Priority Recommendations

### 5. Expand Export Paths

**Goal**: Enable `import { ... } from '@mtsynergy/platform-core/constants'`

**Structural Options:**
- A) Create directories now, populate later
  ```
  src/
    types/index.ts (empty barrel for now)
    constants/index.ts (empty barrel for now)
    utils/index.ts (empty barrel for now)
  ```
  - ✅ Prevents future breaking changes
  - ✅ Clear project structure
  - ⚠️ Empty exports might confuse consumers
  
- B) Add exports only when features implemented (SC-802, SC-803)
  - ✅ Clean, no empty exports
  - ⚠️ Breaking change when added (minor version bump)
  
- C) Conditional exports with helpful errors
  ```typescript
  export * from './types/index.js';
  // If empty: throw new Error('Types not yet implemented - coming in v0.2.0')
  ```
  - ✅ Developer-friendly
  - ⚠️ Runtime errors vs compile-time

**package.json Exports:**
```json
{
  "exports": {
    ".": { "import": "./dist/index.mjs", ... },
    "./types": { "import": "./dist/types/index.mjs", ... },
    "./constants": { "import": "./dist/constants/index.mjs", ... },
    "./utils": { "import": "./dist/utils/index.mjs", ... }
  }
}
```

**Recommendation**: Option A - create structure now, mark as experimental in README

### 6. BFF Spec Validation

**Goal**: Fail build if critical types missing from generated output

**Implementation Options:**
- A) Custom Node.js validation script
  ```javascript
  // scripts/validate-types.js
  const types = require('./src/openapi/index.ts');
  const required = ['CreateDraftRequest', 'InboxItem', ...];
  required.forEach(type => {
    if (!types[type]) throw new Error(`Missing: ${type}`);
  });
  ```
  - ✅ Simple, explicit
  - ✅ Easy to customize
  - ⚠️ Requires transpilation or ts-node
  
- B) TypeScript compilation test
  ```typescript
  // src/__tests__/type-exports.test.ts
  import type {
    CreateDraftRequest,
    InboxItem,
    // ... all critical types
  } from '../openapi';
  
  // If import fails, tsc will error
  ```
  - ✅ Type-level validation
  - ✅ No runtime cost
  - ⚠️ Doesn't validate runtime exports
  
- C) JSON Schema validation of OpenAPI spec
  - ✅ Validates before generation
  - ✅ Catches malformed specs
  - ⚠️ Doesn't validate post-generation

**Recommendation**: Combination of B (compile-time) + A (CI/CD runtime check)

### 7. API Response Wrapper Types

**Goal**: Standardized `ApiSuccessResponse<T>` and `ApiErrorResponse`

**Design Options:**
- A) Simple generic interfaces
  ```typescript
  interface ApiSuccessResponse<T> {
    status: 'success';
    data: T;
  }
  interface ApiErrorResponse {
    status: 'error';
    error: { code: string; message: string };
  }
  ```
  - ✅ Simple, TypeScript-native
  - ✅ Good type inference
  - ⚠️ Manual type narrowing
  
- B) Discriminated union with type guards
  ```typescript
  type ApiResponse<T> = 
    | { status: 'success'; data: T }
    | { status: 'error'; error: { code: string; message: string } };
  
  function isSuccess<T>(r: ApiResponse<T>): r is { status: 'success'; data: T } {
    return r.status === 'success';
  }
  ```
  - ✅ Exhaustive type checking
  - ✅ Type guards enable smart narrowing
  - ⚠️ More verbose
  
- C) Result/Either pattern (functional)
  ```typescript
  type Result<T, E> = Success<T> | Failure<E>;
  class Success<T> { constructor(public value: T) {} }
  class Failure<E> { constructor(public error: E) {} }
  ```
  - ✅ Functional programming pattern
  - ✅ Chainable methods (map, flatMap)
  - ⚠️ Runtime overhead
  - ⚠️ Learning curve
  
- D) Class-based with helpers
  ```typescript
  class ApiResponse<T> {
    static success<T>(data: T) { ... }
    static error(error: Error) { ... }
    isSuccess(): this is SuccessResponse<T> { ... }
  }
  ```
  - ✅ Encapsulation
  - ⚠️ Bundle size impact

**Recommendation**: Option B - discriminated unions are TypeScript best practice

## Nice-to-Have Recommendations

### 8. Generate API Client Classes

**Goal**: Optional generation of InboxAPI, PublishingAPI client classes

**Considerations:**
- TypeScript-fetch generator supports `--additional-properties=withInterfaces=true`
- Would enable: `const api = new InboxAPI(); await api.listInbox();`
- Bundle size impact: ~15-30KB additional
- Might duplicate MFE HTTP client logic

**Options:**
- A) Generate to separate export path `@mtsynergy/platform-core/api-client`
- B) Separate package `@mtsynergy/platform-api-client`
- C) Skip for now, revisit if MFEs request it

**Recommendation**: Option C - types-only is cleaner for shared library

### 9. VSCode Snippets

**Goal**: Help developers discover and use platform-core types

**Snippet Ideas:**
```json
{
  "Import OpenAPI Types": {
    "prefix": "imp-openapi",
    "body": "import { $1 } from '@mtsynergy/platform-core/openapi';"
  },
  "API Success Response": {
    "prefix": "api-success",
    "body": "const response: ApiSuccessResponse<$1> = { status: 'success', data: $2 };"
  }
}
```

**Distribution Options:**
- A) Include in package `.vscode/` directory
- B) Separate VSCode extension
- C) Documentation examples only

**Recommendation**: Option A - low-effort, high-value

### 10. Pre-commit Hook for Type Generation

**Goal**: Auto-update types when spec changes

**Considerations:**
- Requires Java 21 locally (openapi-generator dependency)
- Adds 5-10s to every commit
- Might conflict with fast-paced development

**Hook Options:**
- A) Husky + lint-staged (industry standard)
  ```json
  "husky": {
    "hooks": {
      "pre-commit": "npm run generate:types && git add src/openapi"
    }
  }
  ```
  
- B) Simple Git hook script
  ```bash
  #!/bin/sh
  # .git/hooks/pre-commit
  npm run generate:types
  git add src/openapi
  ```
  
- C) CI-only validation (no local hook)
  - Validate types are up-to-date in CI
  - Fail if developer forgot to regenerate

**Recommendation**: Option C - CI validation without local friction

## Decisions Made (2026-02-03)

1. **Scope**: ✅ Implement recommendations 1-7 (Critical + High Priority), SKIP 8-10 (Nice-to-Have)
2. **API Response Types**: ✅ Discriminated unions (Option B)
3. **Export Paths**: ✅ Create directory structure now (Option A)
4. **Publishing Target**: ✅ OneDev internal registry only (Apache 2.0 license but private distribution)
5. **API Client Generation**: ✅ Types-only, no client classes
6. **Critical Types List**: ✅ PROPOSED - Awaiting confirmation:
   - Tier 1 (MUST exist): CreateDraftRequest, CreateDraftResponse, InboxItem, Platform
   - Tier 2 (SHOULD exist, warn): ListInboxResponse, ListInboxResponsePagination

## Next Steps

After user feedback on these options:
1. Enter PLAN mode to create detailed implementation plan
2. Create numbered checklist for approved approaches
3. Get plan approval
4. Enter EXECUTE mode with approved plan
