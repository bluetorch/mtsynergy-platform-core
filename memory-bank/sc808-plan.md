# SC-808 Implementation Plan: Breadcrumb Manager with FIFO Queue

_Date: 2026-02-10_
_Status: PLAN MODE - Awaiting Approval_
_Previous: INNOVATE MODE - Design finalized_

## Executive Summary

Implement a breadcrumb manager utility to capture the last 20 user interactions (clicks, navigation, form submissions, network requests) for error debugging. The manager will use a FIFO queue with 5KB total size limit, automatic PII scrubbing, and platform-specific persistence (sessionStorage/AsyncStorage).

## Design Decisions (Finalized in INNOVATE Mode)

- ✅ **Pattern**: Hybrid singleton with lazy initialization
- ✅ **Storage**: Write-through in-memory queue + sessionStorage/AsyncStorage persistence
- ✅ **Size Calculation**: Exact byte count using `JSON.stringify()` + `Blob`
- ✅ **PII Scrubbing**: At add-time using SC-804's `scrubObject()`, no re-scrubbing
- ✅ **Platform Support**: Browser (sessionStorage) → Node.js (AsyncLocalStorage) → Mobile (AsyncStorage)
- ✅ **Event Types**: 4 types (click, navigation, form_submit, network) - no error type
- ✅ **Limits**: 20 items global, 5KB total size
- ✅ **Correlation ID**: Optional field on each breadcrumb (not required)
- ✅ **Session Persistence**: Breadcrumbs survive page navigation (sessionStorage persists in tab)

## Implementation Specification

### Phase 1: Type Definitions

**File**: `src/utils/observability/breadcrumb-types.ts` (NEW - ~100 LOC)

```typescript
/**
 * User interaction event types for debugging timeline reconstruction.
 */
export type BreadcrumbType = 'click' | 'navigation' | 'form_submit' | 'network';

/**
 * Click interaction breadcrumb.
 */
export interface ClickBreadcrumb {
  /** Event type discriminator */
  type: 'click';
  
  /** Click event data (PII-scrubbed) */
  data: {
    /** CSS selector of clicked element (e.g., "button.submit") */
    selector: string;
  };
  
  /** Client timestamp (milliseconds since epoch) */
  timestamp: number;
  
  /** Optional correlation ID for trace linking */
  correlationId?: string;
}

/**
 * Page navigation breadcrumb.
 */
export interface NavigationBreadcrumb {
  type: 'navigation';
  data: {
    /** URL pathname without query parameters (e.g., "/drafts") */
    url: string;
  };
  timestamp: number;
  correlationId?: string;
}

/**
 * Form submission breadcrumb.
 */
export interface FormSubmitBreadcrumb {
  type: 'form_submit';
  data: {
    /** Form element ID (no input values captured) */
    formId: string;
  };
  timestamp: number;
  correlationId?: string;
}

/**
 * Network request breadcrumb.
 */
export interface NetworkBreadcrumb {
  type: 'network';
  data: {
    /** Endpoint path (e.g., "/api/v1/drafts") */
    path: string;
    
    /** HTTP status code */
    statusCode: number;
  };
  timestamp: number;
  correlationId?: string;
}

/**
 * Discriminated union of all breadcrumb event types.
 */
export type BreadcrumbEvent = 
  | ClickBreadcrumb 
  | NavigationBreadcrumb 
  | FormSubmitBreadcrumb 
  | NetworkBreadcrumb;

/**
 * Configuration for BreadcrumbManager initialization.
 */
export interface BreadcrumbConfig {
  /** Maximum number of breadcrumbs to retain (default: 20) */
  maxItems?: number;
  
  /** Maximum total size in KB (default: 5) */
  maxSizeKb?: number;
  
  /** Storage key for sessionStorage/AsyncStorage (default: 'mtsynergy_breadcrumbs') */
  storageKey?: string;
}

/**
 * Platform-agnostic persistence interface.
 */
export interface IPersistenceProvider {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

### Phase 2: Platform Detection & Persistence Providers

**File**: `src/utils/observability/breadcrumb-manager.ts` (NEW - ~350 LOC)

**Section 1: Platform Detection** (~50 LOC)
```typescript
import { scrubObject } from '../pii-sanitizers';

/**
 * Detect runtime platform and return appropriate persistence provider.
 * Detection order: React Native → Node.js → Browser
 */
