# SC-808 Research: Breadcrumb Manager with FIFO Queue

_Date: 2026-02-10_
_Status: RESEARCH MODE - Information Gathering Phase_

## Overview

**User Story**: SC-808 - Breadcrumb manager with FIFO queue
**Part Of**: Observability Utilities (SC-804–SC-808)
**Epic**: Platform Observability & Error Tracking
**Current Project State**: SC-807 Complete (Logger with PII Detection)

## Requirements from USER_STORIES.md

From the USER_STORIES.md § 5.6.7 and SC-808 definition:

### Core Capability
- **BreadcrumbManager class** with methods: `add(event)`, `getAll()`, `clear()`
- **Max 20 items** in queue
- **Max 5KB total size** limit
- **FIFO eviction** - oldest items removed when limits reached
- **Automatic PII scrubbing** applied to each breadcrumb before storage

### Event Types
- **Click**: Sanitized CSS selector (e.g., `button.submit`), timestamp
- **Navigation**: URL without query parameters (e.g., `/drafts`), timestamp
- **Form Submit**: Form ID only (no input values), timestamp
- **Network Request**: Endpoint path (e.g., `/api/v1/drafts`), status code, timestamp

### Storage Locations
- **Browser**: sessionStorage, FIFO queue, max 20 items, max 5KB total
- **Mobile**: AsyncStorage with same limits; survives app backgrounding
- **Offline queue**: Mobile breadcrumbs cached locally (max 100 items), synced on reconnect

### Error Reporting Integration
- Breadcrumbs attached to error reports sent to BFF `/api/observability/errors` with correlation ID
- Visualization in error detail view shows timeline with color coding:
  - Navigation: blue
  - Interactions: green
  - Errors: red
  - Network: orange

## Architecture Context

### Platform Detection Pattern (from SC-805, SC-806)
- React Native → Node.js → Browser fallback
- Uses `typeof` checks and if..else fallthrough
- See `src/utils/observability/trace-context.ts` for implementation reference

### Async Storage Pattern (from SC-807)
- Browser: sessionStorage (synchronous)
- Node.js: AsyncLocalStorage (from 'async_hooks')
- React Native: AsyncStorage (from 'react-native')
- Module-level fallback for environments without storage

### PII Scrubbing Integration (from SC-804, SC-807)
- Uses sanitization functions from `src/utils/pii-sanitizers.ts`
- Available sanitizers:
  - `sanitizeEmail()` - Removes email addresses
  - `sanitizePhone()` - Removes phone numbers
  - `redactToken()` - Redacts OAuth tokens and API tokens
  - `maskIdentifier()` - Masks long identifiers (40+ char sequences)
  - `scrubObject()` - Recursively sanitizes object trees
- Patterns fetched from BFF endpoint (default timeout: 5000ms)
- Fallback to provided patterns if fetch fails

### Related Implementations

#### SC-805: Correlation ID
- File: `src/utils/observability/correlation-id.ts`
- Exports: `CorrelationId` (branded type), `generateCorrelationId()`, `isValidCorrelationId()`
- Tests: `src/__tests__/correlation-id.test.ts` (19 tests)

#### SC-806: Trace Context
- File: `src/utils/observability/trace-context.ts` (80 LOC)
- Exports: `TraceContext` (interface), `extractTraceContext()`, `injectTraceContext()`, `createSpan()`
- Tests: `src/__tests__/trace-context.test.ts` (23 tests)
- Uses W3C Trace Context headers (traceparent, tracestate)
- Stores correlation ID in span attributes

#### SC-807: Logger
- Files: `src/utils/observability/logger-types.ts`, `src/utils/observability/logger.ts`
- Logger singleton with methods: `debug()`, `info()`, `warn()`, `error()`
- Automatic PII scrubbing from SC-804
- Pattern fetching from BFF with timeout/fallback
- Outputs to console/stdout with JSON structure
- Tests: `src/__tests__/logger.test.ts` (44 tests)

### Export Structure
- All observability utilities in `src/utils/observability/` directory
- Exported via `src/utils/observability/index.ts`
- Re-exported via `src/utils/index.ts` (barrel export)
- Available from `@mtsynergy/platform-core/utils`

## Implementation Requirements

