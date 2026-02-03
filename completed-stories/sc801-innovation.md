# SC-801 Innovation: OpenAPI Type Generation Design

_Created: 2026-02-03_
_Mode: INNOVATE_
_Status: In Progress_
_Focus: SC-801 ONLY_

## Overview

This document explores design alternatives, trade-offs, and architecture decisions specifically for SC-801 (OpenAPI Type Generation).

---

## Challenge Statement

**How do we keep TypeScript types synchronized with the BFF OpenAPI specification automatically, without manual effort or drift?**

Requirements:
- Types must reflect BFF API exactly
- Changes in BFF spec trigger type updates
- Types must be version-controlled and reviewable
- No manual type maintenance
- Backwards compatibility maintained
- Works in all consuming contexts (browser, Node.js, React Native)

---

## Solution Approaches

### Option A: openapi-generator-cli (Selected) ✅

**Concept:** Use industry-standard OpenAPI code generator, commit generated types to repo

**How it works:**
1. BFF publishes OpenAPI 3.0 spec (e.g., at `/api/v1/openapi.json`)
2. CI/CD job runs `openapi-generator-cli` with TypeScript generator
3. Generated types written to `src/openapi/index.ts`
4. Types committed to Git if changed
5. npm publish includes generated types

**Advantages:**
- ✅ Industry standard (widely adopted, battle-tested)
- ✅ Supports 40+ languages/frameworks
- ✅ Extensible via templates for customization
- ✅ Large community support and plugins
- ✅ Deterministic output (same spec → same types every time)
- ✅ Version controlled (diffs show exactly what changed)
- ✅ No learning curve for team (standard tool)
- ✅ Easy to debug generated code
- ✅ Mature ecosystem with solutions for edge cases

**Disadvantages:**
- ❌ Requires Java runtime (11+) on build system
- ❌ Slower than hand-written generators (~2-5s per run)
- ❌ Generated code may be verbose (can be mitigated via config)
- ❌ May generate non-idiomatic TypeScript initially (needs config tuning)
- ❌ Dependence on third-party tool stability

**Mitigation:**
- Java requirement acceptable (OneDev containers have Java)
- Configure generator strictly for TypeScript idioms
- Review generated output once, document expectations
- Pin openapi-generator-cli version for reproducibility

**Configuration Example:**
```yaml
# openapi-generator.config.yml
generatorName: typescript-fetch
inputSpec: https://platform-bff.mtsynergy.internal/api/v1/openapi.json
outputDir: src/openapi
packageName: core
typescriptVersion: 5.3
useRxJS: false
exportModels: true
exportOperations: false  # Types-only, no client code
enumPropertyNaming: PascalCase
modelFileSuffix: ""
```

**Decision: SELECTED** ✅

---

### Option B: Custom TypeScript Generator

**Concept:** Build bespoke OpenAPI → TypeScript generator using TypeScript Compiler API

**How it works:**
1. Parse OpenAPI spec JSON
2. Walk AST, extract schemas and operations
3. Generate TypeScript interfaces using ts.factory
4. Write to file

**Advantages:**
- ✅ Full control over output format
- ✅ Optimized specifically for our needs
- ✅ No Java dependency
- ✅ Fast execution
- ✅ Can generate TypeScript idioms directly

**Disadvantages:**
- ❌ Custom maintenance burden (our responsibility)
- ❌ No community support
- ❌ Requires deep OpenAPI knowledge
- ❌ Risk of bugs in generator (especially for edge cases)
- ❌ Hidden complexity (regex-based parsing error-prone)
- ❌ Difficult to extend for new OpenAPI features
- ❌ No standard patterns to follow

**Why Not Selected:** 
Too much maintenance overhead for MVP. Custom generators are only worth the effort if:
1. Off-the-shelf tools don't meet requirements
2. Requirements are unusual/specialized
3. Team has bandwidth for maintenance

Our requirements are standard, so openapi-generator-cli is the better choice.

**Future Option:** Could switch later if openapi-generator-cli becomes a bottleneck.

---

### Option C: Manual Type Definitions

**Concept:** Keep types in sync manually with BFF, developers write interfaces by hand

**How it works:**
1. BFF team makes API changes
2. BFF team notifies platform-core team
3. platform-core team manually updates `src/openapi/index.ts`
4. Tests catch mismatches (eventually)

**Advantages:**
- ✅ Full control
- ✅ Can optimize for consumer needs

**Disadvantages:**
- ❌ Error-prone (types drift from reality)
- ❌ Extra work for developers (manual sync)
- ❌ No guaranteed consistency
- ❌ Breaks when BFF changes (silent failures)
- ❌ Scales poorly (hundreds of types)
- ❌ No single source of truth
- ❌ Conflicts between teams

**Why Not Selected:** Defeats the entire purpose of auto-generation. This approach fails at scale.

---

### Option D: Runtime Type Validation Only (Zod/io-ts)

**Concept:** Use runtime schema validation instead of static TypeScript types

