# SC-804 Plan: PII Sanitization Functions

_Date: 2026-02-07_  
_Phase: PLAN_  
_Status: Ready for Execution_

## Executive Summary

SC-804 implements shared PII (Personally Identifiable Information) sanitization functions for observability utilities. The feature provides 5 core functions that strip sensitive data from logs and traces, protecting user privacy across Shell, Mobile, BFF, and Node.js consumers.

**Scope:** Focused implementation
- ✅ 5 core sanitization functions
- ✅ Regex-based pattern matching
- ✅ Recursive object traversal with circular reference detection
- ✅ No external dependencies (zero-dependency principle)
- ✅ ~400 LOC + ~300 LOC tests

---

## Architectural Decisions (Finalized)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Pattern Fetching** | Consumer-Managed Async Loader | Maximum flexibility; each consumer handles fetch/cache strategy |
| **Function API** | Hybrid: Specific Functions + Generic Base | Email/Phone/Token/Identifier specific functions + generic API for extensibility |
| **Caching** | Version-Aware Cache (via consumer) | 5-minute refresh as baseline; consumers control sophistication |
| **Object Traversal** | Iterative + WeakSet (Configurable Depth) | No stack overflow; true circular detection; caller sets maxDepth |
| **Error Handling** | Warn + Fallback (Production-Safe) | Log warnings for errors; silently skip invalid patterns; never crash |
| **Type Validation** | Lightweight Manual | No external validation libs; validates regex strings at runtime |
| **Default Patterns** | None (Fail Fast) | Require explicit pattern initialization; no hardcoded fallbacks |
| **Replacement Tokens** | Configurable with Defaults | Default tokens per type; caller can override per function call |
| **Performance** | Optimize for Correctness | No specific SLA; correctness is priority (PII protection critical) |
| **Metrics** | None (Consumer Responsibility) | Platform-core doesn't emit metrics; consumers handle observability |

---

## File Specifications

### 1. `src/utils/pii-types.ts` (New)

**Purpose:** Type definitions for PII sanitization module.

**Exports:**

```typescript
// Core PII pattern type
interface PiiPattern {
  name: 'email' | 'phone' | 'ssn' | 'credit_card' | 'token' | 'api_key' | 'password' | 'jwt' | 'custom'
  pattern: string  // Regex string (not compiled)
  replacement: string
}

// Sanitization options
interface ScrubOptions {
  maxDepth?: number  // Max recursion depth (default: 50)
  visited?: Set<any>  // Track visited objects (internal)
}

// Validation result
interface ValidationResult {
  isValid: boolean
  error?: string
}

// Exported type aliases
export type PiiPatternName = 'email' | 'phone' | 'ssn' | 'credit_card' | 'token' | 'api_key' | 'password' | 'jwt' | 'custom'
```

**No JSDoc for this file** (simple type definitions).

---

### 2. `src/utils/pii-validation.ts` (New)

**Purpose:** Pattern validation and helper functions (pure utilities, no side effects).

**Exports:**

```typescript
/**
 * Validates that a pattern object is properly formatted
 * @param pattern - Pattern to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
function isValidPiiPattern(pattern: any): ValidationResult

/**
 * Validates that a regex string can be compiled
 * @param regexString - Regex string to test (e.g., "^[\\w+.-]+@[\\w-]+\\.[a-z]{2,}$")
 * @returns ValidationResult with isValid flag and optional error message
 */
function isValidRegexString(regexString: string): ValidationResult

/**
 * Validates an array of patterns
 * @param patterns - Array of patterns to validate
 * @returns ValidationResult; isValid=true only if all patterns valid
 */
function validatePatterns(patterns: PiiPattern[]): ValidationResult

/**
 * Compiles a regex string into RegExp object with error handling
 * @param regexString - Regex string
 * @returns Compiled RegExp or null if invalid
 * @note Used internally; warns on invalid regex
 */
function compileRegex(regexString: string): RegExp | null
```

**Validation Rules:**
- Pattern must be object with `name`, `pattern` (string), `replacement` (string)
- Pattern `name` must be from allowed enum
- Pattern `pattern` must be valid regex string
- Pattern `replacement` must be non-empty string
- Invalid patterns logged as warnings; functions skip invalid patterns gracefully

---

### 3. `src/utils/pii-sanitizers.ts` (New)

**Purpose:** Core PII sanitization functions.

**Exports:**