### Type Definitions
- **Breadcrumb Event** type with fields:
  - `type`: 'click' | 'navigation' | 'form_submit' | 'network'
  - `data`: Event-specific data structure
  - `timestamp`: number (milliseconds since epoch)

- **Event Data Types**:
  - Click: `{ selector: string }` (PII-scrubbed)
  - Navigation: `{ url: string }` (without query params)
  - Form Submit: `{ formId: string }` (no input values)
  - Network: `{ path: string, statusCode: number }` (endpoint path only)

### Core Class Methods

#### `add(event: BreadcrumbEvent): void`
- Adds event to FIFO queue
- Scrubs event data for PII automatically
- Evicts oldest items if exceeds max size (5KB) or max count (20) limits
- Updates persistent storage (sessionStorage/AsyncStorage)

#### `getAll(): BreadcrumbEvent[]`
- Returns current breadcrumb queue as array
- Sorted by timestamp (oldest to newest)

#### `clear(): void`
- Clears all breadcrumbs from queue and storage
- Used for test isolation and session cleanup

### Storage Strategy
- **Size calculation**: JSON.stringify(breadcrumb) byte count
- **FIFO eviction**: When new breadcrumb would exceed 5KB total OR queue length > 20
- **Persistence**: Write to sessionStorage/AsyncStorage after each operation
- **Initialization**: Load existing breadcrumbs from storage on BreadcrumbManager instantiation

### Integration Points

1. **Logger Integration** (SC-807)
   - Logger could call `BreadcrumbManager.add()` for each log entry
   - Or Logger could be a separate concern

2. **Tracer Integration** (SC-806)
   - Tracer could call `BreadcrumbManager.add()` for span creation
   - Correlation ID available in span attributes

3. **Error Reporting**
   - Error boundary captures breadcrumbs using `BreadcrumbManager.getAll()`
   - Sends with error report to `/api/observability/errors`

4. **Offline Sync** (Mobile)
   - Mobile sync layer reads breadcrumbs from AsyncStorage
   - Sends batch to BFF when connection restored
   - Mobile may cache up to 100 items locally before Sync

## Design Patterns & Constraints

### Singleton Pattern
- Likely singleton (like Logger in SC-807) to share queue across application
- Or static class with module-level queue
- Decision: TBD in PLAN mode

### Size Calculation Strategy
- Option A: Estimate size during add() using approximate byte calculations
- Option B: Use JSON.stringify().length for exact calculation
- Option C: Track individual breadcrumb sizes on add, sum total
- Decision: TBD in PLAN mode

### PII Scrubbing Timing
- Scrub during `add()` before storage, keeping original data?
- Scrub during `getAll()` on retrieval?
- Both (store scrubbed)?
- Decision: TBD in PLAN mode

### Platform Detection
- Follow SC-805/SC-806 pattern: React Native → Node.js → Browser
- Or runtime detection based on global object types?
- Decision: TBD in PLAN mode

## Testing Strategy Notes

### Unit Test Categories (Planned)

1. **Initialization & Storage** (3-4 tests)
   - Breadcrumb manager instantiation
   - Load existing breadcrumbs from storage
   - Handle missing storage gracefully

2. **Adding Breadcrumbs** (6-8 tests)
   - Add single breadcrumb (all 4 event types)
   - Add multiple breadcrumbs in sequence
   - Breadcrumbs sorted by timestamp

3. **FIFO Eviction** (4-6 tests)
   - Evict when count exceeds 20
   - Evict when size exceeds 5KB
   - Evict oldest items first
   - Mixed: size + count limits

4. **PII Scrubbing** (5-6 tests)
   - Email scrubbed from navigation URLs
   - Phone numbers scrubbed from selector data
   - Token redaction in network paths
   - Masked identifiers in data

5. **Storage Persistence** (4-5 tests)
   - Breadcrumbs persisted to sessionStorage/AsyncStorage
   - Retrieve persisted breadcrumbs on reinstantiation
   - Clear removes from storage

6. **Retrieval & Clearing** (3-4 tests)
   - getAll() returns correct order
   - getAll() handles empty queue
   - clear() empties queue and storage

7. **Platform Detection** (2-3 tests)
   - Browser path uses sessionStorage
   - Node.js path uses AsyncLocalStorage
   - Mobile path uses AsyncStorage