**How it works:**
1. Define Zod schemas that match BFF responses
2. Use schemas for runtime validation
3. Extract TypeScript types from schemas
4. No separate type definitions needed

**Example:**
```typescript
const DraftSchema = z.object({
  id: z.string(),
  caption: z.string(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED'])
});

export type Draft = z.infer<typeof DraftSchema>;
```

**Advantages:**
- ✅ Type safety + runtime safety
- ✅ Single source of truth (schemas)
- ✅ Can validate API responses

**Disadvantages:**
- ❌ Adds dependency (Zod adds ~10KB)
- ❌ Runtime overhead on every parse
- ❌ Still requires manual schema maintenance
- ❌ Verbose schema definitions
- ❌ Not ideal for compile-time only scenarios
- ❌ Doesn't solve auto-generation problem

**Why Not Selected:** 
This is not a replacement for auto-generation. Could be added as an optional validation layer on top of generated types (future enhancement), but not suitable as primary approach for SC-801.

---

### Option E: GraphQL Schema Instead

**Concept:** Replace REST + OpenAPI with GraphQL schema

**Disadvantages:**
- ❌ Out of scope (BFF already REST-based)
- ❌ Requires BFF rewrite
- ❌ Doesn't solve problem for existing REST API

**Why Not Selected:** Not feasible for MVP.

---

## Selected Approach: openapi-generator-cli

### Architecture Decision Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Generator Tool** | openapi-generator-cli | Industry standard, extensible, well-documented |
| **Generator Type** | typescript-fetch | Types-only output, no runtime client |
| **Output Format** | TypeScript interfaces | Native TS, no runtime deps, compile-time only |
| **Output Location** | src/openapi/index.ts | Follows module structure, single entry point |
| **Commit Generated Files** | Yes | Enables diffs, version control, deterministic builds |
| **BFF Spec Source** | Remote URL (CI/CD) | Always current, real-time |
| **Local Development** | Mock spec file | Developers don't need BFF running |
| **Backwards Compatibility** | Semantic versioning | MAJOR for breaking, MINOR for additions |

### Type Export Strategy

**Generated types exported via main entry point:**

```typescript
// src/index.ts
export * from './openapi/index';
export * from './types/index';
// ... other exports
```

**Consumers import naturally:**
```typescript
import { CreateDraftRequest, Draft } from '@mtsynergy/core';
```

### Backwards Compatibility Approach

**Policy:** Semantic versioning enforced

```
v1.0.0: Initial types
  ├─ CreateDraftRequest
  ├─ CreateDraftResponse
  └─ InboxItem

v1.1.0: BFF adds new field to Draft
  ├─ CreateDraftRequest (unchanged)
  ├─ CreateDraftResponse (unchanged)
  ├─ InboxItem (unchanged)
  └─ Draft (new type added)
  
v2.0.0: BFF removes deprecated field
  └─ Breaking change, regenerate with @major
```

**CI/CD Validation:**
- Generated types must pass linting
- Generated types must pass type-checking
- All existing tests must still pass
- No manually-breaking changes allowed without explicit approval

### Type Generation Triggers

**Primary (CI/CD Automated):**
1. BFF CI/CD triggers webhook after building spec
2. platform-core receives webhook
3. Downloads BFF OpenAPI spec
4. Runs openapi-generator-cli
5. Validates generated types
6. Commits if valid, notifies BFF if invalid

**Secondary (Manual):**
```bash
npm run generate:types
```

Developers can manually regenerate locally for testing.

---

## Implementation Decisions

### Decision: Types-Only vs Full Client

**Option 1: Types-Only (Selected) ✅**
- Generator: `typescript-fetch` with `exportOperations: false`
- Output: Only `*.interface.ts` files with type definitions
- Size: ~5-10KB for typical BFF spec
- Benefit: Decoupled from HTTP client choice
- Benefit: Works with any HTTP library (fetch, axios, etc.)

**Option 2: Full API Client**
- Generator: `typescript-fetch` with full client methods
- Output: Both interfaces and client functions
- Size: ~20-30KB
- Problem: Couples types to HTTP client
- Problem: Harder to maintain backwards compatibility
- Not selected because types + consumers' own HTTP layer is simpler

**Decision: Types-Only** ✅

### Decision: Configuration File vs Inline Config

**Option 1: YAML Config File (Selected) ✅**
```yaml
# openapi-generator.config.yml
generatorName: typescript-fetch
inputSpec: https://platform-bff.mtsynergy.internal/api/v1/openapi.json
outputDir: src/openapi
```

**Option 2: CLI Arguments**
```bash
openapi-generator-cli generate \
  -g typescript-fetch \
  -i https://platform-bff.mtsynergy.internal/api/v1/openapi.json \
  -o src/openapi
```

**Decision: YAML Config File** ✅
- Easier to version control
- Shared by BFF team (they reference it from their CI/CD)
- More readable
- Easier to extend with additional options

### Decision: Version Management

