# SC-801 Review Recommendations - Implementation Plan

_Created: 2026-02-03_
_RIPER Mode: PLAN_
_Status: AWAITING APPROVAL_

## Overview

Implementation plan for SC-801 review recommendations 1-7 (Critical + High Priority). Skipping recommendations 8-10 (Nice-to-Have) as per user direction.

## Scope

**Implementing:**
1. ✅ Configure BFF Spec URL via environment variable (Critical)
2. ✅ Lock OpenAPI Generator version (Critical)
3. ✅ Add integration test for real BFF spec (Critical)
4. ✅ Define publishing strategy (Critical - documentation only)
5. ✅ Expand export paths in package.json (High Priority)
6. ✅ Add BFF Spec URL validation (High Priority)
7. ✅ Implement API response wrapper types (High Priority)

**NOT Implementing:**
8. ❌ Generate OpenAPI API Client Classes (Nice-to-Have)
9. ❌ Add VSCode Snippets (Nice-to-Have)
10. ❌ Monitor Generated Code Quality / Pre-commit hooks (Nice-to-Have)

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Integration test execution | Runnable locally (`npm run test:integration`) | Developer-friendly, supports offline dev |
| Type validation execution | Separate script (`npm run validate:types`) | Clear separation of concerns, reusable |
| Export path placeholders | Empty objects (`export {};`) | Prevents import failures, future-proof |
| API Response types location | `src/types/api.ts` | Aligns with `./types` export path |
| CI validation failure behavior | Fail "Generate Types from BFF" step (non-optional in CI) | Catches issues early without blocking local dev |
| Critical types (Tier 1) | CreateDraftRequest, CreateDraftResponse, InboxItem, Platform | Core domain models, must exist |
| Critical types (Tier 2) | ListInboxResponse, ListInboxResponsePagination | Essential supporting types, warn if missing |

## File Changes Summary

### Files to Modify
1. `package.json` - Lock version, add scripts, expand exports
2. `.onedev-buildspec.yml` - Environment variable, validation step
3. `src/index.ts` - Export new types module
4. `DEVELOPMENT.md` - Document publishing process

### Files to Create
5. `src/types/api.ts` - API response wrapper types with type guards
6. `src/types/index.ts` - Types module barrel export
7. `src/constants/index.ts` - Constants placeholder (empty for now)
8. `src/utils/index.ts` - Utils placeholder (empty for now)
9. `scripts/validate-types.js` - Type validation script
10. `src/__tests__/bff-spec.test.ts` - Integration test for real BFF spec
11. `src/__tests__/api-response-types.test.ts` - Unit tests for API response types

### Files to Review (no changes needed)
- `src/openapi/index.ts` - Already exports generated types
- `tsconfig.json` - Already configured properly
- `vite.config.ts` - Should handle new directories automatically

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Lock Dependencies (Recommendation 2)

**Goal:** Prevent unexpected behavior from OpenAPI generator updates

1. [ ] Modify `package.json` line 48: Change `"@openapitools/openapi-generator-cli": "^2.28.0"` to `"@openapitools/openapi-generator-cli": "2.28.0"` (remove caret)

### Phase 2: API Response Wrapper Types (Recommendation 7)

**Goal:** Standardized response formats for all API calls

2. [ ] Create `src/types/api.ts` with:
   - `ApiSuccessResponse<T>` interface with status, data, optional meta
   - `ApiErrorResponse` interface with status, error object (code, message, details, fields)
   - `ApiResponse<T>` discriminated union type
   - `isSuccessResponse<T>()` type guard function
   - `isErrorResponse<T>()` type guard function
   - Full JSDoc comments for all types

3. [ ] Create `src/types/index.ts` with:
   - Barrel export: `export * from './api';`

4. [ ] Create `src/__tests__/api-response-types.test.ts` with tests for:
   - ApiSuccessResponse structure validation
   - ApiErrorResponse structure validation
   - Type guard functions (isSuccessResponse, isErrorResponse)
   - TypeScript type narrowing behavior
   - Optional meta fields

