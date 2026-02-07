# SC-804 Innovation: Design Alternatives & Trade-off Analysis

_Date: 2026-02-06_  
_Phase: INNOVATE_

## Design Decision Areas

### 1. Pattern Fetching Strategy

**Decision:** How should platform-core handle fetching PII patterns from BFF?

#### Approach A: Consumer-Managed Fetching
**Description:** Platform-core exports synchronous functions only. Consumers are responsible for:
- Fetching patterns from BFF API (`GET /api/observability/pii-patterns`)
- Managing cache lifecycle (5-minute refresh, version tracking)
- Initializing patterns before using sanitizers

**Advantages:**
- ✅ Maximum flexibility for different consumer architectures (browser vs Node vs mobile)
- ✅ Platform-core remains simple, single responsibility (sanitization only)
- ✅ Consumers can implement custom caching (sessionStorage, AsyncStorage, Redis, etc.)
- ✅ No hard dependency on network/BFF availability
- ✅ Easier testing (mock patterns easily)
- ✅ Smaller bundle size (no HTTP client code)

**Disadvantages:**
- ❌ Higher barrier to entry (consumers must implement fetching)
- ❌ More boilerplate code duplicated across consumers
- ❌ Risk of inconsistent pattern management between Shell, Mobile, Node
- ❌ Easier to accidentally forget pattern initialization
- ❌ Harder to force pattern version updates across all consumers

**Example API:**
```typescript
// Consumer setup
const patterns = await fetchPatternsFromBFF()
const sanitizer = new PiiSanitizer(patterns)
sanitizer.setAutoRefresh(300000, fetchPatternsFromBFF)  // 5 min
```

---

#### Approach B: Platform-Core Includes HTTP Client
**Description:** Platform-core exports pattern fetching + caching utilities. Consumers can:
- Use convenience helpers: `initPiiSanitizer()` handles fetching + caching
- Or still manage patterns manually for custom scenarios

**Advantages:**
- ✅ Simpler consumer API (one-line initialization)
- ✅ Consistent pattern management across all consumers
- ✅ Easier to implement pattern version enforcement
- ✅ Centralized BFF communication strategy
- ✅ Automatic refresh mechanism included
- ✅ Better error handling (BFF unavailable fallbacks)

**Disadvantages:**
- ❌ Platform-core becomes larger (HTTP client code)
- ❌ Less flexible for consumers with custom fetch strategies
- ❌ Couples platform-core to BFF API contract
- ❌ Testing complexity (mock BFF responses)
- ❌ Mobile platforms may have different network requirements

**Example API:**
```typescript
// Consumer setup - simple case
await initPiiSanitizer()  // Fetches from BFF, auto-refresh

// Or custom case
const customFetcher = async () => { /* custom logic */ }
await initPiiSanitizer({ customFetcher })
```

---

#### Approach C: Hybrid - Lazy Async Loading
**Description:** Platform-core exports synchronous functions with lazy async pattern loading:
- Sync API returns sanitizers immediately (using default patterns)
- Async pattern loader available for consumers to call when ready
- Patterns auto-upgrade when fresh data arrives

**Advantages:**
- ✅ Synchronous API (no await needed for sanitization)
- ✅ Works immediately with sensible defaults
- ✅ Async pattern loading optional (no breaking change)
- ✅ Graceful upgrade path (defaults → fetched patterns)
- ✅ Works offline (sensible patterns always available)
- ✅ Smaller initial API surface

**Disadvantages:**
- ❌ Default patterns may become stale (version mismatch)
- ❌ Complexity (dual pattern management)
- ❌ Unclear when patterns are "official" vs default
- ❌ Testing edge cases (pattern upgrade race conditions)
- ❌ Consumers may forget to load fresh patterns

**Example API:**
```typescript
// Synchronous, immediate (uses defaults)
const sanitizer = new PiiSanitizer()
sanitizer.sanitizeEmail('test@example.com')

// Async upgrade (optional)
await sanitizer.loadFromBFF()
```

---

