# SC-805 Research: Correlation ID Generator & Validator

## 1. Requirements Analysis
**Story:** SC-805 - "Correlation ID generator & validator"

**Core Functions:**
1. `generateCorrelationId(): string` - UUID v4 generation.
2. `isValidCorrelationId(id: string): boolean` - Validation against UUID v4 regex.

**Types:**
- `CorrelationId` (Branded String)

**Constraints:**
- "Zero Dependencies" architectural principle (from `systemPatterns.md`).
- User Story mentions: "`crypto.randomUUID()` (browser) or `uuid` library (Node/mobile)".
- Target Environments: Node 20+, Browser (CloudFlare R2/Workers), Mobile (React Native).

## 2. Technical Investigation

### Dependency Strategy: `crypto.randomUUID()` vs `uuid` package

**Option A: Import `uuid` package**
- PRO: Guaranteed output consistency and broad compatibility.
- CON: Violates "Zero Dependencies" rule. Adds ~430B (compressed) to bundle.

**Option B: `crypto.randomUUID()` (Native)**
- PRO: Zero dependency. Fast.
- CON: Availability varies by environment.
    - **Node.js 20+**: Fully supported (`global.crypto.randomUUID()` or `require('node:crypto').randomUUID()`).
    - **Browsers**: Supported in all modern browsers (Chrome 92+, Safari 15.4+, iOS 15.4+).
    - **CloudFlare Workers**: Supported.
    - **React Native**: Supported in 0.74+ or requires polyfill (`react-native-get-random-values`).

**Option C: Manual Implementation (using `crypto.getRandomValues`)**
- PRO: Zero dependency. Works if `randomUUID` is missing but `getRandomValues` is present (common in older browsers/RN).
- CON: Maintenance burden.

### Compatibility Check
- **Node.js**: The project requires Node 20+. `crypto.randomUUID` is standard.
- **Testing**: Vitest runs in Node.
- **Browser**: Project targets modern browsers via Vite.
- **Mobile**: Target is "React Native (Hermes)". If specific version < 0.74, might need polyfill. However, `systemPatterns.md` lists "Zero Dependencies" as a core principle.

### Recommended Approach
Prioritize **Native Implementation (Option B/C hybrid)**.
1. Try `globalThe.crypto.randomUUID()`.
2. Fallback to a custom implementation using `crypto.getRandomValues()` if `randomUUID` is missing.
3. Keep it purely internal (no `uuid` dependency).

**Regex Validation:**
Pattern provided: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
- Matches standard UUID v4.
- Case-insensitivity should be considered (UUIDs are canonically lowercase but validation might handle upper/mixed). Story implies lowercase from regex `a-f`.

## 3. Implementation Plan Proposal

**File Structure:**
- `src/utils/correlation-id.ts`: Core implementation.
- `src/utils/index.ts`: Re-export.
- `src/__tests__/correlation-id.test.ts`: Tests.

**Code Sketch:**
```typescript
/**
 * Generates a version 4 UUID as a Correlation ID.
 * Uses native crypto.randomUUID() if available, otherwise falls back to crypto.getRandomValues().
 */
export function generateCorrelationId(): CorrelationId {
  // ... implementation
}
```

## 4. Questions / Risks
- Does the "uuid library" mention in User Story force us to use it, or is it a suggestion?
    - *Assumption*: It's a suggestion for implementation, but "Zero Dependencies" takes precedence if functionality is equivalent.
- Strictness of regex: Lowercase only?
    - *Assumption*: Regex provided is lowercase. We should likely normalize to lowercase or allow strict checking.