5. [ ] Modify `src/index.ts`:
   - Add export: `export * from './types';` (after line 14, before openapi exports)

6. [ ] Run tests to validate: `npm run test`

### Phase 3: Expand Export Paths (Recommendation 5)

**Goal:** Enable sub-path imports for future modules

7. [ ] Modify `package.json` exports section (lines 9-18):
   - Add `"./types"` export with import/require paths to `./dist/types/index.mjs` and `./dist/types/index.cjs`
   - Add `"./constants"` export with import/require paths to `./dist/constants/index.mjs` and `./dist/constants/index.cjs`
   - Add `"./utils"` export with import/require paths to `./dist/utils/index.mjs` and `./dist/utils/index.cjs`
   - Keep existing `"."` export unchanged

8. [ ] Create `src/constants/index.ts` with:
   - Empty export object: `export {};`
   - TODO comment: `// TODO: Implement in SC-802 (PLATFORM_CONFIGS, VIDEO_REQUIREMENTS, WORKSPACE_ROLES, SOCIAL_ROLES, TIMEZONES)`

9. [ ] Create `src/utils/index.ts` with:
   - Empty export object: `export {};`
   - TODO comment: `// TODO: Implement in SC-803 (validation and formatting utilities)`

10. [ ] Run build to validate exports: `npm run build`

11. [ ] Test new export paths work:
    - Create temp test file importing from `@mtsynergy/platform-core/types`
    - Create temp test file importing from `@mtsynergy/platform-core/constants`
    - Create temp test file importing from `@mtsynergy/platform-core/utils`
    - Verify no import errors (even if exports are empty)

### Phase 4: Type Validation Script (Recommendation 6)

**Goal:** Validate generated types contain all critical exports