**Recommendation for PLAN Phase:** 
- **Primary (Approach A):** Consumer-Managed (maximum flexibility)
- **Secondary (Approach B):** Include helpers for Approach A (reduce boilerplate)
- **Avoid (Approach C):** Default patterns add complexity without clear benefit

---

### 2. Function API Design

**Decision:** Should we export specific validators or generic pattern-based functions?

#### Approach A: Specific Function per PII Type
**Description:** Export individual, named functions for each PII type

**Advantages:**
- ✅ Maximum clarity and type safety
- ✅ Easy autocomplete (`sanitizeEmail`, `sanitizePhone`, etc.)
- ✅ Self-documenting code
- ✅ Can optimize each function for its specific pattern
- ✅ No need for consumers to know pattern structure

**Disadvantages:**
- ❌ More boilerplate code (5 functions minimum)
- ❌ Hard to add new PII types without changing exports
- ❌ Less flexible for consumers with custom patterns
- ❌ Function duplication (all do similar things)

**Example API:**
```typescript
sanitizeEmail(str, replacement?)
sanitizePhone(str, replacement?)
redactToken(str, replacement?)
maskIdentifier(str, replacement?)
scrubObject(obj, patterns)
```

---

#### Approach B: Generic Pattern-Based Functions
**Description:** Export single `applyPattern()` function, consumers pass patterns

**Advantages:**
- ✅ Minimal code surface (1-2 functions)
- ✅ Easy to add new PII types (no code change)
- ✅ Maximum flexibility for custom patterns
- ✅ Composable (chain patterns together)
- ✅ Easier testing (parameterized)

**Disadvantages:**
- ❌ Less self-documenting
- ❌ Consumers must understand pattern structure
- ❌ Easier to misuse (invalid patterns silently fail)
- ❌ No specific optimization per type
- ❌ Type safety depends on pattern correctness

**Example API:**
```typescript
applyPattern(str, pattern: PiiPattern)
applyPatterns(str, patterns: PiiPattern[])
scrubObject(obj, patterns: PiiPattern[])
```

---

#### Approach C: Hybrid - Specific Functions + Generic Base
**Description:** Export specific functions AND generic utilities

**Advantages:**
- ✅ Best of both worlds
- ✅ Simple cases use specific functions
- ✅ Advanced cases use generic API
- ✅ Self-documenting for common PII types
- ✅ Extensible for custom patterns
- ✅ Can build specific functions on generic base (DRY)

**Disadvantages:**
- ❌ Larger API surface
- ❌ Potential confusion (which to use?)
- ❌ Testing complexity (test both paths)
- ❌ Maintenance burden (keep specific + generic in sync)

**Example API:**
```typescript
// Specific
sanitizeEmail(str, replacement?) → uses email pattern
sanitizePhone(str, replacement?) → uses phone pattern

// Generic base
applyPattern(str, pattern: PiiPattern)
applyPatterns(str, patterns: PiiPattern[])

// Bulk
scrubObject(obj, patterns: PiiPattern[])
```

---

**Recommendation for PLAN Phase:** 
- **Primary (Approach C):** Hybrid approach
  - Specific functions for required PII types (email, phone, token, identifier)
  - Generic `applyPattern()` for extensibility
  - `scrubObject()` uses generic base

---

### 3. Caching Architecture

**Decision:** How to structure pattern caching for 5-minute refresh + version tracking?

#### Approach A: Simple In-Memory Cache with Timer
**Description:** Basic cache with interval-based refresh

**Advantages:**
- ✅ Minimal code (setTimeout-based)
- ✅ Simple to understand
- ✅ Fast access (in-memory)
- ✅ No external storage needed