function detectPersistenceProvider(): IPersistenceProvider {
  // React Native detection
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    try {
      // Dynamic import to avoid bundling AsyncStorage in browser
      const AsyncStorage = require('react-native').AsyncStorage;
      return new MobilePersistence(AsyncStorage);
    } catch {
      return new InMemoryPersistence(); // Fallback
    }
  }
  
  // Node.js detection
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const { AsyncLocalStorage } = require('async_hooks');
      return new NodePersistence(new AsyncLocalStorage());
    } catch {
      return new InMemoryPersistence(); // Fallback
    }
  }
  
  // Browser detection (sessionStorage)
  if (typeof sessionStorage !== 'undefined') {
    return new BrowserPersistence();
  }
  
  // Fallback for unknown environments
  return new InMemoryPersistence();
}
```

**Section 2: Persistence Implementations** (~100 LOC)
```typescript
/**
 * Browser implementation using sessionStorage (synchronous).
 */
class BrowserPersistence implements IPersistenceProvider {
  async getItem(key: string): Promise<string | null> {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('[BreadcrumbManager] Failed to read from sessionStorage:', error);
      return null;
    }
  }
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('[BreadcrumbManager] Failed to write to sessionStorage:', error);
    }
  }
  
  async removeItem(key: string): Promise<void> {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('[BreadcrumbManager] Failed to remove from sessionStorage:', error);
    }
  }
}

/**
 * Mobile implementation using AsyncStorage.
 */
class MobilePersistence implements IPersistenceProvider {
  constructor(private asyncStorage: any) {}
  
  async getItem(key: string): Promise<string | null> {
    try {
      return await this.asyncStorage.getItem(key);
    } catch (error) {
      console.warn('[BreadcrumbManager] Failed to read from AsyncStorage:', error);
      return null;
    }
  }
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.asyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('[BreadcrumbManager] Failed to write to AsyncStorage:', error);
    }
  }
  
  async removeItem(key: string): Promise<void> {
    try {
      await this.asyncStorage.removeItem(key);
    } catch (error) {
      console.warn('[BreadcrumbManager] Failed to remove from AsyncStorage:', error);
    }
  }
}

/**
 * Node.js implementation using AsyncLocalStorage.
 * Note: AsyncLocalStorage doesn't provide key-value persistence,
 * so we use in-memory storage per async context.
 */
class NodePersistence implements IPersistenceProvider {
  private storage: Map<string, string> = new Map();
  
  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }
  
  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }
  
  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

/**
 * In-memory fallback for unsupported environments.
 */
class InMemoryPersistence implements IPersistenceProvider {
  private storage: Map<string, string> = new Map();
  
  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }
  
  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }
  
  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }
}
```

### Phase 3: BreadcrumbManager Core Implementation

**Section 3: BreadcrumbManager Class** (~200 LOC)

```typescript
/**
 * Singleton breadcrumb manager for capturing user interaction events.
 * 
 * Provides FIFO queue with automatic PII scrubbing and platform-specific
 * persistence (sessionStorage in browser, AsyncStorage in mobile).
 * 
 * @example
 * ```typescript
 * // Add breadcrumbs
 * BreadcrumbManager.add({
 *   type: 'click',
 *   data: { selector: 'button.submit' },
 *   timestamp: Date.now()
 * });
 * 
 * // Retrieve all breadcrumbs
 * const breadcrumbs = BreadcrumbManager.getAll();
 * 
 * // Clear queue
 * BreadcrumbManager.clear();
 * ```
 */
export class BreadcrumbManager {
  private static instance: BreadcrumbManager | null = null;
  private static initialized = false;
  
  private queue: BreadcrumbEvent[] = [];
  private persistence: IPersistenceProvider;
  private config: Required<BreadcrumbConfig>;
  
  private constructor(config: BreadcrumbConfig = {}) {
    this.config = {
      maxItems: config.maxItems ?? 20,
      maxSizeKb: config.maxSizeKb ?? 5,
      storageKey: config.storageKey ?? 'mtsynergy_breadcrumbs'
    };
    
    this.persistence = detectPersistenceProvider();
    this.loadFromStorage();
  }
  
  /**
   * Get or create the singleton instance.
   * Lazy initialization on first access.
   */
  private static getInstance(config?: BreadcrumbConfig): BreadcrumbManager {
    if (!BreadcrumbManager.instance) {
      BreadcrumbManager.instance = new BreadcrumbManager(config);
      BreadcrumbManager.initialized = true;
    }
    return BreadcrumbManager.instance;
  }
  
  /**
   * Load breadcrumbs from persistent storage.
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await this.persistence.getItem(this.config.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
        }
      }
    } catch (error) {
      console.warn('[BreadcrumbManager] Failed to load from storage:', error);
      this.queue = [];
    }
  }
  
  /**
   * Persist breadcrumbs to storage.
   */
  private async saveToStorage(): Promise<void> {
    try {
      const serialized = JSON.stringify(this.queue);
      await this.persistence.setItem(this.config.storageKey, serialized);
    } catch (error) {
      console.warn('[BreadcrumbManager] Failed to save to storage:', error);
    }
  }
  