12. [ ] Create `scripts/` directory (if it doesn't exist)

13. [ ] Create `scripts/validate-types.js` with:
   - Dynamic import of `src/openapi/index.ts` (or built version)
   - TIER_1_TYPES array: `['CreateDraftRequest', 'CreateDraftResponse', 'InboxItem', 'Platform']`
   - TIER_2_TYPES array: `['ListInboxResponse', 'ListInboxResponsePagination']`
   - Validation logic:
     - Check each Tier 1 type exists → exit code 1 if missing
     - Check each Tier 2 type exists → console.warn if missing, continue
   - Colorized output (green for pass, red for fail, yellow for warnings)
   - Exit with code 0 if all Tier 1 types present, code 1 if any missing

14. [ ] Make script executable: `chmod +x scripts/validate-types.js`

15. [ ] Add npm script to `package.json` scripts section:
   - `"validate:types": "node scripts/validate-types.js"`

16. [ ] Test validation script:
   - Run `npm run validate:types` (should pass with current mock spec)
   - Temporarily comment out an export in `src/openapi/index.ts`
   - Run again (should fail with clear error message)
   - Restore export

### Phase 5: BFF Environment Variable (Recommendation 1)

**Goal:** Make BFF spec URL configurable per environment

17. [ ] Modify `.onedev-buildspec.yml` line 48:
   - Change: `- npm run generate:types -- --input-spec https://bff.mtsynergy.internal/api/spec.json`
   - To: `- npm run generate:types -- --input-spec ${BFF_SPEC_URL:-https://bff.mtsynergy.internal/api/spec.json}`

18. [ ] Add validation step in `.onedev-buildspec.yml` after "Generate Types from BFF":
   - New step: "Validate Generated Types"
   - Commands:
     - `npm ci`
     - `npm run validate:types`
   - Make this step NON-optional (no `optional: true`)
   - `onFailure: FAIL_BUILD`
   - Runs ONLY in CI (depends on "Generate Types from BFF" step)

19. [ ] Update `DEVELOPMENT.md` section on type generation:
   - Document `BFF_SPEC_URL` environment variable
   - Explain default value
   - Show example: `BFF_SPEC_URL=https://staging-bff.internal/api/spec.json npm run generate:types`

### Phase 6: Integration Test (Recommendation 3)

**Goal:** Test against real BFF spec to catch drift

20. [ ] Create `src/__tests__/bff-spec.test.ts` with:
   - Test suite: "BFF OpenAPI Spec Integration"
   - Test: "should generate all Tier 1 critical types"
     - Import all Tier 1 types from `../openapi`
     - Assert each type exists and is defined
   - Test: "should generate all Tier 2 supporting types"
     - Import all Tier 2 types from `../openapi`
     - Assert each type exists and is defined
   - Test: "should have correct Platform enum values"
     - Import Platform enum
     - Assert contains: twitter, tiktok, facebook, instagram, linkedin, youtube
   - Test: "should have CreateDraftRequest with required fields"
     - Type-level test: create object matching interface
     - Assert required fields: caption, platforms
     - Assert optional fields work: scheduledAt, mediaIds
   - Mark suite with `.skipIf(!process.env.BFF_SPEC_URL)` for local dev

21. [ ] Add npm script to `package.json` scripts section:
   - `"test:integration": "BFF_SPEC_URL=${BFF_SPEC_URL:-https://bff.mtsynergy.internal/api/spec.json} vitest run src/__tests__/bff-spec.test.ts"`

22. [ ] Update `.onedev-buildspec.yml` "Test" step:
   - Add command after regular tests: `npm run test:integration`
   - This runs BEFORE "Generate Types from BFF" to validate existing types

23. [ ] Test integration test:
   - Run locally (should skip or use mock spec): `npm run test:integration`
   - Verify test structure is correct

### Phase 7: Publishing Documentation (Recommendation 4)

**Goal:** Document publishing process for team

24. [ ] Add new section to `DEVELOPMENT.md` after "Build & Distribution":
   - Section title: "## Publishing to OneDev Registry"
   - Subsection: "### Prerequisites"
     - OneDev npm registry credentials
     - Package version bumping strategy (semantic versioning)
   - Subsection: "### Publishing Process"
     - Step 1: Update version in package.json
     - Step 2: Run full build and tests
     - Step 3: Tag release in Git
     - Step 4: Run `npm publish` (uses publishConfig from package.json)
   - Subsection: "### Registry Configuration"
     - Document `publishConfig.registry` value
     - Note: Apache 2.0 license but internal distribution only
   - Subsection: "### Consuming the Package"
     - How to configure `.npmrc` to use OneDev registry
     - Example: `registry=http://onedev.mtsynergy.internal/lib/npm/`
     - Installation: `npm install @mtsynergy/platform-core`

25. [ ] Add publishing checklist to `DEVELOPMENT.md`:
   ```markdown
   ### Pre-Publish Checklist
   - [ ] All tests passing (`npm run test`)
   - [ ] Type generation successful (`npm run generate:types`)
   - [ ] Type validation passing (`npm run validate:types`)
   - [ ] Build successful (`npm run build`)
   - [ ] Version bumped in package.json
   - [ ] CHANGELOG updated (if exists)
   - [ ] Git tag created
   ```

26. [ ] Add npm script to `package.json` scripts section:
   - `"prepublishOnly": "npm run build && npm run test && npm run validate:types"`
   - This ensures build/tests run before any publish

### Phase 8: Final Validation

**Goal:** Ensure all changes work together

27. [ ] Clean build: `rm -rf dist/ node_modules/`

28. [ ] Fresh install: `npm ci`

29. [ ] Run full CI simulation locally:
   - `npm run type-check`
   - `npm run lint`
   - `npm run test:coverage`
   - `npm run validate:types`
   - `npm run build`

30. [ ] Validate build outputs:
   - Verify `dist/index.mjs` exists
   - Verify `dist/index.cjs` exists
   - Verify `dist/index.d.ts` exists
   - Verify `dist/types/` directory exists with types module
   - Verify `dist/constants/` directory exists (placeholder)
   - Verify `dist/utils/` directory exists (placeholder)

31. [ ] Test module imports:
   - Test ESM: `node test-esm.mjs` (if exists, or create temporary test)
   - Test CJS: Create temp file with `require()` and test
   - Test sub-paths: Import from `/types`, `/constants`, `/utils`

32. [ ] Update Memory Bank:
   - Update `progress.md` with completed recommendations
   - Update `activeContext.md` with current state
   - Document any issues encountered

---

## Detailed Implementation Specifications

### Specification 1: `src/types/api.ts`

**File Path:** `src/types/api.ts`
**Purpose:** API response wrapper types with discriminated unions

**Exact Content:**
```typescript
/**
 * API Response Wrapper Types
 * Standardized response formats for all API calls across MTSynergy platform
 */

/**
 * Successful API response wrapper
 * @template T - The type of data returned in the response
 * @example
 * const response: ApiSuccessResponse<User> = {
 *   status: 'success',
 *   data: { id: '123', name: 'John' },
 *   meta: { timestamp: '2026-02-03T10:00:00Z' }
 * };
 */
export interface ApiSuccessResponse<T> {
  /** Response status - always 'success' for successful responses */
  status: 'success';
  
  /** The actual response data */
  data: T;
  
  /** Optional metadata about the response */
  meta?: {
    /** Timestamp when the response was generated (ISO 8601) */
    timestamp?: string;
    
    /** Request ID for tracking and debugging */
    requestId?: string;
    
    /** API version that served this response */
    version?: string;
    
    /** Additional metadata fields */
    [key: string]: unknown;
  };
}

/**
 * Error API response wrapper
 * Standardized error format for failed API calls
 * @example
 * const response: ApiErrorResponse = {
 *   status: 'error',
 *   error: {
 *     code: 'VALIDATION_ERROR',
 *     message: 'Invalid input',
 *     fields: { email: ['Invalid format'] }
 *   }
 * };
 */
export interface ApiErrorResponse {
  /** Response status - always 'error' for error responses */
  status: 'error';
  
  /** Error details */
  error: {
    /** Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED') */
    code: string;
    
    /** Human-readable error message */
    message: string;
    
    /** Optional detailed error information */
    details?: unknown;
    
    /** Field-specific validation errors (field name → error messages) */
    fields?: Record<string, string[]>;
  };
  
  /** Optional metadata about the error */
  meta?: {
    /** Timestamp when the error occurred (ISO 8601) */
    timestamp?: string;
    
    /** Request ID for tracking and debugging */
    requestId?: string;
    
    /** API version that returned this error */
    version?: string;
    
    /** Additional metadata fields */
    [key: string]: unknown;
  };
}

/**
 * Generic API response type (discriminated union of success or error)
 * @template T - The type of data returned in successful responses
 * @example
 * function handleResponse<T>(response: ApiResponse<T>) {
 *   if (isSuccessResponse(response)) {
 *     console.log(response.data); // TypeScript knows this is T
 *   } else {
 *     console.error(response.error.message);
 *   }
 * }
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guard to check if response is successful
 * Enables TypeScript to narrow the type in conditional blocks
 * @param response - The API response to check
 * @returns True if response is a success response
 * @example
 * if (isSuccessResponse(response)) {
 *   // TypeScript knows response.data exists here
 *   console.log(response.data);
 * }
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.status === 'success';
}

/**
 * Type guard to check if response is an error
 * Enables TypeScript to narrow the type in conditional blocks
 * @param response - The API response to check
 * @returns True if response is an error response
 * @example
 * if (isErrorResponse(response)) {
 *   // TypeScript knows response.error exists here
 *   console.error(response.error.code);
 * }
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiErrorResponse {
  return response.status === 'error';
}
```

### Specification 2: `scripts/validate-types.js`

**File Path:** `scripts/validate-types.js`
**Purpose:** Validate presence of critical types in generated OpenAPI exports

**Exact Content:**
```javascript
#!/usr/bin/env node
/**
 * Type Validation Script
 * Validates that all critical types are present in generated OpenAPI exports
 * Exit code 0: All Tier 1 types present
 * Exit code 1: One or more Tier 1 types missing
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Tier 1: MUST exist (build fails if missing)
const TIER_1_TYPES = [
  'CreateDraftRequest',
  'CreateDraftResponse',
  'InboxItem',
  'Platform',
];

// Tier 2: SHOULD exist (warning if missing)
const TIER_2_TYPES = [
  'ListInboxResponse',
  'ListInboxResponsePagination',
];

async function validateTypes() {
  console.log(`${colors.blue}🔍 Validating OpenAPI Generated Types...${colors.reset}\n`);

  let hasErrors = false;
  let hasWarnings = false;

  try {
    // Import generated types (adjust path based on your build setup)
    const openapiPath = join(__dirname, '../src/openapi/index.ts');
    const types = await import(openapiPath);

    // Validate Tier 1 types (critical)
    console.log(`${colors.blue}Tier 1 Types (Critical):${colors.reset}`);
    for (const typeName of TIER_1_TYPES) {
      if (types[typeName]) {
        console.log(`  ${colors.green}✓${colors.reset} ${typeName}`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${typeName} ${colors.red}(MISSING)${colors.reset}`);
        hasErrors = true;
      }
    }

    // Validate Tier 2 types (important but not critical)
    console.log(`\n${colors.blue}Tier 2 Types (Important):${colors.reset}`);
    for (const typeName of TIER_2_TYPES) {
      if (types[typeName]) {
        console.log(`  ${colors.green}✓${colors.reset} ${typeName}`);
      } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${typeName} ${colors.yellow}(MISSING - Warning)${colors.reset}`);
        hasWarnings = true;
      }
    }

    // Summary
    console.log('\n' + '─'.repeat(50));
    if (hasErrors) {
      console.log(`${colors.red}❌ Validation FAILED${colors.reset}`);
      console.log(`${colors.red}One or more critical types are missing.${colors.reset}`);
      console.log(`${colors.red}Please regenerate types from the BFF OpenAPI spec.${colors.reset}`);
      process.exit(1);
    } else if (hasWarnings) {
      console.log(`${colors.yellow}⚠️  Validation PASSED with warnings${colors.reset}`);
      console.log(`${colors.yellow}Some important types are missing but build can continue.${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.green}✅ Validation PASSED${colors.reset}`);
      console.log(`${colors.green}All critical and important types are present.${colors.reset}`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error validating types:${colors.reset}`, error.message);
    process.exit(1);
  }
}

