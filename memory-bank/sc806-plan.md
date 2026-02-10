# SC-806 Implementation Plan: OpenTelemetry Trace Context Helpers

_Date: 2026-02-09_  
_Phase: PLAN_  
_Status: Ready for Execution_

## Executive Summary

SC-806 implements OpenTelemetry trace context helpers with W3C Trace Context compliance for distributed tracing. The feature provides W3C traceparent/tracestate header parsing and injection, OTel span creation with active context management, and seamless correlation ID integration from SC-805.

**Scope:** Production-ready implementation
- ✅ W3C Trace Context parsing/injection (strict validation)
- ✅ OpenTelemetry SDK integration (`@opentelemetry/api`)
- ✅ Active span context management (auto parent-child relationships)
- ✅ Tracestate passthrough (preserve vendor metadata)
- ✅ Correlation ID auto-injection as span attribute
- ✅ ~1,030 LOC (implementation + comprehensive tests)

---

## Architectural Decisions (Finalized)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **OTel Integration Level** | Auto-context propagation | Active span management with `context.with()` for automatic parent-child relationships |
| **Tracestate Handling** | Passthrough only | Preserve vendor metadata as-is without parsing; simplifies implementation |
| **W3C Validation** | Strict (fail fast) | Reject any deviation from spec; no legacy support needed |
| **Testing Approach** | Both unit + integration | Mock OTel for unit tests; real SDK for integration tests |
| **Runtime Support** | Universal (Headers API) | Single implementation works everywhere (browser, Node, Workers) |
| **Context Management** | Yes (active span) | Manage async context for automatic parent-child span relationships |
| **Dependencies** | @opentelemetry/api only | Minimal production dependency; Apache 2.0 licensed |
| **Correlation ID** | Auto-inject as attribute | Seamless integration with SC-805; always included in spans |

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Dependencies & Types (Checklist 1-3)

1. **Install OpenTelemetry dependencies**
   - Add `@opentelemetry/api@^1.9.0` to dependencies
   - Add `@opentelemetry/sdk-trace-base@^1.9.0` to devDependencies
   - Add `@opentelemetry/sdk-trace-node@^1.9.0` to devDependencies
   - Run `npm install`
   - Verify package.json updated correctly

2. **Create type definitions file: `src/utils/observability/trace-types.ts`**
   - Import `CorrelationId` from `./correlation-id`
   - Define `TraceContext` interface:
     - `traceId: string` (32 hex chars, lowercase)
     - `spanId: string` (16 hex chars, lowercase)
     - `traceFlags: number` (0x00 or 0x01)
     - `tracestate?: string` (optional vendor metadata)
   - Define `SpanOptions` interface:
     - `attributes?: Record<string, string | number | boolean>`
     - `parent?: TraceContext`
     - `correlationId?: CorrelationId`
   - Add comprehensive JSDoc for all types
   - Include W3C spec link and format examples

3. **Export types from observability barrel**
   - Update `src/utils/observability/index.ts`
   - Export `{ TraceContext, SpanOptions }` from `./trace-types`
   - Add JSDoc comments for new exports

### Phase 2: W3C Trace Context Implementation (Checklist 4-6)

4. **Create W3C trace context parser: `src/utils/observability/trace-context.ts`**
   - Import types from `./trace-types`
   - Define constants:
     - `TRACEPARENT_REGEX = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/`
     - `ALL_ZEROS_TRACE_ID = '00000000000000000000000000000000'`
     - `ALL_ZEROS_SPAN_ID = '0000000000000000'`
     - `FORBIDDEN_VERSION = 'ff'`
   - Implement `generateTraceId(): string`
     - Use `crypto.randomUUID()` (16 bytes)
     - Convert to 32 hex chars lowercase
     - Verify not all zeros
   - Implement `generateSpanId(): string`
     - Generate 8 random bytes
     - Convert to 16 hex chars lowercase
     - Verify not all zeros
   - Add file-level JSDoc documentation
   - Add comprehensive JSDoc for all functions