  /**
   * Calculate total size of queue in bytes.
   */
  private calculateTotalSize(): number {
    const serialized = JSON.stringify(this.queue);
    return new Blob([serialized]).size;
  }
  
  /**
   * Calculate size of single breadcrumb in bytes.
   */
  private calculateEventSize(event: BreadcrumbEvent): number {
    const serialized = JSON.stringify(event);
    return new Blob([serialized]).size;
  }
  
  /**
   * Evict oldest breadcrumbs until constraints are met.
   */
  private evictOldest(eventSize: number): void {
    const maxSizeBytes = this.config.maxSizeKb * 1024;
    
    // Evict by count
    while (this.queue.length >= this.config.maxItems) {
      this.queue.shift();
    }
    
    // Evict by size
    let totalSize = this.calculateTotalSize() + eventSize;
    while (totalSize > maxSizeBytes && this.queue.length > 0) {
      this.queue.shift();
      totalSize = this.calculateTotalSize() + eventSize;
    }
  }
  
  /**
   * Add a breadcrumb event to the queue.
   * 
   * Automatically scrubs PII, evicts oldest items if limits exceeded,
   * and persists to storage.
   * 
   * @param event - Breadcrumb event to add
   * 
   * @example
   * ```typescript
   * BreadcrumbManager.add({
   *   type: 'navigation',
   *   data: { url: '/drafts' },
   *   timestamp: Date.now(),
   *   correlationId: '550e8400-e29b-41d4-a716-446655440000'
   * });
   * ```
   */
  public static add(event: BreadcrumbEvent): void {
    const instance = BreadcrumbManager.getInstance();
    
    // Scrub PII from event data
    const scrubbedEvent = scrubObject(event) as BreadcrumbEvent;
    
    // Calculate size and evict if needed
    const eventSize = instance.calculateEventSize(scrubbedEvent);
    instance.evictOldest(eventSize);
    
    // Add to queue
    instance.queue.push(scrubbedEvent);
    
    // Persist asynchronously (fire-and-forget)
    instance.saveToStorage();
  }
  
  /**
   * Retrieve all breadcrumbs in chronological order (oldest to newest).
   * 
   * @returns Array of breadcrumb events
   * 
   * @example
   * ```typescript
   * const breadcrumbs = BreadcrumbManager.getAll();
   * console.log(`Captured ${breadcrumbs.length} events`);
   * ```
   */
  public static getAll(): BreadcrumbEvent[] {
    const instance = BreadcrumbManager.getInstance();
    return [...instance.queue]; // Return copy to prevent external mutation
  }
  
  /**
   * Clear all breadcrumbs from queue and storage.
   * 
   * Useful for test isolation and explicit session cleanup.
   * 
   * @example
   * ```typescript
   * BreadcrumbManager.clear();
   * ```
   */
  public static clear(): void {
    const instance = BreadcrumbManager.getInstance();
    instance.queue = [];
    instance.persistence.removeItem(instance.config.storageKey);
  }
  
  /**
   * Reset the singleton instance.
   * FOR TESTING ONLY - clears state between test runs.
   * 
   * @internal
   */
  public static reset(): void {
    if (BreadcrumbManager.instance) {
      BreadcrumbManager.instance.queue = [];
      BreadcrumbManager.instance.persistence.removeItem(
        BreadcrumbManager.instance.config.storageKey
      );
    }
    BreadcrumbManager.instance = null;
    BreadcrumbManager.initialized = false;
  }
}
```

### Phase 4: Export Configuration

**File**: `src/utils/observability/index.ts` (MODIFY)

Add exports for breadcrumb types and manager:
```typescript
// Existing exports (correlation-id, trace-context, logger)
export * from './correlation-id';
export * from './trace-types';
export * from './trace-context';
export * from './tracer';
export * from './logger-types';
export { Logger } from './logger';