validateTypes();
```

### Specification 3: `src/__tests__/bff-spec.test.ts`

**File Path:** `src/__tests__/bff-spec.test.ts`
**Purpose:** Integration tests validating types from real BFF spec

**Exact Content:**
```typescript
import { describe, it, expect } from 'vitest';
import {
  CreateDraftRequest,
  CreateDraftResponse,
  InboxItem,
  Platform,
  ListInboxResponse,
  ListInboxResponsePagination,
} from '../openapi';

describe('BFF OpenAPI Spec Integration', () => {
  describe('Tier 1 Critical Types', () => {
    it('should generate CreateDraftRequest type', () => {
      const request: CreateDraftRequest = {
        caption: 'Test post',
        platforms: ['twitter', 'tiktok'],
      };

      expect(request.caption).toBeDefined();
      expect(request.platforms).toBeDefined();
      expect(Array.isArray(request.platforms)).toBe(true);
    });

    it('should generate CreateDraftResponse type', () => {
      const response: CreateDraftResponse = {
        id: 'draft-123',
        status: 'DRAFT',
        createdAt: '2026-02-03T10:00:00Z',
        updatedAt: '2026-02-03T10:00:00Z',
      };

      expect(response.id).toBeDefined();
      expect(response.status).toBeDefined();
    });

    it('should generate InboxItem type', () => {
      const item: InboxItem = {
        id: 'inbox-123',
        type: 'MENTION',
        platform: 'twitter',
        content: 'Test content',
        authorName: 'John Doe',
        createdAt: '2026-02-03T10:00:00Z',
        read: false,
      };

      expect(item.id).toBeDefined();
      expect(item.platform).toBeDefined();
    });

    it('should generate Platform enum with correct values', () => {
      const expectedPlatforms = [
        'twitter',
        'tiktok',
        'facebook',
        'instagram',
        'linkedin',
        'youtube',
      ];

      // Platform is an object with string values
      const platformValues = Object.values(Platform);
      
      expectedPlatforms.forEach(platform => {
        expect(platformValues).toContain(platform);
      });
    });
  });

  describe('Tier 2 Supporting Types', () => {
    it('should generate ListInboxResponse type', () => {
      const response: ListInboxResponse = {
        items: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
        },
      };

      expect(response.items).toBeDefined();
      expect(response.pagination).toBeDefined();
    });

    it('should generate ListInboxResponsePagination type', () => {
      const pagination: ListInboxResponsePagination = {
        page: 1,
        pageSize: 20,
        total: 100,
      };

      expect(pagination.page).toBe(1);
      expect(pagination.pageSize).toBe(20);
      expect(pagination.total).toBe(100);
    });
  });

  describe('Type Relationships', () => {
    it('should allow CreateDraftRequest with optional fields', () => {
      const request: CreateDraftRequest = {
        caption: 'Test post with media',
        platforms: ['twitter'],
        scheduledAt: '2026-02-04T14:00:00Z',
        mediaIds: ['media-1', 'media-2'],
      };

      expect(request.scheduledAt).toBeDefined();
      expect(request.mediaIds).toHaveLength(2);
    });

    it('should allow InboxItem with all optional fields', () => {
      const item: InboxItem = {
        id: 'inbox-456',
        type: 'MESSAGE',
        platform: 'instagram',
        content: 'DM content',
        authorName: 'Jane Smith',
        authorUsername: 'janesmith',
        authorAvatar: 'https://example.com/avatar.jpg',
        mediaUrl: 'https://example.com/media.jpg',
        url: 'https://instagram.com/p/abc123',
        createdAt: '2026-02-03T10:00:00Z',
        read: true,
      };

      expect(item.authorUsername).toBeDefined();
      expect(item.mediaUrl).toBeDefined();
    });
  });
});
```

### Specification 4: `src/__tests__/api-response-types.test.ts`

**File Path:** `src/__tests__/api-response-types.test.ts`
**Purpose:** Unit tests for API response wrapper types

**Exact Content:**
```typescript
import { describe, it, expect } from 'vitest';
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  isSuccessResponse,
  isErrorResponse,
} from '../types/api';