```typescript
/**
 * Sanitizes email addresses in a string
 * @param str - Input string
 * @param replacement - Optional custom replacement token (default: '[REDACTED-EMAIL]')
 * @returns Sanitized string with email addresses replaced
 * @example
 * sanitizeEmail('Contact: john@example.com') // 'Contact: [REDACTED-EMAIL]'
 * sanitizeEmail('Email: test@test.com', '[EMAIL]') // 'Email: [EMAIL]'
 */
function sanitizeEmail(str: string, replacement?: string): string

/**
 * Sanitizes phone numbers in a string (all international formats)
 * @param str - Input string
 * @param replacement - Optional custom replacement token (default: '[REDACTED-PHONE]')
 * @returns Sanitized string with phone numbers replaced
 * @example
 * sanitizePhone('Call +1-555-1234') // 'Call [REDACTED-PHONE]'
 */
function sanitizePhone(str: string, replacement?: string): string

/**
 * Sanitizes OAuth tokens and API tokens in Bearer token format
 * @param str - Input string
 * @param replacement - Optional custom replacement token (default: 'Bearer [REDACTED-TOKEN]')
 * @returns Sanitized string with tokens replaced
 * @example
 * redactToken('Bearer eyJhbGc...') // 'Bearer [REDACTED-TOKEN]'
 */
function redactToken(str: string, replacement?: string): string

/**
 * Masks identifiers (SSN, credit card, API keys, JWTs)
 * @param str - Input string
 * @param replacement - Optional custom replacement token (default: '[REDACTED-IDENTIFIER]')
 * @returns Sanitized string with identifiers replaced
 * @note Handles SSN, CC numbers, long tokens, JWTs
 */
function maskIdentifier(str: string, replacement?: string): string

/**
 * Recursively sanitizes an object/array by applying patterns to all string values
 * @param obj - Object or array to sanitize
 * @param patterns - PiiPattern array (validated patterns)
 * @param options - ScrubOptions with optional maxDepth (default: 50)
 * @returns New object/array with all string values sanitized
 * @note Uses WeakSet for circular reference detection
 * @note Returns shallow copies; does not mutate original
 * @example
 * const obj = {email: 'test@example.com', nested: {phone: '+1234567890'}}
 * scrubObject(obj, patterns) // Deep copy with sanitized strings
 */
function scrubObject(obj: any, patterns: PiiPattern[], options?: ScrubOptions): any
```

**Implementation Notes:**

1. **Specific Functions (sanitizeEmail, sanitizePhone, redactToken, maskIdentifier):**
   - Each uses hardcoded regex for optimal performance
   - Default replacement tokens per SPECIFICATION.md
   - Accept optional `replacement` parameter (caller override)
   - Input validation: warn + fallback on invalid input

2. **scrubObject Function:**
   - Iterative traversal (not recursive) using explicit stack
   - WeakSet to track visited objects (circular reference detection)
   - maxDepth option (default 50) as safety net
   - Handles: objects, arrays, primitives, nulls
   - Returns new object; never mutates input
   - String values sanitized via `applyPatterns()` helper

3. **Error Handling:**
   - Invalid regex patterns: warn via console.warn(), skip pattern
   - Invalid input (non-string/non-object): return as-is
   - Invalid replacement tokens: warn, use default instead
   - No exceptions thrown (fail-safe design)

---

### 4. `src/utils/pii-applier.ts` (New - Internal Utility)

**Purpose:** Generic pattern application (used by both specific functions and scrubObject).

**Internal Exports (not in barrel):**

```typescript
/**
 * Applies a single pattern to a string
 * @param str - Input string
 * @param pattern - Compiled regex pattern
 * @param replacement - Replacement token
 * @returns Sanitized string
 */
function applyPattern(str: string, compiled: RegExp, replacement: string): string

/**
 * Applies multiple patterns to a string in sequence
 * @param str - Input string
 * @param patterns - Array of compiled PiiPattern objects
 * @returns Sanitized string (all patterns applied)
 */
function applyPatterns(str: string, patterns: PiiPattern[]): string
```

**Notes:**
- Compiled regex strings once at module load time (optimization)
- Used by both specific sanitizers and scrubObject
- Validates patterns before use (warn + skip on invalid)
- No external exports; used internally by sanitizers

---

### 5. `src/utils/index.ts` (Updated)

**Current Content:**
```typescript
export * from './types'
export * from './validation'
export * from './formatting'
```