// NEW: Breadcrumb exports
export * from './breadcrumb-types';
export { BreadcrumbManager } from './breadcrumb-manager';
```

**File**: `src/utils/index.ts` (MODIFY)

Ensure breadcrumb exports are included:
```typescript
// Re-export observability utilities (already includes breadcrumbs via barrel)
export * from './observability';
```

### Phase 5: Comprehensive Unit Tests

**File**: `src/__tests__/breadcrumb.test.ts` (NEW - ~600 LOC, 35+ tests)

**Test Suite 1: Initialization & Storage** (4 tests)
```typescript
describe('BreadcrumbManager - Initialization', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should initialize with empty queue on first access', () => {
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toEqual([]);
  });

  it('should load existing breadcrumbs from sessionStorage', () => {
    // Pre-populate storage
    const existingBreadcrumbs = [
      { type: 'click', data: { selector: 'button' }, timestamp: 1000 }
    ];
    sessionStorage.setItem('mtsynergy_breadcrumbs', JSON.stringify(existingBreadcrumbs));
    
    BreadcrumbManager.reset(); // Force re-initialization
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].type).toBe('click');
  });

  it('should handle corrupted storage data gracefully', () => {
    sessionStorage.setItem('mtsynergy_breadcrumbs', 'invalid json');
    
    BreadcrumbManager.reset();
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toEqual([]);
  });

  it('should handle missing storage gracefully', () => {
    // Test with clean storage
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toEqual([]);
  });
});
```

**Test Suite 2: Adding Breadcrumbs** (8 tests)
```typescript
describe('BreadcrumbManager - Adding Events', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should add click breadcrumb', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button.submit' },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].type).toBe('click');
    expect(breadcrumbs[0].data.selector).toBe('button.submit');
  });

  it('should add navigation breadcrumb', () => {
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/drafts' },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].type).toBe('navigation');
    expect(breadcrumbs[0].data.url).toBe('/drafts');
  });

  it('should add form_submit breadcrumb', () => {
    BreadcrumbManager.add({
      type: 'form_submit',
      data: { formId: 'login-form' },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].type).toBe('form_submit');
    expect(breadcrumbs[0].data.formId).toBe('login-form');
  });

  it('should add network breadcrumb', () => {
    BreadcrumbManager.add({
      type: 'network',
      data: { path: '/api/v1/drafts', statusCode: 200 },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].type).toBe('network');
    expect(breadcrumbs[0].data.statusCode).toBe(200);
  });

  it('should add multiple breadcrumbs in order', () => {
    const timestamp1 = Date.now();
    const timestamp2 = timestamp1 + 1000;
    
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button.first' },
      timestamp: timestamp1
    });
    
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/inbox' },
      timestamp: timestamp2
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0].timestamp).toBe(timestamp1);
    expect(breadcrumbs[1].timestamp).toBe(timestamp2);
  });

  it('should include correlation ID when provided', () => {
    const correlationId = '550e8400-e29b-41d4-a716-446655440000';
    
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now(),
      correlationId
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].correlationId).toBe(correlationId);
  });

  it('should persist breadcrumbs to sessionStorage', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now()
    });
    
    const stored = sessionStorage.getItem('mtsynergy_breadcrumbs');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
  });

  it('should return copy of queue to prevent external mutation', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now()
    });
    
    const breadcrumbs1 = BreadcrumbManager.getAll();
    breadcrumbs1.push({
      type: 'navigation',
      data: { url: '/fake' },
      timestamp: Date.now()
    } as any);
    
    const breadcrumbs2 = BreadcrumbManager.getAll();
    expect(breadcrumbs2).toHaveLength(1); // Original unmodified
  });
});
```

**Test Suite 3: FIFO Eviction** (6 tests)
```typescript
describe('BreadcrumbManager - FIFO Eviction', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should evict oldest breadcrumb when exceeding 20 items', () => {
    // Add 21 breadcrumbs
    for (let i = 0; i < 21; i++) {
      BreadcrumbManager.add({
        type: 'click',
        data: { selector: `button-${i}` },
        timestamp: Date.now() + i
      });
    }
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(20);
    expect(breadcrumbs[0].data.selector).toBe('button-1'); // button-0 evicted
    expect(breadcrumbs[19].data.selector).toBe('button-20');
  });

  it('should evict multiple oldest items when adding many breadcrumbs', () => {
    for (let i = 0; i < 25; i++) {
      BreadcrumbManager.add({
        type: 'click',
        data: { selector: `button-${i}` },
        timestamp: Date.now() + i
      });
    }
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(20);
    expect(breadcrumbs[0].data.selector).toBe('button-5'); // 0-4 evicted
  });

  it('should evict when total size exceeds 5KB', () => {
    // Add large breadcrumbs with big selectors
    const largeBreadcrumb = {
      type: 'click' as const,
      data: { selector: 'x'.repeat(500) }, // ~500 bytes each
      timestamp: Date.now()
    };
    
    // Add enough to exceed 5KB (~10 breadcrumbs)
    for (let i = 0; i < 15; i++) {
      BreadcrumbManager.add({ ...largeBreadcrumb, timestamp: Date.now() + i });
    }
    
    const breadcrumbs = BreadcrumbManager.getAll();
    const totalSize = new Blob([JSON.stringify(breadcrumbs)]).size;
    expect(totalSize).toBeLessThanOrEqual(5 * 1024);
  });

  it('should evict by count before size if both limits apply', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button-first' },
      timestamp: 1000
    });
    
    // Add 20 more (triggers count eviction)
    for (let i = 0; i < 20; i++) {
      BreadcrumbManager.add({
        type: 'click',
        data: { selector: `button-${i}` },
        timestamp: 2000 + i
      });
    }
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(20);
    expect(breadcrumbs[0].data.selector).toBe('button-0'); // 'button-first' evicted
  });

  it('should handle edge case of single breadcrumb exceeding size limit', () => {
    // Attempt to add 6KB breadcrumb (exceeds 5KB limit)
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'x'.repeat(6000) },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    // Should still add (edge case: can't evict to make room)
    expect(breadcrumbs).toHaveLength(1);
  });

  it('should maintain FIFO order after evictions', () => {
    // Add 25 breadcrumbs with sequential timestamps
    for (let i = 0; i < 25; i++) {
      BreadcrumbManager.add({
        type: 'click',
        data: { selector: `button-${i}` },
        timestamp: 1000 + i
      });
    }
    
    const breadcrumbs = BreadcrumbManager.getAll();
    // Should have items 5-24 (oldest 0-4 evicted)
    for (let i = 0; i < breadcrumbs.length; i++) {
      expect(breadcrumbs[i].timestamp).toBe(1005 + i);
    }
  });
});
```

**Test Suite 4: PII Scrubbing** (6 tests)
```typescript
describe('BreadcrumbManager - PII Scrubbing', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should scrub email from click selector', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button[data-email="user@example.com"]' },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].data.selector).toContain('[REDACTED-EMAIL]');
    expect(breadcrumbs[0].data.selector).not.toContain('user@example.com');
  });

  it('should scrub phone from navigation URL', () => {
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/profile/+1-555-123-4567' },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].data.url).toContain('[REDACTED-PHONE]');
  });

  it('should scrub token from network path', () => {
    BreadcrumbManager.add({
      type: 'network',
      data: { path: '/api/auth?token=sk_live_abc123', statusCode: 200 },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].data.path).toContain('[REDACTED-TOKEN]');
  });

  it('should scrub identifier from form ID', () => {
    BreadcrumbManager.add({
      type: 'form_submit',
      data: { formId: 'form-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].data.formId).toContain('[REDACTED-IDENTIFIER]');
  });

  it('should scrub nested object data correctly', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { 
        selector: 'button',
        metadata: {
          userId: 'user@example.com'
        }
      } as any,
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(JSON.stringify(breadcrumbs[0])).toContain('[REDACTED-EMAIL]');
  });

  it('should not modify breadcrumb if no PII detected', () => {
    const cleanEvent = {
      type: 'click' as const,
      data: { selector: 'button.submit' },
      timestamp: 12345
    };
    
    BreadcrumbManager.add(cleanEvent);
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].data.selector).toBe('button.submit');
    expect(breadcrumbs[0].timestamp).toBe(12345);
  });
});
```

**Test Suite 5: Clear & Reset** (3 tests)
```typescript
describe('BreadcrumbManager - Clear & Reset', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should clear all breadcrumbs from queue', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now()
    });
    
    BreadcrumbManager.clear();
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toEqual([]);
  });

  it('should clear breadcrumbs from storage', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now()
    });
    
    BreadcrumbManager.clear();
    
    const stored = sessionStorage.getItem('mtsynergy_breadcrumbs');
    expect(stored).toBeNull();
  });

  it('should reset singleton instance for testing', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button-1' },
      timestamp: Date.now()
    });
    
    BreadcrumbManager.reset();
    
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/fresh' },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].type).toBe('navigation');
  });
});
```

**Test Suite 6: Edge Cases** (5 tests)
```typescript
describe('BreadcrumbManager - Edge Cases', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should handle unicode characters in selectors', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button.emoji-🎉-test' },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].data.selector).toBe('button.emoji-🎉-test');
  });

  it('should handle very long selector strings', () => {
    const longSelector = 'a'.repeat(1000);
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: longSelector },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].data.selector).toHaveLength(1000);
  });

  it('should handle missing optional correlationId', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now()
      // No correlationId
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].correlationId).toBeUndefined();
  });

  it('should handle special characters in URLs', () => {
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/search?q=test%20query&sort=desc' },
      timestamp: Date.now()
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].data.url).toContain('test%20query');
  });

  it('should handle concurrent additions gracefully', () => {
    // Simulate rapid concurrent adds
    for (let i = 0; i < 10; i++) {
      BreadcrumbManager.add({
        type: 'click',
        data: { selector: `button-${i}` },
        timestamp: Date.now() + i
      });
    }
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(10);
  });
});
```

**Test Suite 7: Integration Tests** (3 tests)
```typescript
describe('BreadcrumbManager - Integration', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should capture realistic user journey', () => {
    // Simulate user workflow
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/login' },
      timestamp: 1000
    });
    
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button#login-submit' },
      timestamp: 2000
    });
    
    BreadcrumbManager.add({
      type: 'network',
      data: { path: '/api/auth/login', statusCode: 200 },
      timestamp: 2500
    });
    
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/drafts' },
      timestamp: 3000
    });
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(4);
    expect(breadcrumbs.map(b => b.type)).toEqual([
      'navigation',
      'click',
      'network',
      'navigation'
    ]);
  });

  it('should work with error reporting workflow', () => {
    // Setup breadcrumbs leading to error
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button.publish' },
      timestamp: 1000
    });
    
    BreadcrumbManager.add({
      type: 'network',
      data: { path: '/api/v1/drafts', statusCode: 500 },
      timestamp: 2000
    });
    
    // Error boundary would call getAll()
    const breadcrumbs = BreadcrumbManager.getAll();
    
    // Verify format suitable for error reporting
    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[1].data.statusCode).toBe(500);
    
    // Serialize for API submission
    const errorReport = {
      correlationId: '550e8400-e29b-41d4-a716-446655440000',
      breadcrumbs,
      error: { message: 'Failed to publish' }
    };
    
    expect(JSON.stringify(errorReport)).toBeTruthy();
  });

  it('should survive page reloads via sessionStorage', async () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button.first' },
      timestamp: 1000
    });
    
    // Wait for async storage save
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate page reload by resetting instance
    BreadcrumbManager.reset();
    
    // Pre-populate storage with saved data
    const stored = sessionStorage.getItem('mtsynergy_breadcrumbs');
    expect(stored).not.toBeNull();
    
    // Re-initialize would load from storage
    sessionStorage.setItem('mtsynergy_breadcrumbs', stored!);
    BreadcrumbManager.reset();
    
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].data.selector).toBe('button.first');
  });
});
```

### Phase 6: Build Verification

**Verification Steps:**
1. TypeScript compilation: `npm run type-check`
2. Vite build: `npm run build`
3. Test suite: `npm test breadcrumb`
4. Bundle size check (ensure dist/utils/index.mjs stays under 50KB)

### Phase 7: Documentation Updates

**File**: `README.md` (MODIFY)

Add section § 4.5 "Breadcrumb Manager":
```markdown
### 4.5 Breadcrumb Manager

