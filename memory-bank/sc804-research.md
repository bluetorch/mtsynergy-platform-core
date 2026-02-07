# SC-804 Research: Shared PII Sanitization Functions

_Date: 2026-02-06_  
_Phase: RESEARCH_

## Story Overview

**Feature:** SC-804 - Shared PII Sanitization Functions  
**Part Of:** Observability Utilities (SC-804–SC-808)  
**Status:** Ready to Plan  
**Blockers:** None (SC-803 complete)  
**Dependencies:** SC-802 (platform constants) - for integration

## Requirements Analysis

### User Story Definition

From USER_STORIES.md:

```
SC-804: Shared PII sanitization functions
- Fetch PII patterns from BFF GET /api/observability/pii-patterns on first import
- Cache patterns in memory; refresh every 5 minutes or on version change
- Export functions: sanitizeEmail(str), sanitizePhone(str), redactToken(str), 
  maskIdentifier(str), scrubObject(obj)
- Pattern matching uses regex from ConfigMap; replacement tokens: [REDACTED-EMAIL], 
  [REDACTED-PHONE], etc.
- scrubObject recursively scans object/array trees and applies sanitization to 
  string values
```

### PII Policy (from SPECIFICATION.md § 5.6.4)

**Prohibited Data in Logs/Traces:**
- Email addresses
- Phone numbers (all international formats)
- Social Security Numbers (SSN)
- Credit card numbers
- OAuth tokens and refresh tokens
- API keys and secrets
- Passwords and password hashes
- JWTs (JSON Web Tokens)
- User-entered form data

**Dual-Layer Enforcement:**
1. **Application Layer (Pre-Log):** BFF + Shell/Mobile
2. **Collector Layer (Post-Collection):** OpenTelemetry Collector redaction processor

**Pattern Source:** Kubernetes ConfigMap (hot-reloadable, semantic versioning)

**Replacement Tokens:**
- Email: `[REDACTED-EMAIL]`
- Phone: `[REDACTED-PHONE]`
- SSN: `[REDACTED-SSN]`
- Credit Card: `[REDACTED-CC]`
- Bearer Token: `Bearer [REDACTED-TOKEN]`
- API Key: `[REDACTED-API-KEY]`
- Password: `[REDACTED-PASSWORD]`
- JWT: `[REDACTED-JWT]`

## Architecture & Design Decisions

### 1. Pattern Fetching Strategy

**Current State:**
- Patterns come from BFF API endpoint: `GET /api/observability/pii-patterns`
- Patterns are retrieved in ConfigMap format with versioning
- Shell/Mobile fetch patterns and cache in sessionStorage/AsyncStorage

**Decision Point:** How to handle pattern fetching in platform-core?
- **Option A:** Platform-core exports synchronous functions + async pattern loader
  - Consumers responsible for fetching & caching patterns
  - Maximum flexibility, explicit control
- **Option B:** Platform-core includes pattern cache management with default patterns
  - Synchronous API (patterns pre-loaded)
  - Requires some default patterns as fallback

**Recommendation:** Option A (synchronous functions + async loader)
- Reason: platform-core is a utility library used by multiple consumers
- Each consumer (Shell, Mobile) has different network/storage strategies
- Consumers can import just the validators if they manage patterns separately

### 2. Function Signatures

**Core Functions (Required):**

```typescript
// Sanitize specific PII types
sanitizeEmail(str: string, replacement?: string): string
sanitizePhone(str: string, replacement?: string): string
redactToken(str: string, replacement?: string): string
maskIdentifier(str: string, replacement?: string): string

// Bulk sanitization
scrubObject(obj: any, patterns: PiiPattern[]): any
```

**Pattern Types:**

```typescript
interface PiiPattern {
  name: 'email' | 'phone' | 'ssn' | 'credit_card' | 'bearer_token' | 
         'api_key' | 'password' | 'jwt' | 'custom'
  pattern: string  // regex string
  replacement: string  // [REDACTED-EMAIL], etc.
  flags?: string  // 'gi', 'g', etc.
}
```

**Helper Functions:**

```typescript
// Validate and apply patterns
applyPattern(str: string, pattern: PiiPattern): string
loadPiiPatterns(configMapData: any): PiiPattern[]
```

### 3. Caching Strategy

**Requirement:** "Cache patterns in memory; refresh every 5 minutes or on version change"

**Implementation Strategy:**
- Platform-core exports pattern cache manager
- Consumers import + initialize cache
- Cache API:
  - `getPatterns(): PiiPattern[]` - Get current cached patterns
  - `refreshPatterns(newPatterns: PiiPattern[]): void` - Update cache
  - `setAutoRefresh(interval: number, fetcher: () => Promise<PiiPattern[]>): void` - Auto-refresh