5. **Implement extractTraceContext function**
   - Signature: `extractTraceContext(headers: Headers): TraceContext | null`
   - Get `traceparent` header (case-insensitive: try 'traceparent', 'Traceparent', 'TRACEPARENT')
   - Return null if missing
   - Validate format with `TRACEPARENT_REGEX.test()`
   - Extract groups: version, trace-id, span-id, trace-flags
   - Validate trace-id !== `ALL_ZEROS_TRACE_ID`
   - Validate span-id !== `ALL_ZEROS_SPAN_ID`
   - Parse trace-flags as hex number
   - Get `tracestate` header (optional, may be multiple per RFC7230)
   - If multiple tracestate headers, concatenate with comma
   - Return `TraceContext` object or null if invalid
   - Add JSDoc with W3C spec examples

6. **Implement injectTraceContext function**
   - Signature: `injectTraceContext(context: TraceContext, headers: Headers): void`
   - Validate context.traceId (32 hex chars, lowercase, not all zeros)
   - Validate context.spanId (16 hex chars, lowercase, not all zeros)
   - Validate context.traceFlags (must be number 0x00 or 0x01)
   - Throw error if validation fails
   - Format traceparent: `00-${traceId}-${spanId}-${traceFlags.toString(16).padStart(2, '0')}`
   - Set `traceparent` header
   - If context.tracestate exists, set `tracestate` header
   - Add JSDoc with injection examples

### Phase 3: OpenTelemetry Tracer Integration (Checklist 7-9)

7. **Create OpenTelemetry tracer wrapper: `src/utils/observability/tracer.ts`**
   - Import from `@opentelemetry/api`: `trace`, `context`, `Span`, `SpanContext`
   - Import `{ generateCorrelationId }` from `./correlation-id`
   - Import types from `./trace-types`
   - Define module-level tracer: `let tracer: Tracer | null = null`
   - Add file-level JSDoc explaining OTel integration

8. **Implement tracer initialization and span creation**
   - Implement `initializeTracer(serviceName: string): void`
     - Get tracer: `trace.getTracer(serviceName, '1.0.0')`
     - Store in module variable
     - Throw if called twice with different service name
   - Implement `createSpan(name: string, options?: SpanOptions): Span`
     - Ensure tracer initialized (throw if not)
     - Get correlationId from options or generate new one
     - Merge attributes: `{ ...options?.attributes, 'correlation.id': correlationId }`
     - Determine parent context:
       - If `options?.parent` exists, create SpanContext from TraceContext
       - Otherwise use `context.active()`
     - Call `tracer.startSpan(name, { attributes }, parentContext)`
     - Set as active span: `context.with(trace.setSpan(parentContext, span), () => {})`
     - Return span
   - Add comprehensive JSDoc for both functions

9. **Implement helper functions for span context**
   - Implement `getActiveSpan(): Span | undefined`
     - Return `trace.getSpan(context.active())`
     - Return undefined if no active span
   - Implement `withSpan<T>(span: Span, fn: () => T): T`
     - Get current context
     - Set span in context: `trace.setSpan(context.active(), span)`
     - Execute fn with context: `context.with(spanContext, fn)`
     - Return result
   - Add JSDoc with usage examples

### Phase 4: Barrel Exports (Checklist 10)

10. **Update observability barrel exports**
    - Update `src/utils/observability/index.ts`
    - Export types: `{ TraceContext, SpanOptions }`
    - Export from trace-context: `{ extractTraceContext, injectTraceContext, generateTraceId, generateSpanId }`
    - Export from tracer: `{ initializeTracer, createSpan, getActiveSpan, withSpan }`
    - Add JSDoc section comments for organization

### Phase 5: Unit Tests - W3C Trace Context (Checklist 11-13)

11. **Create trace context test file: `src/__tests__/trace-context.test.ts`**
    - Import functions from `../utils/observability/trace-context`
    - Import types from `../utils/observability/trace-types`
    - Create test suite: `describe('W3C Trace Context - extractTraceContext')`
    - Write 18 tests for extractTraceContext:
      - Valid traceparent with sampled flag (0x01) → returns TraceContext
      - Valid traceparent with not-sampled flag (0x00) → returns TraceContext
      - Valid traceparent + tracestate → includes tracestate in result
      - Missing traceparent → returns null
      - Invalid format (wrong number of dashes) → returns null
      - Invalid version (not "00") → returns null
      - Version "ff" (forbidden) → returns null
      - Uppercase hex chars in trace-id → returns null
      - Uppercase hex chars in span-id → returns null
      - Trace-id all zeros → returns null
      - Span-id all zeros → returns null
      - Invalid trace-flags (non-hex) → returns null
      - Too short trace-id (31 chars) → returns null
      - Too long trace-id (33 chars) → returns null
      - Non-hex characters in trace-id → returns null
      - Non-hex characters in span-id → returns null
      - Case-insensitive header lookup ("Traceparent", "TRACEPARENT") → works
      - Empty traceparent value → returns null