describe('API Response Types', () => {
  describe('ApiSuccessResponse', () => {
    it('should allow success response with data', () => {
      const response: ApiSuccessResponse<{ id: string }> = {
        status: 'success',
        data: { id: '123' },
      };

      expect(response.status).toBe('success');
      expect(response.data.id).toBe('123');
    });

    it('should allow success response with optional meta', () => {
      const response: ApiSuccessResponse<string> = {
        status: 'success',
        data: 'test',
        meta: {
          timestamp: '2026-02-03T10:00:00Z',
          requestId: 'req-123',
          version: 'v1',
        },
      };

      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.requestId).toBe('req-123');
    });

    it('should allow custom meta fields', () => {
      const response: ApiSuccessResponse<number> = {
        status: 'success',
        data: 42,
        meta: {
          customField: 'custom value',
        },
      };

      expect(response.meta?.customField).toBe('custom value');
    });
  });

  describe('ApiErrorResponse', () => {
    it('should allow error response with code and message', () => {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      };

      expect(response.status).toBe('error');
      expect(response.error.code).toBe('NOT_FOUND');
      expect(response.error.message).toBe('Resource not found');
    });

    it('should allow error response with details', () => {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
          details: { stack: 'error stack trace' },
        },
      };

      expect(response.error.details).toBeDefined();
    });

    it('should allow error response with field validation errors', () => {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: {
            email: ['Invalid format', 'Required field'],
            password: ['Too short'],
          },
        },
      };

      expect(response.error.fields?.email).toHaveLength(2);
      expect(response.error.fields?.password).toHaveLength(1);
    });

    it('should allow error response with meta', () => {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
        meta: {
          timestamp: '2026-02-03T10:00:00Z',
          requestId: 'req-456',
        },
      };

      expect(response.meta?.requestId).toBe('req-456');
    });
  });

  describe('Type Guards', () => {
    it('isSuccessResponse should identify success responses', () => {
      const response: ApiResponse<string> = {
        status: 'success',
        data: 'test',
      };

      expect(isSuccessResponse(response)).toBe(true);
      expect(isErrorResponse(response)).toBe(false);

      if (isSuccessResponse(response)) {
        // TypeScript should narrow the type here
        expect(response.data).toBe('test');
      }
    });

    it('isErrorResponse should identify error responses', () => {
      const response: ApiResponse<string> = {
        status: 'error',
        error: {
          code: 'ERROR',
          message: 'Error message',
        },
      };

      expect(isErrorResponse(response)).toBe(true);
      expect(isSuccessResponse(response)).toBe(false);

      if (isErrorResponse(response)) {
        // TypeScript should narrow the type here
        expect(response.error.code).toBe('ERROR');
      }
    });

    it('should enable exhaustive type narrowing', () => {
      const response: ApiResponse<number> = {
        status: 'success',
        data: 123,
      };

      let result: number | string;

      if (isSuccessResponse(response)) {
        result = response.data;
      } else {
        result = response.error.message;
      }

      expect(result).toBe(123);
    });
  });

  describe('Generic Type Parameter', () => {
    interface User {
      id: string;
      name: string;
      email: string;
    }

    it('should work with complex generic types', () => {
      const response: ApiSuccessResponse<User> = {
        status: 'success',
        data: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      expect(response.data.id).toBe('user-123');
      expect(response.data.name).toBe('John Doe');
      expect(response.data.email).toBe('john@example.com');
    });

    it('should work with array types', () => {
      const response: ApiSuccessResponse<User[]> = {
        status: 'success',
        data: [
          { id: '1', name: 'User 1', email: 'user1@example.com' },
          { id: '2', name: 'User 2', email: 'user2@example.com' },
        ],
      };

      expect(response.data).toHaveLength(2);
      expect(response.data[0].id).toBe('1');
    });
  });
});
```

### Specification 5: Updated `package.json` exports section

**Location:** Lines 9-18 in `package.json`

**Current:**
```json
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs"
      }
    }
  },
