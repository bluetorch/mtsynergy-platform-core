# SC-805 Innovation: Correlation ID Strategy

## 1. Zero Dependency Decision (UPDATED)

### The Conflict
- **User Story**: Suggests `uuid` library.
- **System Pattern**: Strict "Zero Dependencies" policy.

### The Resolution
**User explicitly authorized `uuid` library.** 
This overrides the "Zero Dependencies" preference for this specific feature.

**Why `uuid` package?**
- **Robustness**: Battle-tested across all JS environments (Node, Browser, RN, Workers).
- **RNG Handling**: Handles the complexity of `crypto.randomUUID` vs `crypto.getRandomValues` vs `Math.random` (if absolutely needed, though usually avoided for security) internal to the library.
- **Maintenance**: We don't have to maintain a custom RNG fallback script.
- **Standard**: Industry standard for this exact task.

## 2. Implementation details

### The Library
We will install `uuid` as a runtime dependency.
`npm install uuid`
`npm install --save-dev @types/uuid`

### Type Safety: Branded Types
We will still use the branded type pattern to prevent accidental usage.

```typescript
export type CorrelationId = string & { readonly __brand: 'CorrelationId' };
```

### Module Structure
**File**: `src/utils/observability/correlation-id.ts`
**Directory**:
```
src/utils/
  observability/
    index.ts
    correlation-id.ts
```

### Proposed Code Structure

```typescript
import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid';

export type CorrelationId = string & { readonly __brand: 'CorrelationId' };

/**
 * Generates a standard UUID v4 for use as a Correlation ID.
 * @returns {CorrelationId} A validated UUID v4
 */
export function generateCorrelationId(): CorrelationId {
  return uuidv4() as CorrelationId;
}

/**
 * Validates if the string is a valid UUID v4.
 * Checks both format and version number.
 */
export function isValidCorrelationId(id: string): id is CorrelationId {
  return uuidValidate(id) && uuidVersion(id) === 4;
}
```

## 3. Testing Strategy
- **Happy Path**: `isValidCorrelationId(generateCorrelationId())` should be true.
- **Negative Path**:
    - Invalid string -> False
    - UUID v1 -> False (since we strictly require v4)
    - UUID v5 -> False
- **Mocking**: Not required for internals, but will verify public API contracts.

## 4. Innovation Checklist
1.  [x] Confirm `uuid` strategy (Approved).
2.  [x] Define directory structure (`src/utils/observability`).
3.  [x] Define Type Branding strategy.
4.  [x] Define Validation strategy (`uuid.validate` + `uuid.version`).
