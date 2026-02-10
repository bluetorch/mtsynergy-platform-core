import { scrubObject } from '../pii-sanitizers';
import type { PiiPattern } from '../pii-types';
import type { BreadcrumbEvent, BreadcrumbConfig, IPersistenceProvider } from './breadcrumb-types';

/**
 * Default PII patterns for breadcrumb scrubbing
 * Note: More restrictive patterns to avoid false positives (UUIDs, long alphanumeric strings)
 */
const DEFAULT_PII_PATTERNS: PiiPattern[] = [
  {
    name: 'email',
    pattern: '[\\w+.-]+@[\\w.-]+\\.\\w{2,}',
    replacement: '[REDACTED-EMAIL]',
  },
  {
    name: 'phone',
    pattern:
      '(?:\\+\\d{1,3}[-.\\s])?\\(?\\d{3,4}\\)?[-.\\s]?\\d{3,4}[-.\\s]?\\d{4}(?:\\s?(?:ext|x)\\.?\\s?\\d{2,6})?',
    replacement: '[REDACTED-PHONE]',
  },
  {
    name: 'token',
    pattern: 'Bearer\\s+[a-zA-Z0-9._-]{20,}',
    replacement: 'Bearer [REDACTED-TOKEN]',
  },
  {
    name: 'api_key',
    pattern: '[a-zA-Z0-9._-]{50,}',
    replacement: '[REDACTED-IDENTIFIER]',
  },
];

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
      return new NodePersistence();
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
 * Shared storage for Node.js persistence across instances
 */
const nodeStorageMap = new Map<string, string>();

/**
 * Node.js implementation using shared in-memory storage.
 * Note: Breadcrumbs are lost on process restart (appropriate for server-side logging).
 */
class NodePersistence implements IPersistenceProvider {
  async getItem(key: string): Promise<string | null> {
    return nodeStorageMap.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    nodeStorageMap.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    nodeStorageMap.delete(key);
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
      storageKey: config.storageKey ?? 'mtsynergy_breadcrumbs',
    };

    this.persistence = detectPersistenceProvider();
    // Note: loadFromStorage is async, so data won't be available immediately.
    // This is intentional - callers should handle async loading or use setTimeout.
    this.loadFromStorage().catch((err) => {
      console.warn('[BreadcrumbManager] Failed to load during construction:', err);
    });
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
    const scrubbedEvent = scrubObject(event, DEFAULT_PII_PATTERNS) as BreadcrumbEvent;

    // Calculate size and evict if needed
    const eventSize = instance.calculateEventSize(scrubbedEvent);
    instance.evictOldest(eventSize);

    // Add to queue
    instance.queue.push(scrubbedEvent);

    // Persist asynchronously (fire-and-forget)
    // Use void to suppress the unhandled promise warning
    void instance.saveToStorage();
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
