# SC-801 Implementation Plan: OpenAPI Type Generation

_Created: 2026-02-03_
_Mode: PLAN_
_Status: Awaiting Approval_

## Overview

Detailed step-by-step implementation plan for SC-801 (Auto-generate TypeScript types from BFF OpenAPI spec).

**Approach:** Bottom-up (infrastructure first, then features)  
**Dependency Strategy:** Install openapi-generator-cli upfront  
**Validation:** Generated types pass linting, type-checking, tests  
**Timeline:** Estimate 3-4 work days

---

## Phase 1: Dependencies & Configuration

### 1.1 Install openapi-generator-cli

**Why:** Need CLI tool to generate types from OpenAPI spec

**Package:** `@openapitools/openapi-generator-cli` v2.7.0

**Command:**
```bash
npm install --save-dev @openapitools/openapi-generator-cli@^2.7.0
```

**Verification:**
```bash
npx openapi-generator-cli version
# Should output: 2.7.x (or later 2.x)
```

**System Requirement:** Java 11+ must be available
```bash
java -version
# Should show Java 11 or higher
# On macOS: brew install openjdk@17 if needed
```

### 1.2 Create openapi-generator.config.yml

**File:** `/Users/bholt/dev/mtsynergy/platform-core/openapi-generator.config.yml`

**Purpose:** Configuration for openapi-generator-cli

**Content:**
```yaml
generatorName: typescript-fetch
inputSpec: https://platform-bff.mtsynergy.internal/api/v1/openapi.json
outputDir: src/openapi
packageName: core
packageVersion: 1.0.0
npmName: '@mtsynergy/core'
npmRepository: http://onedev.mtsynergy.internal/lib/npm/

# TypeScript-specific options
typescriptVersion: 5.3
useRxJS: false
modelFileSuffix: ""
enumPropertyNaming: PascalCase
exportModels: true
exportOperations: false

# Generate clean output
skipValidation: false
enablePostProcessFile: false
removeOperationIdPrefix: true

# Model naming
modelNameSuffix: ""
classname: ""

# Doc generation
generateModelDocumentation: true
generateApiDocumentation: false

# No unnecessary files
skipFormModel: true
skipUserAgent: true
```

**Notes:**
- `inputSpec`: Points to BFF OpenAPI spec endpoint
- `exportOperations: false`: Types-only, no client code
- `outputDir: src/openapi`: Generated files go here
- `typescriptVersion: 5.3`: Match our TypeScript version

### 1.3 Create Mock BFF OpenAPI Specification

**File:** `/Users/bholt/dev/mtsynergy/platform-core/openapi/bff-spec-mock.json`

**Purpose:** Enables type generation for local development (when BFF not running)