**Option 1: Pin CLI Version (Selected) ✅**
```json
{
  "devDependencies": {
    "@openapitools/openapi-generator-cli": "^2.7.0"
  }
}
```

**Option 2: Always Latest**
- Problem: Non-deterministic output over time
- Problem: Unexpected breaking changes
- Not selected

**Decision: Pin to stable major.minor** ✅
- Allows patch updates (bug fixes)
- Prevents major version surprises
- Reproducible across time

### Decision: Mock BFF Spec Location

**Option 1: JSON File in Repo (Selected) ✅**
```
openapi/bff-spec-mock.json
```

**Option 2: External URL**
- Problem: Network dependency for local dev
- Not selected

**Decision: JSON file checked into repo** ✅
- Developers can generate types offline
- Deterministic (same file always)
- Easy to update when testing new APIs

---

## Type Generation Flow

### End-to-End Sequence

```
1. Developer makes BFF API change
   ↓
2. BFF builds and generates openapi.json
   ↓
3. BFF CI/CD triggers platform-core webhook
   ↓
4. platform-core receives webhook with spec URL
   ↓
5. platform-core downloads BFF OpenAPI spec
   ↓
6. platform-core runs: openapi-generator-cli generate
   ↓
7. Generated: src/openapi/index.ts
   ↓
8. platform-core runs: npm run lint
   ↓
9. platform-core runs: npm run type-check
   ↓
10. platform-core runs: npm run test
    ↓
    ├─ ✅ All pass → commit to main
    └─ ❌ Any fail → notify BFF team of spec issues
    ↓
11. CI/CD publishes @mtsynergy/core to npm registry
    ↓
12. Consumers get new types in next npm ci
```

### Fallback: Local Development

```
Developer without BFF running:

1. npm run generate:types -- --input-spec openapi/bff-spec-mock.json
   ↓
2. Generated: src/openapi/index.ts (from mock spec)
   ↓
3. Run tests and develop locally
   ↓
4. When ready: Push to OneDev → CI/CD regenerates with real spec
```

---

## Testing Strategy for Generated Types

### What to Test

1. **Import-ability**
   ```typescript
   import { CreateDraftRequest } from '@mtsynergy/core';
   // Should compile without errors
   ```

2. **Type Structure**
   ```typescript
   const draft: CreateDraftRequest = {
     caption: 'Hello',
     platforms: ['twitter'],
   };
   // TypeScript should verify structure
   ```

3. **Type Safety**
   ```typescript
   const draft: CreateDraftRequest = {
     caption: 'Hello',
     platforms: ['invalid-platform'], // ❌ Type error
   };
   ```

4. **Enumeration Types**
   ```typescript
   type Status = CreateDraftResponse['status'];
   // Should infer: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED'
   ```

### Test Implementation

```typescript
// src/__tests__/openapi.test.ts
import { describe, it, expect } from 'vitest';
import type { CreateDraftRequest, CreateDraftResponse } from '../openapi';

describe('OpenAPI Generated Types', () => {
  it('should export required types', () => {
    const draft: CreateDraftRequest = {
      caption: 'Test caption',
      platforms: ['twitter'],
    };
    expect(draft).toBeDefined();
  });

  it('should enforce type safety', () => {
    // This should be a TypeScript compile error
    // const invalid: CreateDraftRequest = {
    //   caption: 'Test',
    //   platforms: ['invalid'], // Type error: not a valid Platform
    // };
    expect(true).toBe(true); // Tested at compile time
  });
});
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Java not available on build system** | Low | Medium | Document requirement, provide Docker setup |
| **OpenAPI spec has breaking changes** | Medium | High | Semantic versioning, CI/CD validation |
| **Generated code quality issues** | Low-Medium | Medium | Configure generator carefully, review output |
| **Type generation fails silently** | Low | High | Explicit error handling, notifications |
| **BFF spec URL inaccessible** | Low | High | Retry logic, fallback to last known spec |
| **Generator bug (new versions)** | Low | Low | Pin version, test before upgrading |
| **Slow generation (large specs)** | Low | Low | Cache, incremental generation |

---

## Success Criteria

SC-801 is development-ready when:

✅ `npm run generate:types` produces valid TypeScript in `src/openapi/index.ts`
✅ Generated types import successfully in tests
✅ Generated types are type-safe (TypeScript enforces contracts)
✅ All tests pass with generated types
✅ Generated code passes linting
✅ Coverage maintained ≥80%
✅ Works in both ESM and CJS contexts
✅ Mock BFF spec enables local development
✅ BFF webhook integration tested end-to-end
✅ Documentation updated with generation instructions

---

## Next Steps: Planning Phase

Ready to transition to PLAN mode to create:
1. Detailed step-by-step implementation checklist
2. `.onedev-buildspec.yml` job configuration
3. `openapi-generator.config.yml` with all options
4. Mock BFF `openapi/bff-spec-mock.json`
5. `npm run generate:types` script setup
6. Test cases for generated types

---

_End of SC-801 Innovation Document_