```

**New:**
```json
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs"
      }
    },
    "./types": {
      "import": {
        "types": "./dist/types/index.d.ts",
        "default": "./dist/types/index.mjs"
      },
      "require": {
        "types": "./dist/types/index.d.ts",
        "default": "./dist/types/index.cjs"
      }
    },
    "./constants": {
      "import": {
        "types": "./dist/constants/index.d.ts",
        "default": "./dist/constants/index.mjs"
      },
      "require": {
        "types": "./dist/constants/index.d.ts",
        "default": "./dist/constants/index.cjs"
      }
    },
    "./utils": {
      "import": {
        "types": "./dist/utils/index.d.ts",
        "default": "./dist/utils/index.mjs"
      },
      "require": {
        "types": "./dist/utils/index.d.ts",
        "default": "./dist/utils/index.cjs"
      }
    }
  },
```

### Specification 6: Updated `.onedev-buildspec.yml`

**Changes:**
1. Line 48: Add environment variable support
2. Add new validation step after "Generate Types from BFF"

**New content after line 55:**
```yaml
  - name: Validate Generated Types
    runInContainer: true
    docker:
      image: node:20-alpine
      auth:
        name: docker-hub
    commands:
      - npm ci
      - npm run validate:types
    onFailure: FAIL_BUILD
    useTTY: true