8. **Edge Cases** (5-6 tests)
   - Very large event data (handle truncation?)
   - Unicode/special characters in selectors
   - Missing timestamp fields
   - Circular references in event data
   - Concurrent add operations

### Integration Test Categories (Planned)

1. **Logger Integration** (if applicable)
   - Each log entry creates breadcrumb (optional integration)

2. **Error Reporting** (if applicable)
   - Error report includes last 20 breadcrumbs
   - Breadcrumbs correctly formatted for API

3. **Offline Sync** (Mobile only)
   - Breadcrumbs cached and synced on reconnect
   - Respects 100-item local cache limit

## Code Location & Structure

```
src/utils/observability/
├── breadcrumb-types.ts       (NEW) - Type definitions
├── breadcrumb-manager.ts     (NEW) - Class implementation
├── index.ts                  (MODIFY) - Add exports
src/__tests__/
├── breadcrumb.test.ts        (NEW) - Unit tests
src/utils/
├── index.ts                  (MODIFY) - Re-export breadcrumbs
```

## Success Criteria (Draft)

- [ ] **Type Safety**: TypeScript strict mode, no `any` types
- [ ] **Functionality**: All 3 core methods work correctly (add, getAll, clear)
- [ ] **FIFO Logic**: Oldest breadcrumbs evicted when limits reached
- [ ] **PII Scrubbing**: All PII patterns automatically removed
- [ ] **Storage**: Breadcrumbs persisted to sessionStorage/AsyncStorage
- [ ] **Platform Support**: Works on Browser, Node.js, React Native
- [ ] **Testing**: Comprehensive unit tests (25-35 tests planned)
- [ ] **Build**: ESM + CJS compilation, .d.ts generation
- [ ] **Integration**: Single test ensuring Logger/error reporting can use breadcrumbs
- [ ] **Documentation**: JSDoc on all exported types/methods

## Questions for PLAN Mode

1. Should BreadcrumbManager be a singleton or static class with module-level state?
2. How should breadcrumb size be calculated? (exact JSON.stringify or approximate?)
3. Should PII scrubbing happen at add() or getAll() time?
4. Should very large event data be truncated or rejected?
5. Should BreadcrumbManager automatically integrate with Logger, or remain separate?
6. What error handling strategy for storage failures (warn or silent fail)?
7. Should breadcrumbs include error type information for timeline visualization?
8. Should breadcrumb timestamps be client-side or server-aligned (correlation ID time)?

## Dependencies & Compatibility

### Internal Dependencies
- SC-804: `src/utils/pii-sanitizers.ts` - For PII scrubbing
- SC-805: `src/utils/observability/correlation-id.ts` - For correlation ID (if integrated)
- SC-807: Potential Logger integration (TBD)

### External Dependencies
- `async_hooks` (Node.js native) - For AsyncLocalStorage
- `react-native` (if mobile support needed) - For AsyncStorage
- No additional npm packages planned (aim for zero-dependency like SC-804)

### Platform APIs
- **Browser**: `sessionStorage`, `JSON.stringify()`
- **Node.js**: `AsyncLocalStorage` (from 'async_hooks'), `JSON.stringify()`
- **React Native**: `AsyncStorage`, `JSON.stringify()`

## Related Specifications

- SPECIFICATION.md § 5.6.7: User Interaction Breadcrumbs
- SPECIFICATION.md § 5.6.8: Mobile Crash Reporting (uses breadcrumbs)
- USER_STORIES.md § Observability Utilities (SC-804–SC-808)

## Comparison with Similar Libraries

### Typical Breadcrumb Managers (Sentry, GlitchTip)
- Store up to 100 items (we have 5KB + 20 item limits)
- Capture full event structure (we scrub PII)
- Auto-attach to errors (we provide manual methods)
- Mobile offline queuing (we support 100 items local)

## Project Context

- **Project Phase**: DEVELOPMENT
- **Latest Completed**: SC-807 (Logger with PII Detection) - 2026-02-10
- **Build System**: Vite (ESM + CJS)
- **Test Framework**: Vitest
- **Code Quality**: TypeScript strict, ESLint, Prettier
- **Test Coverage Target**: 100% for new code