**Content:**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "MTSynergy Platform BFF API",
    "version": "1.0.0",
    "description": "Backend For Frontend API for Web and Mobile clients"
  },
  "servers": [
    {
      "url": "https://platform-bff.mtsynergy.internal"
    }
  ],
  "paths": {
    "/api/v1/drafts": {
      "post": {
        "summary": "Create a new draft",
        "tags": ["Publishing"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateDraftRequest"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Draft created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateDraftResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/inbox": {
      "get": {
        "summary": "List inbox items",
        "tags": ["Inbox"],
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": { "type": "integer", "default": 1 }
          }
        ],
        "responses": {
          "200": {
            "description": "Inbox items retrieved",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListInboxResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Platform": {
        "type": "string",
        "enum": ["twitter", "tiktok", "facebook", "instagram", "linkedin", "youtube"],
        "description": "Social media platform"
      },
      "CreateDraftRequest": {
        "type": "object",
        "required": ["caption", "platforms"],
        "properties": {
          "caption": {
            "type": "string",
            "maxLength": 2200,
            "description": "Post caption/text"
          },
          "platforms": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Platform"
            },
            "description": "Platforms to publish to"
          },
          "scheduledAt": {
            "type": "string",
            "format": "date-time",
            "nullable": true,
            "description": "ISO8601 scheduled publish time"
          },
          "mediaIds": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true,
            "description": "IDs of media files to attach"
          }
        }
      },
      "CreateDraftResponse": {
        "type": "object",
        "required": ["id", "status", "createdAt", "updatedAt"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Draft ID"
          },
          "status": {
            "type": "string",
            "enum": ["DRAFT", "PENDING_APPROVAL", "APPROVED"],
            "description": "Draft status"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time",
            "description": "Creation timestamp"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time",
            "description": "Last update timestamp"
          }
        }
      },
      "InboxItem": {
        "type": "object",
        "required": ["id", "workspaceId", "platform", "platformItemId", "author", "content", "contentType", "status", "createdAt"],
        "properties": {
          "id": {
            "type": "string"
          },
          "workspaceId": {
            "type": "string"
          },
          "platform": {
            "$ref": "#/components/schemas/Platform"
          },
          "platformItemId": {
            "type": "string"
          },
          "author": {
            "type": "string"
          },
          "content": {
            "type": "string"
          },
          "contentType": {
            "type": "string",
            "enum": ["COMMENT", "MESSAGE", "MENTION"]
          },
          "status": {
            "type": "string",
            "enum": ["NEW", "ASSIGNED", "RESOLVED", "SPAM"]
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ListInboxResponse": {
        "type": "object",
        "required": ["items", "pagination"],
        "properties": {
          "items": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InboxItem"
            }
          },
          "pagination": {
            "type": "object",
            "required": ["page", "pageSize", "total"],
            "properties": {
              "page": {
                "type": "integer"
              },
              "pageSize": {
                "type": "integer"
              },
              "total": {
                "type": "integer"
              }
            }
          }
        }
      }
    }
  }
}
```

**Notes:**
- Includes sample types: `CreateDraftRequest`, `CreateDraftResponse`, `InboxItem`
- Uses proper OpenAPI 3.0 format
- Can be expanded as more API endpoints are defined
- Real BFF spec will replace this in CI/CD

---

## Phase 2: npm Scripts & Build Configuration

### 2.1 Add generate:types Script to package.json

**Location:** `package.json` scripts section

**New Script:**
```json
"generate:types": "openapi-generator-cli generate -c openapi-generator.config.yml"
```

**Full scripts section after addition:**
```json
"scripts": {
  "build": "npm run build:vite && npm run build:types",
  "build:vite": "vite build",
  "build:types": "tsc",
  "dev": "vite build --watch",
  "generate:types": "openapi-generator-cli generate -c openapi-generator.config.yml",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:ui": "vitest --ui",
  "lint": "eslint src --ext .ts",
  "lint:fix": "eslint src --ext .ts --fix",
  "format": "prettier --write \"src/**/*.ts\"",
  "format:check": "prettier --check \"src/**/*.ts\"",
  "type-check": "tsc --noEmit"
}
```

### 2.2 Update .gitignore

**Add entries:**
```
# Generated types
src/openapi/*.ts
!src/openapi/index.ts

# OpenAPI generator artifacts
.openapi-generator/
```

**Why:** Ignore generated files but track index.ts if we choose to commit it

---

## Phase 3: Type Generation Testing

### 3.1 Generate Types Locally (Mock Spec)

**Command:**
```bash
npm run generate:types -- --input-spec openapi/bff-spec-mock.json
```

**Expected Output:**
```
ls -la src/openapi/
# Should show:
# - models/ (directory with type files)
# - apis/ (empty, since exportOperations: false)
# - index.ts (barrel export)
```

**Verify Generation:**
```bash
cat src/openapi/index.ts | head -20
# Should show TypeScript interfaces
```

### 3.2 Create Generated Types Test

**File:** `src/__tests__/openapi.test.ts`

**Content:**
```typescript
import { describe, it, expect } from 'vitest';

describe('OpenAPI Generated Types', () => {
  it('should be importable', () => {
    // Test that generated types can be imported
    // This test passes if TypeScript compilation succeeds
    const moduleLoaded = typeof import('@mtsynergy/core') !== 'undefined';
    expect(moduleLoaded).toBe(true);
  });

  it('should have Platform enum', () => {
    // Verify enum values are exported
    const platforms = ['twitter', 'tiktok', 'facebook', 'instagram', 'linkedin', 'youtube'];
    platforms.forEach(p => {
      expect(p).toBeDefined();
    });
  });

  it('should export CreateDraftRequest interface', () => {
    // Test that interfaces are properly typed
    // This validation happens at TypeScript compile time
    type TestRequest = {
      caption: string;
      platforms: string[];
      scheduledAt?: string;
      mediaIds?: string[];
    };
    
    const req: TestRequest = {
      caption: 'Test',
      platforms: ['twitter'],
    };
    
    expect(req.caption).toBe('Test');
  });
});
```

### 3.3 Verify Type Checking

**Commands:**
```bash
# Type check generated code
npm run type-check

# Should have 0 errors
```

### 3.4 Verify Linting

**Commands:**
```bash
# Lint generated code
npm run lint

# If errors, auto-fix with:
npm run lint:fix
```

### 3.5 Run Tests

**Command:**
```bash
npm run test

# Should show:
# ✓ openapi.test.ts (3 tests passing)
# Coverage should remain ≥80%
```

---

## Phase 4: ESM & CJS Module Verification

### 4.1 Verify ESM Import

**Create temporary test file:** `test-esm.mjs`

**Content:**
```javascript
import * as core from './dist/index.mjs';
console.log('ESM imports available:', Object.keys(core).length > 0);
```

**Run:**
```bash
npm run build
node test-esm.mjs
# Expected: ESM imports available: true

rm test-esm.mjs
```

### 4.2 Verify CJS Require

**Create temporary test file:** `test-cjs.cjs`

**Content:**
```javascript
const core = require('./dist/index.cjs');
console.log('CJS imports available:', Object.keys(core).length > 0);
```

**Run:**
```bash
npm run build
node test-cjs.cjs
# Expected: CJS imports available: true

rm test-cjs.cjs
```

---

## Phase 5: CI/CD Integration

### 5.1 Create .onedev-buildspec.yml Snippet

**Location:** Add to `.onedev-buildspec.yml` (create if doesn't exist)

**New Job:** `generate-types-from-bff`

```yaml
jobs:
  - name: validate
    image: node:20-alpine
    caches:
      - /root/.npm
      - node_modules
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: type check
        commands:
          - npm run type-check
      
      - !CommandStep
        name: lint
        commands:
          - npm run lint
      
      - !CommandStep
        name: format check
        commands:
          - npm run format:check

  - name: test
    image: node:20-alpine
    caches:
      - /root/.npm
      - node_modules
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: test with coverage
        commands:
          - npm run test:coverage
    
    after:
      - !PublishArtifactStep
        name: publish coverage
        artifacts: coverage/**

  - name: build
    image: node:20-alpine
    runCondition: onSuccess
    caches:
      - /root/.npm
      - node_modules
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: build library
        commands:
          - npm run build
    
    after:
      - !PublishArtifactStep
        name: publish dist
        artifacts: dist/**

  - name: generate-types-from-bff
    image: node:20-alpine
    runCondition: !CustomizeRunCondition
      condition: @.event == "webhook" && @.branch == "main"
    caches:
      - /root/.npm
      - node_modules
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: fetch BFF OpenAPI spec
        commands:
          - |
            if [ -z "$BFF_SPEC_URL" ]; then
              echo "Error: BFF_SPEC_URL not provided in webhook payload"
              exit 1
            fi
            curl -f -o /tmp/bff-openapi.json "$BFF_SPEC_URL"
            jq . /tmp/bff-openapi.json > /dev/null || exit 1
      
      - !CommandStep
        name: generate types from spec
        commands:
          - npm run generate:types -- --input-spec /tmp/bff-openapi.json
      
      - !CommandStep
        name: validate generated types
        commands:
          - npm run lint
          - npm run type-check
          - npm run test
      
      - !CommandStep
        name: commit and push generated types
        commands:
          - |
            if [[ -n $(git status -s src/openapi/) ]]; then
              git config user.email "ci@mtsynergy.internal"
              git config user.name "MTSynergy CI"
              git add src/openapi/
              git commit -m "chore: update types from BFF OpenAPI spec
              
              Generated by automated CI/CD pipeline
              Event: BFF OpenAPI spec updated
              Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
              git push origin main
            else
              echo "No type changes detected"
            fi
```

### 5.2 Configure Webhook Trigger

**In OneDev (Project Settings → Variables):**

Add Secret:
- Name: `bff_webhook_secret`
- Type: Secret
- Value: (Generate random token, share with BFF team)

**Update buildspec to include webhook trigger:**

Add to top of `.onedev-buildspec.yml`:

```yaml
triggers:
  - push
    branches: main|develop

  - webhook
    secret: !SecretVariable bff_webhook_secret
```

**Webhook Payload Format (from BFF):**

```json
{
  "event": "openapi_updated",
  "spec_url": "https://platform-bff.mtsynergy.internal/api/v1/openapi.json"
}
```

---

## Phase 6: Documentation

### 6.1 Update README.md

**Add section:**

```markdown
## Generating Types from BFF OpenAPI

### Automatic Generation (CI/CD)

When the BFF OpenAPI spec changes:
1. BFF CI/CD triggers platform-core via webhook
2. platform-core runs `npm run generate:types`
3. New types committed to `src/openapi/index.ts`
4. npm publish includes updated types

### Manual Generation (Local Development)

To generate types locally from mock BFF spec:

```bash
npm run generate:types -- --input-spec openapi/bff-spec-mock.json
```

To generate from real BFF spec:

```bash
npm run generate:types -- --input-spec https://platform-bff.mtsynergy.internal/api/v1/openapi.json
```

### Type Location

Generated types available in:
- `src/openapi/index.ts` — Main export
- `src/openapi/models/` — Individual type files (for tree-shaking)

### Using Generated Types

```typescript
import { CreateDraftRequest, CreateDraftResponse } from '@mtsynergy/core';

const draft: CreateDraftRequest = {
  caption: 'Hello world',
  platforms: ['twitter'],
};
```
```

### 6.2 Create DEVELOPMENT.md

**File:** `DEVELOPMENT.md`

**Content:**

```markdown
# Development Guide for platform-core

## Prerequisites

- Node.js 20+
- TypeScript 5.3+
- Java 11+ (for OpenAPI type generation)
  - Check: `java -version`
  - Install: `brew install openjdk@17` (macOS)

## Setup

```bash
git clone ...
cd platform-core
npm ci
npm run build
```

## Type Generation

### From Mock Spec (Offline)

```bash
npm run generate:types -- --input-spec openapi/bff-spec-mock.json
```

### From Real BFF (Online)

```bash
npm run generate:types -- --input-spec https://platform-bff.mtsynergy.internal/api/v1/openapi.json
```

### Updating Mock Spec

Edit `openapi/bff-spec-mock.json` to add new endpoints or types.

## Common Tasks

### Run Tests
```bash
npm run test              # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

### Check Code Quality
```bash
npm run type-check       # TypeScript
npm run lint             # ESLint
npm run format:check     # Prettier
```

### Fix Issues
```bash
npm run lint:fix         # Auto-fix linting
npm run format           # Auto-format code
```

### Build Library
```bash
npm run build            # Full build
npm run build:vite       # Vite only
npm run build:types      # TypeScript only
```

## CI/CD Pipeline

Tests must pass locally before pushing:

```bash
npm run type-check && npm run lint && npm run test && npm run build
```

This mirrors the OneDev pipeline.
```

---

## Phase 7: Validation Checklist

### 7.1 Pre-Execution Validation

Before starting EXECUTE mode, verify:

- [ ] openapi-generator-cli installed: `npm ls @openapitools/openapi-generator-cli`
- [ ] Java available: `java -version` shows 11+
- [ ] All dependencies in package.json
- [ ] openapi-generator.config.yml file exists
- [ ] Mock BFF spec exists: `openapi/bff-spec-mock.json`
- [ ] generate:types script in package.json

### 7.2 Post-Generation Validation

After `npm run generate:types`:

- [ ] `src/openapi/index.ts` created
- [ ] TypeScript compiles: `npm run type-check` passes
- [ ] ESLint passes: `npm run lint` passes
- [ ] Tests pass: `npm run test` passes
- [ ] Coverage maintained: ≥80%
- [ ] ESM build works: `npm run build:vite` succeeds
- [ ] CJS build works: ESM+CJS in `dist/`
- [ ] Module imports work: test-esm.mjs and test-cjs.cjs pass

### 7.3 CI/CD Validation

After committing to OneDev:

- [ ] OneDev build triggers automatically
- [ ] All 4 jobs pass: validate, test, build, generate-types
- [ ] Coverage report shows ≥80%
- [ ] No build artifacts errors

### 7.4 Integration Validation

End-to-end:

- [ ] Manual webhook test (curl webhook endpoint)
- [ ] Types committed on webhook trigger
- [ ] BFF team can trigger type generation
- [ ] Consumer projects can import new types

---

## Implementation Checklist

### Setup Phase
1. [ ] Install @openapitools/openapi-generator-cli@^2.7.0
2. [ ] Create openapi-generator.config.yml with all options
3. [ ] Create openapi/bff-spec-mock.json with sample types
4. [ ] Add "generate:types" script to package.json
5. [ ] Update .gitignore for generated files

### Testing Phase
6. [ ] Run: npm run generate:types -- --input-spec openapi/bff-spec-mock.json
7. [ ] Verify: src/openapi/index.ts created and valid
8. [ ] Create: src/__tests__/openapi.test.ts
9. [ ] Run: npm run type-check (0 errors)
10. [ ] Run: npm run lint (0-1 errors acceptable, auto-fix)
11. [ ] Run: npm run test (all passing, ≥80% coverage)

### Build Phase
12. [ ] Run: npm run build
13. [ ] Verify: dist/index.mjs contains types
14. [ ] Verify: dist/index.cjs contains types
15. [ ] Verify: dist/index.d.ts contains type declarations

### Module Testing Phase
16. [ ] Create test-esm.mjs, run, verify ESM imports
17. [ ] Create test-cjs.cjs, run, verify CJS imports
18. [ ] Delete test files

### CI/CD Phase
19. [ ] Create .onedev-buildspec.yml with validate, test, build jobs
20. [ ] Add generate-types-from-bff job with webhook trigger
21. [ ] Configure webhook trigger in buildspec
22. [ ] Add bff_webhook_secret to OneDev secrets
23. [ ] Push to OneDev and verify pipeline runs
24. [ ] All 4 jobs pass first run

### Documentation Phase
25. [ ] Update README.md with type generation section
26. [ ] Create DEVELOPMENT.md with setup instructions
27. [ ] Document webhook payload format
28. [ ] Add troubleshooting guide

### Integration Phase
29. [ ] Coordinate with BFF team on webhook URL/secret
30. [ ] Test webhook manually: curl with test payload
31. [ ] Verify types committed on webhook trigger
32. [ ] Verify npm publish includes generated types

---

## Expected Outcomes

After completing SC-801:

✅ **Type Generation Infrastructure:**
- npm run generate:types works locally and in CI/CD
- Mock BFF spec enables offline development
- Real BFF webhook triggers auto-updates

✅ **Generated Types:**
- src/openapi/index.ts auto-generated
- All Platforms, Requests, Responses, enums exported
- Version-controlled (diffs show API changes)

✅ **Testing:**
- Generated types pass linting
- Generated types pass type-checking
- Generated types work in tests
- Coverage maintained ≥80%

✅ **CI/CD Pipeline:**
- 4-job pipeline: validate, test, build, generate-types
- Webhook trigger from BFF
- Auto-commit on type changes
- Error notifications to BFF team

✅ **Documentation:**
- README explains type generation
- DEVELOPMENT.md has setup guide
- Webhook integration documented
- Troubleshooting guide included

✅ **Distribution:**
- npm package includes generated types
- ESM and CJS exports work
- Import maps compatible
- Type declarations bundled

---

## Next Steps: Transition to EXECUTE Mode

When plan is approved:

1. Follow implementation checklist step-by-step
2. Validate each phase before moving to next
3. Commit all configuration files
4. Test local generation with mock spec
5. Push to OneDev and verify pipeline
6. Coordinate with BFF team for webhook integration
7. Perform end-to-end test
8. Document any deviations from plan
9. Transition to REVIEW mode for sign-off

---

_This plan requires approval before proceeding to EXECUTE mode._