```

### Specification 7: DEVELOPMENT.md Publishing Section

**Location:** Add after "Build & Distribution" section

**Content:**
```markdown
## Publishing to OneDev Registry

### Prerequisites

- OneDev npm registry credentials configured in `.npmrc`
- Semantic versioning knowledge (major.minor.patch)
- Git repository access for tagging releases

### Publishing Process

1. **Update Version**
   ```bash
   # Patch release (bug fixes): 0.0.1 → 0.0.2
   npm version patch
   
   # Minor release (new features): 0.0.1 → 0.1.0
   npm version minor
   
   # Major release (breaking changes): 0.0.1 → 1.0.0
   npm version major
   ```

2. **Run Pre-Publish Checks**
   ```bash
   npm run prepublishOnly
   # This automatically runs: build + test + validate:types
   ```

3. **Tag Release in Git**
   ```bash
   git tag -a v0.1.0 -m "Release version 0.1.0"
   git push origin v0.1.0
   ```

4. **Publish to Registry**
   ```bash
   npm publish
   # Publishes to: http://onedev.mtsynergy.internal/lib/npm/
   ```

### Registry Configuration

The package is configured to publish to the OneDev internal npm registry:

```json
"publishConfig": {
  "registry": "http://onedev.mtsynergy.internal/lib/npm/"
}
```