Capture user interaction events for error debugging without storing sensitive data.

**Features:**
- FIFO queue (20 items max, 5KB total)
- Automatic PII scrubbing
- Platform-specific persistence (sessionStorage/AsyncStorage)
- 4 event types: click, navigation, form_submit, network

**Usage:**
```typescript
import { BreadcrumbManager } from '@mtsynergy/platform-core/utils';

// Add breadcrumbs
BreadcrumbManager.add({
  type: 'click',
  data: { selector: 'button.submit' },
  timestamp: Date.now()
});

BreadcrumbManager.add({
  type: 'navigation',
  data: { url: '/drafts' },
  timestamp: Date.now()
});

BreadcrumbManager.add({
  type: 'network',
  data: { path: '/api/v1/drafts', statusCode: 200 },
  timestamp: Date.now()
});

// Retrieve all breadcrumbs (for error reporting)
const breadcrumbs = BreadcrumbManager.getAll();

// Clear queue
BreadcrumbManager.clear();
```

**Error Reporting Integration:**
```typescript
// In error boundary
try {
  // ... user action
} catch (error) {
  const errorReport = {
    correlationId: getCorrelationId(),
    breadcrumbs: BreadcrumbManager.getAll(),
    error: {
      message: error.message,
      stack: error.stack
    }
  };
  
  // Send to BFF /api/observability/errors
  await fetch('/api/observability/errors', {
    method: 'POST',
    body: JSON.stringify(errorReport)
  });
}
```
```

**File**: `DEVELOPMENT.md` (MODIFY)

Add section with integration examples and best practices.

---

## Implementation Checklist

### Phase 1: Type Definitions (2 items)
1. Create `src/utils/observability/breadcrumb-types.ts` with complete type definitions:
   - BreadcrumbType union type ('click' | 'navigation' | 'form_submit' | 'network')
   - ClickBreadcrumb interface (type, data.selector, timestamp, correlationId?)
   - NavigationBreadcrumb interface (type, data.url, timestamp, correlationId?)
   - FormSubmitBreadcrumb interface (type, data.formId, timestamp, correlationId?)
   - NetworkBreadcrumb interface (type, data.path, data.statusCode, timestamp, correlationId?)
   - BreadcrumbEvent discriminated union type
   - BreadcrumbConfig interface (maxItems?, maxSizeKb?, storageKey?)
   - IPersistenceProvider interface (getItem, setItem, removeItem async methods)

2. Add comprehensive JSDoc to all exported types with @example blocks

### Phase 2: Persistence Providers (5 items)
3. Implement detectPersistenceProvider() function in `src/utils/observability/breadcrumb-manager.ts`:
   - Detect React Native (navigator.product === 'ReactNative')
   - Detect Node.js (process.versions?.node)
   - Detect Browser (typeof sessionStorage)
   - Return InMemoryPersistence fallback

4. Implement BrowserPersistence class:
   - Use sessionStorage.getItem/setItem/removeItem
   - Wrap all operations in try-catch with console.warn on error
   - Return null on getItem failure

5. Implement MobilePersistence class:
   - Accept AsyncStorage in constructor
   - Use AsyncStorage.getItem/setItem/removeItem (async)
   - Wrap all operations in try-catch with console.warn on error

6. Implement NodePersistence class:
   - Use in-memory Map<string, string> storage
   - Implement getItem/setItem/removeItem returning Promises

7. Implement InMemoryPersistence class (fallback):
   - Use in-memory Map<string, string> storage
   - Implement getItem/setItem/removeItem returning Promises

### Phase 3: BreadcrumbManager Core (10 items)
8. Implement BreadcrumbManager class structure:
   - Static instance property (singleton)
   - Static initialized flag
   - Private queue array
   - Private persistence provider
   - Private config object

9. Implement private constructor:
   - Accept optional BreadcrumbConfig
   - Set defaults: maxItems=20, maxSizeKb=5, storageKey='mtsynergy_breadcrumbs'
   - Call detectPersistenceProvider()
   - Call loadFromStorage()

10. Implement static getInstance() method:
    - Check if instance exists, create if null
    - Set initialized flag
    - Return instance

11. Implement private loadFromStorage() method:
    - Call persistence.getItem(storageKey)
    - Parse JSON, validate array
    - Set queue or default to empty array
    - Catch errors, log warning, default to empty

12. Implement private saveToStorage() method:
    - Stringify queue to JSON
    - Call persistence.setItem(storageKey, json)
    - Catch errors, log warning (fire-and-forget)

13. Implement private calculateTotalSize() method:
    - Stringify queue to JSON
    - Create Blob from string
    - Return Blob.size in bytes

14. Implement private calculateEventSize() method:
    - Accept BreadcrumbEvent parameter
    - Stringify event to JSON
    - Return Blob size in bytes

15. Implement private evictOldest() method:
    - Accept eventSize parameter
    - Calculate maxSizeBytes = maxSizeKb * 1024
    - While queue.length >= maxItems: shift()
    - While totalSize + eventSize > maxSizeBytes: shift() and recalculate

16. Implement static add() method:
    - Get instance via getInstance()
    - Scrub event using scrubObject() from SC-804
    - Calculate event size
    - Call evictOldest(eventSize)
    - Push scrubbed event to queue
    - Call saveToStorage() (async, fire-and-forget)

17. Implement static getAll() method:
    - Get instance via getInstance()
    - Return shallow copy of queue ([...queue])

### Phase 4: Testing & Reset (3 items)
18. Implement static clear() method:
    - Get instance via getInstance()
    - Set queue to empty array
    - Call persistence.removeItem(storageKey)

19. Implement static reset() method (for testing):
    - If instance exists: clear queue and remove from storage
    - Set instance to null
    - Set initialized to false

20. Add comprehensive JSDoc to all public methods with @example blocks

### Phase 5: Exports (2 items)
21. Update `src/utils/observability/index.ts`:
    - Add `export * from './breadcrumb-types';`
    - Add `export { BreadcrumbManager } from './breadcrumb-manager';`

22. Verify `src/utils/index.ts` re-exports observability barrel (already includes breadcrumbs)

### Phase 6: Unit Tests - Initialization (4 items)
23. Create `src/__tests__/breadcrumb.test.ts` with test setup:
    - Import BreadcrumbManager and types
    - beforeEach: BreadcrumbManager.reset() and sessionStorage.clear()

24. Write initialization tests (4 tests):
    - Empty queue on first access
    - Load existing breadcrumbs from sessionStorage
    - Handle corrupted storage data gracefully
    - Handle missing storage gracefully

25. Write adding breadcrumbs tests (8 tests):
    - Add click breadcrumb
    - Add navigation breadcrumb
    - Add form_submit breadcrumb
    - Add network breadcrumb
    - Add multiple breadcrumbs in order
    - Include correlation ID when provided
    - Persist breadcrumbs to sessionStorage
    - Return copy of queue to prevent external mutation

26. Write FIFO eviction tests (6 tests):
    - Evict oldest when exceeding 20 items
    - Evict multiple oldest items
    - Evict when total size exceeds 5KB
    - Evict by count before size
    - Handle single breadcrumb exceeding size limit
    - Maintain FIFO order after evictions

### Phase 7: Unit Tests - PII & Edge Cases (6 items)
27. Write PII scrubbing tests (6 tests):
    - Scrub email from click selector
    - Scrub phone from navigation URL
    - Scrub token from network path
    - Scrub identifier from form ID
    - Scrub nested object data correctly
    - Don't modify breadcrumb if no PII detected

28. Write clear & reset tests (3 tests):
    - Clear all breadcrumbs from queue
    - Clear breadcrumbs from storage
    - Reset singleton instance for testing

29. Write edge case tests (5 tests):
    - Handle unicode characters in selectors
    - Handle very long selector strings
    - Handle missing optional correlationId
    - Handle special characters in URLs
    - Handle concurrent additions gracefully

30. Write integration tests (3 tests):
    - Capture realistic user journey (4-step workflow)
    - Work with error reporting workflow
    - Survive page reloads via sessionStorage

31. Run full test suite and verify all 35 tests pass

32. Verify test coverage ≥ 100% for breadcrumb-manager.ts and breadcrumb-types.ts

### Phase 8: Build & Documentation (6 items)
33. Run TypeScript type-check: `npm run type-check` (0 errors expected)

34. Run Vite build: `npm run build` (verify ESM + CJS + .d.ts generated)

35. Verify bundle size:
    - dist/utils/index.mjs stays under 50KB limit
    - dist/utils/index.cjs stays under 50KB limit

36. Update README.md with § 4.5 "Breadcrumb Manager":
    - Features list
    - Basic usage example (add, getAll, clear)
    - Error reporting integration example

37. Update DEVELOPMENT.md:
    - Add breadcrumb manager section under "Using Observability Utilities"
    - Include best practices (when to add breadcrumbs, correlation ID usage)
    - Document error reporting integration pattern

38. Run final verification:
    - Full test suite: `npm test` (all tests passing)
    - Build succeeds with no warnings
    - TypeDoc generates documentation without errors

---

## Success Criteria

- ✅ **Type Safety**: TypeScript strict mode, no `any` types, discriminated union for event types
- ✅ **Functionality**: All 3 core methods work correctly (add, getAll, clear, reset)
- ✅ **FIFO Logic**: Oldest breadcrumbs evicted when 20-item or 5KB limits reached
- ✅ **PII Scrubbing**: All PII patterns automatically removed via SC-804 integration
- ✅ **Storage**: Breadcrumbs persisted to sessionStorage/AsyncStorage after each mutation
- ✅ **Platform Support**: Works on Browser, Node.js, React Native with appropriate persistence
- ✅ **Testing**: 35 comprehensive unit tests covering all scenarios
- ✅ **Build**: ESM + CJS compilation, .d.ts generation, bundle size under 50KB
- ✅ **Documentation**: JSDoc on all exported types/methods, README and DEVELOPMENT.md updated

## Risk Assessment

**Low Risk:**
- Pattern well-established (Logger, SC-804-807 completed successfully)
- Simple FIFO queue logic
- Zero external dependencies
- Comprehensive test coverage planned

**Potential Challenges:**
- Async storage operations in mobile (handled via fire-and-forget)
- Size calculation accuracy (mitigated with exact Blob measurement)
- Test isolation across platforms (handled via reset() method)

## Estimated Effort

- **Phase 1-2** (Types + Persistence): 1-2 hours
- **Phase 3-5** (Core + Exports): 2-3 hours
- **Phase 6-7** (Tests): 3-4 hours
- **Phase 8** (Build + Docs): 1 hour

**Total**: 7-10 hours of focused implementation

---

## Approval Required

This plan provides complete specifications for SC-808 implementation with:
- 38 sequential implementation steps
- Exact file paths and line-of-code estimates
- Complete method signatures and logic
- Comprehensive test coverage (35 tests)
- Documentation updates

**Ready to proceed to EXECUTE mode upon approval.**

Do you approve this implementation plan?