**Disadvantages:**
- ❌ Loss of patterns on reload (browser) or restart (Node)
- ❌ No version tracking (can't detect stale patterns)
- ❌ Refresh happens regardless of version change
- ❌ Hard to test (time-dependent)
- ❌ Can't force refresh when needed
- ❌ Memory leaks if not cleaned up

**Example:**
```typescript
let cachedPatterns: PiiPattern[] | null = null
let refreshTimer: NodeJS.Timeout | null = null

function setAutoRefresh(interval: number, fetcher: () => Promise<PiiPattern[]>) {
  refreshTimer = setInterval(async () => {
    cachedPatterns = await fetcher()
  }, interval)
}
```

---

#### Approach B: Version-Aware Cache with Smart Refresh
**Description:** Cache with version tracking, only refresh on version change

**Advantages:**
- ✅ Efficient (no refresh if version unchanged)
- ✅ Detects stale patterns immediately
- ✅ Configurable refresh strategies (time-based, version-based, manual)
- ✅ Easy to force-refresh when needed
- ✅ Can log version mismatches for monitoring
- ✅ Better testability (deterministic with versions)

**Disadvantages:**
- ❌ More code complexity
- ❌ Requires version in BFF response
- ❌ Must handle version parsing logic
- ❌ Harder to understand for simple cases
- ❌ Testing complexity (mock version changes)

**Example:**
```typescript
interface CacheEntry {
  patterns: PiiPattern[]
  version: string
  fetchedAt: number
}

class PiiCache {
  refresh(): detects version change, only fetches if different
}
```

---

#### Approach C: Hybrid - Simple Default + Advanced Optional
**Description:** Simple in-memory by default, but allow advanced cache implementations

**Advantages:**
- ✅ Simple default path (just use patterns)
- ✅ Advanced consumers can use version-aware caching
- ✅ Flexible for different scenarios
- ✅ Consumers control cache sophistication
- ✅ No forced complexity

**Disadvantages:**
- ❌ Inconsistent pattern freshness across consumers
- ❌ Potentially stale patterns in production
- ❌ Higher support burden (many cache implementations)
- ❌ Testing different cache strategies
- ❌ Hard to enforce pattern version compliance

**Example:**
```typescript
// Simple
const sanitizer = new PiiSanitizer(patterns)

// Advanced (custom cache)
const cache = new VersionAwarePiiCache()
const patterns = await cache.getPatterns()
const sanitizer = new PiiSanitizer(patterns)
```

---

**Recommendation for PLAN Phase:**
- **Primary (Approach B):** Version-Aware Cache
  - Efficient (only refresh on version change)
  - Supports 5-minute time-based refresh as fallback
  - Enforces pattern consistency
  - Enables monitoring/metrics
  
---

### 4. Recursive Object Sanitization Strategy

**Decision:** How to safely traverse objects without infinite loops or performance issues?

#### Approach A: Simple Recursive Traversal with Depth Limit
**Description:** Recursive function with max depth to prevent stack overflow

**Advantages:**
- ✅ Straightforward implementation
- ✅ Natural for nested structures
- ✅ Easy to understand logic
- ✅ Handles circular references (by depth limit)
- ✅ No additional data structures needed

**Disadvantages:**
- ❌ Depth limit may be too shallow for legitimate deep objects
- ❌ Legitimate deep structures get truncated
- ❌ Hard to find optimal depth limit
- ❌ Stack overflow still possible with very deep objects
- ❌ Less efficient than iterative approach

**Example:**
```typescript
function scrubObject(obj: any, patterns: PiiPattern[], depth = 0): any {
  if (depth > 10) return obj  // Depth limit
  // ... recursive logic
}
```

---

#### Approach B: Iterative with WeakSet for Circular Detection
**Description:** Use explicit loop + WeakSet to track visited objects

**Advantages:**
- ✅ No stack overflow risk
- ✅ True circular reference detection (not just depth limit)
- ✅ Can handle arbitrary depth
- ✅ Better performance (no recursion overhead)
- ✅ Graceful handling of actual cycles

**Disadvantages:**
- ❌ More complex code (need explicit stack)
- ❌ WeakSet only works with objects (not primitives)
- ❌ Harder to understand logic flow
- ❌ Testing complexity (circular structure setup)
- ❌ Memory overhead (need to track visited set)

**Example:**
```typescript
function scrubObject(obj: any, patterns: PiiPattern[]): any {
  const visited = new WeakSet()
  const stack = [{ obj, key: null, parent: null }]
  // ... iterative logic
}
```

---

#### Approach C: Hybrid - Depth Limit with Early Circular Detection
**Description:** Recursive but detect common circular patterns early

**Advantages:**
- ✅ Simple for normal cases (recursive)
- ✅ Detects obvious cycles (parent/children)
- ✅ Falls back to depth limit
- ✅ Good balance of simplicity and safety
- ✅ Reasonable performance

**Disadvantages:**
- ❌ May not catch all circular references
- ❌ Still has depth limit issues
- ❌ Partial solution (not comprehensive)
- ❌ Testing both paths (recursion + cycle detection)

**Example:**
```typescript
function scrubObject(obj: any, patterns, depth = 0, parent = null): any {
  if (obj === parent) return obj  // Obvious cycle
  if (depth > 10) return obj  // Fallback to depth
  // ... recursive logic
}
```

---

**Recommendation for PLAN Phase:**
- **Primary (Approach B):** Iterative with WeakSet
  - Most robust (true circular detection)
  - No stack overflow risk
  - Better performance
  - Justifiable complexity for important utility

---

### 5. Error Handling Strategy

**Decision:** How to handle malformed patterns, invalid inputs, sanitization failures?

#### Approach A: Fail-Fast (Throw Errors)
**Description:** Throw exceptions on any issue (invalid pattern, bad input, etc.)

**Advantages:**
- ✅ Explicit error detection
- ✅ Forces consumers to handle errors
- ✅ No silent failures
- ✅ Clear bug signals

**Disadvantages:**
- ❌ Requires try-catch everywhere
- ❌ May crash application on bad input
- ❌ Sanitization is defensive operation (shouldn't break things)
- ❌ Hard to debug (error stops execution)
- ❌ Worse UX (stops all logging on bad pattern)

**Example:**
```typescript
if (pattern.pattern === '') {
  throw new Error('Invalid pattern: empty regex')
}
```

---

#### Approach B: Graceful Fallback (No-Op)
**Description:** Silently skip invalid patterns, return original string

**Advantages:**
- ✅ Never breaks application
- ✅ Sanitization always succeeds
- ✅ Logging/traces continue (no crashes)
- ✅ Defensive mindset (sanitization helper)
- ✅ Better UX (no interruptions)

**Disadvantages:**
- ❌ Silent failures hard to debug
- ❌ Invalid patterns never discovered
- ❌ False sense of security (actually not sanitizing)
- ❌ Production bugs hard to trace
- ❌ No accountability (invisible failures)

**Example:**
```typescript
try {
  // apply pattern
} catch (e) {
  // silently return original string
  return str
}
```

---

#### Approach C: Hybrid - Warn + Fallback
**Description:** Log warnings for errors but continue (no-op)

**Advantages:**
- ✅ Never breaks application
- ✅ Creates visibility (warnings logged)
- ✅ Defensive but accountable
- ✅ Can monitor error rates in production
- ✅ Clear bug signals in logs
- ✅ Fallback prevents crashes

**Disadvantages:**
- ❌ Warning logs may be ignored
- ❌ Still requires log monitoring setup
- ❌ Pattern bugs only visible in logs (not exceptions)
- ❌ Harder to unit test (need to mock logger)

**Example:**
```typescript
if (!isValidPattern(pattern)) {
  console.warn('Invalid PII pattern:', pattern)
  return str  // Fallback
}
```

---

**Recommendation for PLAN Phase:**
- **Primary (Approach C):** Warn + Fallback
  - Defensive (never breaks)
  - Visible (logs show issues)
  - Production-safe
  - Enables monitoring

---

### 6. Type Safety & Validation

**Decision:** How much type safety vs flexibility for pattern validation?

#### Approach A: Strict TypeScript Types Only
**Description:** Rely on TypeScript compiler to validate pattern structure

**Advantages:**
- ✅ Compile-time safety
- ✅ No runtime validation overhead
- ✅ Clear type contracts
- ✅ Autocomplete in IDE

**Disadvantages:**
- ❌ Only works in TypeScript projects
- ❌ Doesn't catch runtime issues (BFF returns wrong format)
- ❌ No validation of regex strings
- ❌ JavaScript consumers not protected
- ❌ Invalid patterns only caught at runtime

**Example:**
```typescript
interface PiiPattern {
  name: string
  pattern: string
  replacement: string
}
// Compile-time only, no runtime checks
```

---

#### Approach B: Runtime Validation (Zod/Yup)
**Description:** Use schema validation library for pattern validation

**Advantages:**
- ✅ Runtime safety (catches BFF wrong format)
- ✅ Works in JavaScript too
- ✅ Validates regex strings
- ✅ Clear error messages
- ✅ Enables strict mode

**Disadvantages:**
- ❌ Adds external dependency (Zod/Yup)
- ❌ Bundle size increase
- ❌ Runtime performance cost
- ❌ Violates zero-dependency principle
- ❌ Over-engineered for simple validation

**Example:**
```typescript
import { z } from 'zod'
const PatternSchema = z.object({
  name: z.enum(['email', 'phone', ...]),
  pattern: z.string().regex(/^\/.*\/[gimuy]*$/),
  replacement: z.string()
})
```

---

#### Approach C: Lightweight Manual Validation
**Description:** Custom validation functions in platform-core (no dependencies)

**Advantages:**
- ✅ Runtime safety (catches BFF wrong format)
- ✅ No external dependencies
- ✅ Works in JavaScript/TypeScript
- ✅ Custom error messages
- ✅ Light performance cost
- ✅ Validates regex strings
- ✅ Can be granular (validate what matters)

**Disadvantages:**
- ❌ More code to maintain
- ❌ Validation logic not declarative
- ❌ Manual validation for each function
- ❌ Less extensible (hard to add new validation rules)

**Example:**
```typescript
function isValidPattern(pattern: any): boolean {
  if (typeof pattern !== 'object') return false
  if (typeof pattern.pattern !== 'string') return false
  try { new RegExp(pattern.pattern) } catch { return false }
  return true
}
```

---

**Recommendation for PLAN Phase:**
- **Primary (Approach C):** Lightweight Manual Validation
  - No external dependencies
  - Custom error messages
  - Runtime safety for BFF responses
  - Keeps bundle size minimal
  - Validates regex strings

---

## Summary: Recommended Approach Combination

| Decision Area | Recommended | Reasoning |
|---|---|---|
| **Pattern Fetching** | Approach A (Consumer-Managed) | Maximum flexibility, simpler platform-core |
| **Function API** | Approach C (Hybrid) | Specific functions + generic base covers all use cases |
| **Caching** | Approach B (Version-Aware) | Efficient, enforces consistency, production-safe |
| **Object Traversal** | Approach B (Iterative + WeakSet) | Most robust, no stack overflow, best performance |
| **Error Handling** | Approach C (Warn + Fallback) | Production-safe, visible issues, never breaks |
| **Type Validation** | Approach C (Manual) | No dependencies, runtime safety, lightweight |

---

## Remaining Open Questions for PLAN Phase

1. **Pattern API Contract:** What exact format does BFF return from `/api/observability/pii-patterns`?
   - Single response object with `version` + `patterns` array?
   - Or ConfigMap format directly?

2. **Default Patterns:** Should platform-core include hardcoded fallback patterns if BFF unavailable?
   - Ensures sanitization always available?
   - Or require explicit initialization (fail fast)?

3. **Replacement Token Strategy:**
   - Fixed replacements per type (`[REDACTED-EMAIL]`)?
   - Or customizable replacements per call?
   - Or both (custom overrides default)?

4. **Object Traversal Depth:** What's reasonable max depth for `scrubObject()`?
   - 10? 20? 50? Unlimited (trust WeakSet)?

5. **Performance Targets:** Are there SLA requirements?
   - Max time to sanitize 1MB object?
   - Max memory for pattern cache?

6. **Monitoring/Metrics:** Should sanitization functions emit metrics?
   - Count of redactions per type?
   - Performance timings?
   - Or defer to consumers?

---

_Ready for PLAN mode to make these decisions official and create implementation checklist._