**License:** Apache 2.0 (open source)  
**Distribution:** Internal only (OneDev registry)

### Consuming the Package

To install `@mtsynergy/platform-core` in your project:

1. **Configure `.npmrc`** (in your project root or `~/.npmrc`):
   ```
   registry=http://onedev.mtsynergy.internal/lib/npm/
   ```

2. **Install the package**:
   ```bash
   npm install @mtsynergy/platform-core
   ```

3. **Import in your code**:
   ```typescript
   // Main exports
   import { Platform, CreateDraftRequest } from '@mtsynergy/platform-core';
   
   // Types module
   import { ApiSuccessResponse } from '@mtsynergy/platform-core/types';
   
   // Constants (available after SC-802)
   import { PLATFORM_CONFIGS } from '@mtsynergy/platform-core/constants';
   
   // Utils (available after SC-803)
   import { validateCaption } from '@mtsynergy/platform-core/utils';
   ```

### Pre-Publish Checklist

Before publishing a new version:

- [ ] All tests passing (`npm run test`)
- [ ] Type generation successful (`npm run generate:types`)
- [ ] Type validation passing (`npm run validate:types`)
- [ ] Build successful (`npm run build`)
- [ ] Version bumped in `package.json`
- [ ] Git tag created for release
- [ ] CHANGELOG updated (if exists)
- [ ] No uncommitted changes in working directory

### Versioning Strategy

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes (incompatible API changes)
- **MINOR** (0.x.0): New features (backward-compatible)
- **PATCH** (0.0.x): Bug fixes (backward-compatible)

**Current version:** 0.0.1 (initial development)

**Pre-1.0.0 Note:** Until version 1.0.0, minor version increments may include breaking changes.
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Type validation breaks existing build | Low | High | Test with mock spec first, validate locally |
| New export paths break existing imports | Low | Medium | Existing exports unchanged, new paths additive only |
| BFF environment variable not set in CI | Medium | High | Use default fallback value in shell expansion |
| Integration tests fail in CI | Medium | Medium | Mark as non-blocking initially, monitor results |
| Publishing process unclear to team | Low | Low | Comprehensive documentation with examples |

## Testing Strategy

1. **Unit Tests**: API response types (`api-response-types.test.ts`)
2. **Integration Tests**: BFF spec validation (`bff-spec.test.ts`)
3. **Validation Script**: Critical type checking (`validate-types.js`)
4. **Manual Tests**: 
   - Import from new export paths
   - Run full CI simulation locally
   - Test with real BFF spec (if available)

## Success Criteria

- [ ] All 32 checklist items completed
- [ ] All tests passing (including new integration and unit tests)
- [ ] Type validation script working correctly
- [ ] Build produces all expected outputs (including new sub-paths)
- [ ] CI pipeline updated with validation step
- [ ] Documentation complete and accurate
- [ ] No breaking changes to existing exports

---

## Approval Required

Please review this plan and confirm:

1. ✅ Checklist covers all requirements for recommendations 1-7
2. ✅ File specifications are detailed enough for implementation
3. ✅ Design decisions align with project standards
4. ✅ Testing strategy is adequate
5. ✅ No missing edge cases or concerns

Once approved, respond with: **"ENTER EXECUTE MODE"**

If changes needed, please specify which sections require modification.