**Updated Content:**
```typescript
export * from './types'
export * from './validation'
export * from './formatting'
export * from './pii-types'
export * from './pii-sanitizers'
// Note: pii-validation and pii-applier are internal utilities, not exported
```

---

### 6. `src/__tests__/pii-sanitizers.test.ts` (New)

**Purpose:** Comprehensive tests for PII sanitization functions.

**Test Coverage:**

1. **sanitizeEmail() - 12 tests**
   - ✅ Single email replacement
   - ✅ Multiple emails in string
   - ✅ Email-like but invalid formats (no replacement)
   - ✅ Empty string input
   - ✅ No email in string (passthrough)
   - ✅ Custom replacement token
   - ✅ Edge case: email at start/end
   - ✅ Unicode/international domains (basic)
   - ✅ Multiple dots in TLD
   - ✅ Subdomain emails
   - ✅ Plus-addressing (gmail+tag)
   - ✅ Malformed email partially matched (edge case)

2. **sanitizePhone() - 12 tests**
   - ✅ US format: (555) 123-4567
   - ✅ International format: +1-555-1234
   - ✅ Extensions: +1-555-1234 ext. 123
   - ✅ No text phone (passthrough)
   - ✅ Phone with extensions
   - ✅ Multiple phone numbers
   - ✅ Custom replacement token
   - ✅ Empty string
   - ✅ Phone in parentheses
   - ✅ Spaces vs no spaces variants
   - ✅ International codes (various)
   - ✅ Edge: incomplete phone pattern

3. **redactToken() - 10 tests**
   - ✅ Bearer token: "Bearer eyJhbGc..."
   - ✅ API key style tokens
   - ✅ No token in string (passthrough)
   - ✅ Multiple tokens
   - ✅ Custom replacement
   - ✅ Empty input
   - ✅ Token without Bearer prefix
   - ✅ Token at end of line
   - ✅ Edge: "Bearer" alone (no token)
   - ✅ JWT-style token recognition

4. **maskIdentifier() - 10 tests**
   - ✅ SSN format: XXX-XX-XXXX
   - ✅ Credit card: XXXX-XXXX-XXXX-XXXX
   - ✅ Multiple identifiers
   - ✅ Custom replacement
   - ✅ Empty input
   - ✅ No identifiers (passthrough)
   - ✅ Partial matches (edge cases)
   - ✅ Mixed types in one string
   - ✅ Edge: SSN-like but invalid
   - ✅ Long API key patterns

5. **scrubObject() - 30 tests**
   - ✅ Simple object with one email
   - ✅ Nested object (2 levels)
   - ✅ Deep nesting (5 levels)
   - ✅ Array of strings
   - ✅ Array of objects
   - ✅ Mixed arrays and objects
   - ✅ null values (passthrough)
   - ✅ undefined values (passthrough)
   - ✅ Number values (passthrough)
   - ✅ Boolean values (passthrough)
   - ✅ Empty objects
   - ✅ Empty arrays
   - ✅ Circular reference (parent → child → parent)
   - ✅ Self-reference (obj → obj)
   - ✅ Multiple objects reference same child (no duplication)
   - ✅ Custom maxDepth option (depth exceeded)
   - ✅ Default maxDepth (50) handles deep objects
   - ✅ Multiple sanitizers applied in sequence
   - ✅ String not mutated (new object returned)
   - ✅ Symbol keys (skipped)
   - ✅ Function values (skipped)
   - ✅ Date objects (passthrough)
   - ✅ RegExp objects (passthrough)
   - ✅ Set/Map objects (passthrough)
   - ✅ Large object (1000+ keys)
   - ✅ Deep array (1000+ elements)
   - ✅ Complex real-world object (user object with nested data)
   - ✅ Invalid pattern array (warnings, continues)
   - ✅ Empty pattern array (passthrough)
   - ✅ Multiple circular paths

6. **Pattern Validation - 8 tests**
   - ✅ Valid pattern object
   - ✅ Invalid pattern: missing fields
   - ✅ Invalid pattern: invalid regex string
   - ✅ Invalid pattern: empty replacement
   - ✅ Invalid pattern name
   - ✅ Array with mixed valid/invalid patterns
   - ✅ Warning logged on invalid, function continues
   - ✅ Regex compilation error handling