**Storage:** In-memory only (consumers handle persistence)

### 4. Performance Considerations

**Regex Compilation:**
- Pre-compile regex patterns on load (not on every call)
- Cache compiled regexes alongside patterns

**String Operations:**
- Use `.replace()` for single sanitization
- Batch operations in `scrubObject()` for efficiency
- Handle recursive traversal carefully (depth limits for circular references)

**Object Traversal:**
- Recursive approach with depth limiting
- Skip non-string, non-object, non-array values
- Avoid traversing prototype chain

## Integration Points

### With SC-802 (Platform Constants)
- No direct dependency
- SC-804 can reference platform names if needed for logging/context

### With SC-805-808 (Other Observability Utilities)
- **SC-805 (Correlation ID):** Each sanitization could include correlation ID in logs
- **SC-806 (Trace Context):** Patterns could be trace-aware
- **SC-807 (Logger):** Logger will use SC-804 functions to scrub messages
- **SC-808 (Breadcrumb Manager):** Breadcrumbs will use SC-804 to scrub data

## Testing Strategy

### Unit Tests

**Test File:** `src/__tests__/sanitization.test.ts`

**Test Coverage:**

1. **Individual Sanitizer Functions** (4 functions × 5 test cases each = 20 tests)
   - Test with valid PII patterns
   - Test with no match (passthrough)
   - Test with multiple matches
   - Test with edge cases (empty string, null, undefined - if allowed)
   - Test with custom replacement tokens

2. **Bulk Sanitization (scrubObject)** (15 tests)
   - Flatten objects (single level)
   - Nested objects (2-3 levels)
   - Arrays of strings
   - Arrays of objects
   - Mixed types (ignore non-strings)
   - Circular reference handling
   - Large objects (performance baseline)

3. **Pattern Management** (10 tests)
   - Load patterns from ConfigMap format
   - Validate pattern structure
   - Handle malformed patterns gracefully
   - Version comparison logic
   - Pattern deduplication

4. **Edge Cases** (10 tests)
   - Null/undefined inputs
   - Empty strings
   - Malformed PII (incomplete email, etc.)
   - Special characters in strings
   - Unicode/international characters

**Total Tests:** ~55 unit tests

### Integration Tests

**Test File:** `src/__tests__/sanitization-integration.test.ts`

**Test Coverage:**

1. **BFF Pattern Fetch Simulation** (5 tests)
   - Mock BFF response format
   - Load patterns from mock response
   - Cache validation
   - Version change detection

2. **Real-World Scenarios** (10 tests)
   - Sanitize log messages with multiple PII types
   - Sanitize API error responses
   - Sanitize user input objects
   - Sanitize breadcrumb events
   - Sanitize trace context objects

**Total Tests:** ~15 integration tests

**Total Suite:** 70+ tests, 95%+ coverage target

## Known Questions & Clarifications Needed

1. **Pattern Fetching:**
   - Should platform-core include a built-in HTTP client for BFF pattern fetching?
   - Or should consumers handle fetching?

2. **Default Patterns:**
   - Should platform-core include hardcoded default patterns as fallback?
   - Or require explicit pattern loading?

3. **Sync vs Async API:**
   - All sanitization functions sync (apply pre-loaded patterns)?
   - Or async functions that can fetch patterns if needed?

4. **Type Safety:**
   - Should sanitizers be generic (work with any pattern)?
   - Or specific functions for each PII type only?

5. **Error Handling:**
   - What if pattern regex is malformed?
   - Fail hard or fallback to passthrough?

6. **Performance Limits:**
   - Max object depth for `scrubObject()`?
   - Max string length for pattern matching?

## Environment & Compatibility

**Target Runtimes:**
- Browser (CloudFlare Workers) ✅
- Node.js 20+ ✅
- React Native (Hermes) ✅

**Dependencies:**
- Zero external dependencies (built-in RegExp only)
- TypeScript types only (no runtime overhead)

**API Surface:**
- ESM + CJS dual exports
- Named exports for individual functions
- Barrel export from `src/utils/index.ts`

## Success Criteria for Implementation

1. ✅ All 5 required functions exported and typed
2. ✅ 70+ unit tests, 95%+ coverage
3. ✅ Pattern caching mechanism working
4. ✅ Recursive object sanitization functional
5. ✅ All PII types covered by at least one pattern
6. ✅ Zero runtime errors with edge cases
7. ✅ Performance acceptable (no timeouts on large objects)
8. ✅ Documentation with usage examples
9. ✅ Integration tests with BFF pattern format

## Next Steps

→ **PLAN MODE:** Clarify 6 questions above with user, then create detailed 50+ step implementation checklist