12. **Write injectTraceContext tests**
    - Create test suite: `describe('W3C Trace Context - injectTraceContext')`
    - Write 12 tests:
      - Valid context → sets traceparent header correctly
      - Valid context + tracestate → sets both headers
      - Sampled flag (0x01) → traceparent ends with "-01"
      - Not-sampled flag (0x00) → traceparent ends with "-00"
      - Invalid trace-id (all zeros) → throws error
      - Invalid span-id (all zeros) → throws error
      - Invalid trace-id (wrong length, 30 chars) → throws error
      - Invalid span-id (wrong length, 14 chars) → throws error
      - Trace flags formatted with leading zero (0x0a → "0a")
      - Preserves other existing headers
      - Overwrites existing traceparent if present
      - Handles empty Headers object

13. **Write helper function tests**
    - Create test suite: `describe('W3C Trace Context - Helpers')`
    - Write 8 tests:
      - generateTraceId() → returns 32 lowercase hex chars
      - generateTraceId() → never returns all zeros
      - generateTraceId() → generates unique values (1000 iterations, Set size = 1000)
      - generateTraceId() → matches pattern /^[0-9a-f]{32}$/
      - generateSpanId() → returns 16 lowercase hex chars
      - generateSpanId() → never returns all zeros
      - generateSpanId() → generates unique values (1000 iterations)
      - generateSpanId() → matches pattern /^[0-9a-f]{16}$/

### Phase 6: Integration Tests - OpenTelemetry (Checklist 14-16)

14. **Create tracer test file with OTel SDK setup: `src/__tests__/tracer.test.ts`**
    - Import from `@opentelemetry/sdk-trace-base`: `{ BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor }`
    - Import from `@opentelemetry/api`: `{ trace, context }`
    - Import functions from `../utils/observability/tracer`
    - Setup before all tests:
      - Create `InMemorySpanExporter`
      - Create `BasicTracerProvider`
      - Add `SimpleSpanProcessor` with exporter
      - Call `provider.register()`
    - Setup before each test:
      - Call `exporter.reset()`
    - Teardown after all tests:
      - Unregister provider

15. **Write tracer initialization and basic span tests**
    - Create test suite: `describe('OpenTelemetry Tracer')`
    - Write 10 tests:
      - initializeTracer('test-service') → no errors
      - createSpan('test-span') → returns Span object
      - createSpan('test-span') → span has correct name
      - createSpan() → auto-includes correlation ID attribute
      - createSpan() with custom correlationId → uses provided ID
      - createSpan() with custom attributes → includes all attributes
      - createSpan() → creates root span (no parent)
      - getActiveSpan() outside span → returns undefined
      - getActiveSpan() within active span → returns span
      - Span.end() → exports span with correlation ID attribute

16. **Write context propagation and parent-child tests**
    - Create test suite: `describe('OpenTelemetry Context Propagation')`
    - Write 5 tests:
      - createSpan() with parent TraceContext → uses parent trace-id
      - createSpan() with parent TraceContext → generates new span-id
      - Nested createSpan() calls → auto parent-child relationship
      - withSpan() → executes function with span context
      - withSpan() with nested spans → maintains correct context stack
    - Verify exported spans have correct parent-child relationships

### Phase 7: Documentation & Build (Checklist 17-18)

17. **Add JSDoc documentation to all files**
    - Verify `trace-types.ts` has complete type documentation
    - Verify `trace-context.ts` has file-level and function-level docs
    - Verify `tracer.ts` has file-level and function-level docs
    - Add W3C spec link: https://www.w3.org/TR/trace-context/
    - Add OpenTelemetry docs link: https://opentelemetry.io/docs/
    - Include usage examples in JSDoc