7. **Integration Tests - 6 tests**
   - ✅ Multiple sanitizers on same object
   - ✅ Real-world object: API response with PII
   - ✅ Real-world object: user form submission
   - ✅ Real-world object: error log with sensitive data
   - ✅ Performance: 1MB object sanitized
   - ✅ Replacement tokens: custom per function vs global

**Total Tests:** 88 tests
**Coverage Target:** 100% (all functions, branches, edge cases)

---

### 7. `src/__tests__/pii-validation.test.ts` (New)

**Purpose:** Unit tests for pattern validation utilities.

**Test Coverage:**

1. **isValidPiiPattern() - 8 tests**
   - ✅ Valid pattern object
   - ✅ Invalid: not an object
   - ✅ Invalid: missing `name`
   - ✅ Invalid: missing `pattern`
   - ✅ Invalid: missing `replacement`
   - ✅ Invalid: pattern not a string
   - ✅ Invalid: invalid regex string
   - ✅ Invalid: empty replacement

2. **isValidRegexString() - 8 tests**
   - ✅ Valid regex: simple pattern
   - ✅ Valid regex: complex pattern with groups
   - ✅ Valid regex: with flags
   - ✅ Invalid regex: unmatched bracket
   - ✅ Invalid regex: bad escape
   - ✅ Invalid regex: empty string
   - ✅ Valid regex: special characters
   - ✅ Valid regex: lookahead/lookbehind

3. **validatePatterns() - 6 tests**
   - ✅ Valid array of patterns
   - ✅ Empty array (valid)
   - ✅ Mixed valid/invalid (fails on first invalid)
   - ✅ One invalid pattern (returns error)
   - ✅ Multiple invalid patterns (returns error for first)
   - ✅ Patterns with different names (all valid)

4. **compileRegex() - 6 tests**
   - ✅ Valid regex compiled correctly
   - ✅ Invalid regex returns null
   - ✅ Warning logged on invalid regex
   - ✅ Compiled regex executes correctly
   - ✅ Regex with flags compiled correctly
   - ✅ Special characters handled correctly

**Total Tests:** 28 tests
**Coverage Target:** 100%

---

## Integration Points

### Dependencies
- **None** (zero external dependencies)
- Uses built-in: RegExp, WeakSet, Array methods, Object.keys/values/entries

### Exports (via `src/utils/index.ts`)

```typescript
// Types
export type { PiiPattern, ScrubOptions, ValidationResult, PiiPatternName }
export interface { PiiPattern, ScrubOptions, ValidationResult }

// Sanitizers
export { sanitizeEmail, sanitizePhone, redactToken, maskIdentifier, scrubObject }
```

### No changes to:
- Constants (SC-802) - not consumed
- Other utils (validation, formatting) - independent
- Type system - compatible with existing types

---

## Implementation Checklist

### Phase 1: Type Definitions (5 items)
- [ ] Create `src/utils/pii-types.ts` with PiiPattern, ScrubOptions, ValidationResult types
- [ ] Add PiiPatternName type union (8 pattern types)
- [ ] Document all type fields with brief comments
- [ ] Ensure types compatible with platform-core's existing type patterns
- [ ] Verify no import cycles

### Phase 2: Validation Utilities (6 items)
- [ ] Create `src/utils/pii-validation.ts`
- [ ] Implement `isValidPiiPattern()` with field validation
- [ ] Implement `isValidRegexString()` with regex compilation test
- [ ] Implement `validatePatterns()` for array validation
- [ ] Implement `compileRegex()` with error handling and warning logs
- [ ] Add console.warn() for validation failures (no exceptions)

### Phase 3: Pattern Application (4 items)
- [ ] Create `src/utils/pii-applier.ts`
- [ ] Implement `applyPattern()` for single regex replacement
- [ ] Implement `applyPatterns()` for multi-pattern application
- [ ] Add error handling (warn on invalid, skip pattern)
- [ ] Verify functions don't export (internal utility)

### Phase 4: Core Sanitizers (8 items)
- [ ] Create `src/utils/pii-sanitizers.ts`
- [ ] Implement `sanitizeEmail()` with default replacement
- [ ] Implement `sanitizePhone()` with international format support
- [ ] Implement `redactToken()` for Bearer tokens and API keys
- [ ] Implement `maskIdentifier()` for SSN/CC/JWTs
- [ ] Implement `scrubObject()` with iterative traversal
- [ ] Add WeakSet circular reference detection in scrubObject
- [ ] Add maxDepth option (default 50) for safety

