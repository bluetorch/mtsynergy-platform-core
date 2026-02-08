# SC-805 Plan: Correlation ID

## 1. Specifications

**Goal**: Implement robust Correlation ID generation and validation using the `uuid` library.
**Location**: `src/utils/observability/correlation-id.ts`
**Exports**:
- `CorrelationId` (type)
- `generateCorrelationId` (function)
- `isValidCorrelationId` (function)

## 2. Dependencies

- Install `uuid`
- Install `@types/uuid` (Dev)

## 3. Detailed Design

### Type Definition
```typescript
/**
 * Branded type for validated Correlation IDs (UUID v4)
 */
export type CorrelationId = string & { readonly __brand: 'CorrelationId' };
```

### Implementation (`src/utils/observability/correlation-id.ts`)
```typescript
import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid';

export type CorrelationId = string & { readonly __brand: 'CorrelationId' };

export const generateCorrelationId = (): CorrelationId => {
  return uuidv4() as CorrelationId;
};

export const isValidCorrelationId = (id: string): id is CorrelationId => {
  return uuidValidate(id) && uuidVersion(id) === 4;
};
```

### Barrel Files
- `src/utils/observability/index.ts`: Re-export `correlation-id.ts`
- `src/utils/index.ts`: Re-export `observability`

### Testing (`src/__tests__/correlation-id.test.ts`)
- **Suite 1: Generation**
  - Generated ID should pass `isValidCorrelationId`.
  - Generated ID should be unique (generate 1000, Set size 1000).
- **Suite 2: Validation**
  - Valid v4 UUID -> true.
  - Invalid string ('foo') -> false.
  - Valid v1 UUID -> false.
  - Valid v5 UUID -> false.
  - Empty string -> false.

## 4. Clarifying Questions

1.  **Strictness**: Do we strictly reject valid UUIDs that are NOT v4?
    *   *Self-Answer*: Yes, User Story specifically says "Correlation ID generator & validator ... UUID v4".
2.  **Export Path**: Should consumers access via `@mtsynergy/core/utils/observability`?
    *   *Self-Answer*: Yes, following the pattern defined in `systemPatterns.md`.
3.  **Module Format**: ESM/CJS compatibility?
    *   *Self-Answer*: `uuid` supports both; our build system handles the rest.

## 5. Implementation Checklist

```
IMPLEMENTATION CHECKLIST:
1. [ ] Install dependencies: `npm install uuid` and `npm install -D @types/uuid`
2. [ ] Create directory: `src/utils/observability/`
3. [ ] Create file: `src/utils/observability/correlation-id.ts` with implementation
4. [ ] Create barrel: `src/utils/observability/index.ts`
5. [ ] Update main utils barrel: `src/utils/index.ts`
6. [ ] Create tests: `src/__tests__/correlation-id.test.ts`
7. [ ] Run tests: `npm test`
8. [ ] Verify build: `npm run build`
```

## 6. Approval

Awaiting user approval to EXECUTE.