18. **Build and verify exports**
    - Run `npm run build`
    - Verify all files compile without errors
    - Verify exports in `dist/utils/index.d.ts` include new functions
    - Run `npm test` to verify all tests pass
    - Verify test coverage meets 80% threshold
    - Check bundle size still under 50KB threshold

---

## Test Coverage Summary

**Target:** 80% minimum, aiming for 95%+

**Test Files:**
1. `trace-context.test.ts` - 38 tests
   - extractTraceContext: 18 tests
   - injectTraceContext: 12 tests
   - Helper functions: 8 tests

2. `tracer.test.ts` - 15 tests
   - Basic functionality: 10 tests
   - Context propagation: 5 tests

**Total Tests:** 53 tests

---

## API Documentation

### Type Exports

```typescript
export interface TraceContext {
  traceId: string;        // 32 hex chars (lowercase)
  spanId: string;         // 16 hex chars (lowercase)
  traceFlags: number;     // 0x00 or 0x01
  tracestate?: string;    // Optional vendor metadata
}

export interface SpanOptions {
  attributes?: Record<string, string | number | boolean>;
  parent?: TraceContext;
  correlationId?: CorrelationId;
}
```

### Function Exports

**W3C Trace Context:**
- `extractTraceContext(headers: Headers): TraceContext | null`
- `injectTraceContext(context: TraceContext, headers: Headers): void`
- `generateTraceId(): string`
- `generateSpanId(): string`

**OpenTelemetry Integration:**
- `initializeTracer(serviceName: string): void`
- `createSpan(name: string, options?: SpanOptions): Span`
- `getActiveSpan(): Span | undefined`
- `withSpan<T>(span: Span, fn: () => T): T`

---

## Usage Examples

### Server-side trace propagation

```typescript
import { extractTraceContext, initializeTracer, createSpan, injectTraceContext } from '@mtsynergy/platform-core/utils';

// One-time initialization
initializeTracer('my-service');

// Incoming request
const incomingContext = extractTraceContext(request.headers);

// Create span (inherits trace-id from incoming context)
const span = createSpan('handle-request', {
  parent: incomingContext,
  attributes: { method: 'POST', path: '/api/v1/data' }
});

try {
  // Do work...
  
  // Make outbound call
  const outboundHeaders = new Headers();
  const currentContext = {
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
    traceFlags: span.spanContext().traceFlags
  };
  injectTraceContext(currentContext, outboundHeaders);
  
  await fetch('https://downstream.api', { headers: outboundHeaders });
} finally {
  span.end();
}
```

### Nested spans with auto-context

```typescript
import { createSpan, withSpan } from '@mtsynergy/platform-core/utils';

const parentSpan = createSpan('parent-operation');

withSpan(parentSpan, () => {
  // This span automatically becomes a child of parentSpan
  const childSpan = createSpan('child-operation', {
    attributes: { step: 'validation' }
  });
  
  // Do work...
  
  childSpan.end();
});

parentSpan.end();
```

---

## Dependencies Added

**package.json changes:**

```json
{
  "dependencies": {
    "uuid": "^13.0.0",
    "@opentelemetry/api": "^1.9.0"
  },
  "devDependencies": {
    "@opentelemetry/sdk-trace-base": "^1.9.0",
    "@opentelemetry/sdk-trace-node": "^1.9.0"
  }
}
```

**License Compliance:**
- `@opentelemetry/api`: Apache 2.0 ✅
- `@opentelemetry/sdk-trace-base`: Apache 2.0 ✅
- `@opentelemetry/sdk-trace-node`: Apache 2.0 ✅

---

## Success Criteria

- [ ] All 53 tests passing
- [ ] Build completes without errors
- [ ] Type checking passes (strict mode)
- [ ] Test coverage ≥80%
- [ ] Bundle size < 50KB (gzipped)
- [ ] All exports available from `@mtsynergy/platform-core/utils`
- [ ] JSDoc documentation complete
- [ ] W3C Trace Context strict validation working
- [ ] OpenTelemetry spans created with correlation IDs
- [ ] Context propagation working for parent-child relationships

---

_Plan approved and ready for EXECUTE mode._