### Phase 5: Function JSDoc & Refinement (5 items)
- [ ] Add comprehensive JSDoc comments to all exported functions
- [ ] Add @example blocks to sanitize functions
- [ ] Add @param, @returns, @note sections
- [ ] Review error handling matches Approach C (Warn + Fallback)
- [ ] Verify all functions use optional replacement parameter

### Phase 6: Export Configuration (2 items)
- [ ] Update `src/utils/index.ts` to export new types and functions
- [ ] Verify only intended exports are public (pii-applier/pii-validation internal)

### Phase 7: Core Tests - Sanitizers (18 items)
- [ ] Create `src/__tests__/pii-sanitizers.test.ts`
- [ ] Add imports and test setup
- [ ] Implement 12 sanitizeEmail tests (various formats, edge cases)
- [ ] Implement 12 sanitizePhone tests (US/international, extensions)
- [ ] Implement 10 redactToken tests (Bearer, API keys, edge cases)
- [ ] Implement 10 maskIdentifier tests (SSN, CC, JWTs, partials)
- [ ] Implement 30 scrubObject tests (nesting, circulars, maxDepth, real objects)
- [ ] Implement 8 pattern validation tests (errors, warnings, continues)
- [ ] Implement 6 integration tests (real-world objects)
- [ ] Verify 88 total tests passing
- [ ] Verify all edge cases covered

### Phase 8: Core Tests - Validation (5 items)
- [ ] Create `src/__tests__/pii-validation.test.ts`
- [ ] Implement 8 isValidPiiPattern tests
- [ ] Implement 8 isValidRegexString tests (valid/invalid regex)
- [ ] Implement 6 validatePatterns tests
- [ ] Implement 6 compileRegex tests

### Phase 9: Test Coverage & Quality (5 items)
- [ ] Run test suite: 116 tests (88 + 28) passing
- [ ] Verify 100% code coverage (all functions, branches, edge cases)
- [ ] Run type-check: zero TypeScript errors
- [ ] Run eslint: zero linting errors
- [ ] Build succeeds (ESM + CJS + .d.ts)

### Phase 10: Documentation & Integration (6 items)
- [ ] Update `README.md` with SC-804 function examples
- [ ] Add usage examples to DEVELOPMENT.md
- [ ] Example 1: Sanitizing a single email
- [ ] Example 2: Sanitizing an object tree
- [ ] Example 3: Using custom replacement tokens
- [ ] Verify no breaking changes to existing docs

### Phase 11: Final Validation (3 items)
- [ ] Verify all 116 tests passing
- [ ] Verify 100% code coverage maintained
- [ ] Verify no changes to other modules (SC-802, SC-803, constants)

---

## Testing Strategy

**Test Data:**
- Email formats: standard, with+tags, subdomains, international TLDs
- Phone formats: US, international, extensions, various separators
- Token formats: Bearer, API keys, JWTs, partial matches
- Identifiers: SSN, CC numbers, various formats
- Object structures: nested, circular, mixed types, large, deep

**Coverage Approach:**
1. Unit tests for each function (happy path, errors, edge cases)
2. Integration tests for real-world objects
3. Circular reference tests for scrubObject
4. Performance validation test (1MB object)
5. Pattern validation tests (valid/invalid patterns)

**Success Criteria:**
- 116 total tests passing
- 100% code coverage
- 0 TypeScript errors
- 0 ESLint errors
- Build succeeds with all outputs (ESM, CJS, .d.ts, source maps)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Regex Performance** | Benchmarks in perf tests; pre-compile patterns |
| **Circular References** | WeakSet detection; maxDepth safety net (50) |
| **Invalid Patterns** | Validation + warn; skip invalid, continue |
| **Memory Usage** | Iterative traversal (no recursion stack); WeakSet cleanup |
| **Type Safety** | Comprehensive TypeScript types; runtime validation |

---

## Success Metrics

✅ **Functional:** All 5 core functions work correctly (sanitizeEmail, sanitizePhone, redactToken, maskIdentifier, scrubObject)

✅ **Quality:** 100% test coverage, 0 errors (TypeScript, ESLint), all 116 tests passing

✅ **Performance:** Handles large objects (1MB+) gracefully; no stack overflows

✅ **Safety:** Circular references detected; invalid patterns don't crash; PII protected

✅ **Integration:** Exports through utils barrel; compatible with existing codebase

---

_This plan is complete and ready for user approval. Upon approval, use ENTER EXECUTE MODE to begin implementation._
