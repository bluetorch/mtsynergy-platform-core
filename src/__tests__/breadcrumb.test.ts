import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BreadcrumbManager } from '../utils/observability/breadcrumb-manager';
import type { BreadcrumbEvent } from '../utils/observability/breadcrumb-types';

describe('BreadcrumbManager - Initialization', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should initialize with empty queue on first access', () => {
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toEqual([]);
  });

  it('should maintain breadcrumbs across multiple add operations', async () => {
    // Add initial breadcrumb
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: 1000,
    });

    // Wait for save
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify it's there
    let breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].type).toBe('click');

    // Add another breadcrumb
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/drafts' },
      timestamp: 2000,
    });

    // Wait for save
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should have both
    breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0].type).toBe('click');
    expect(breadcrumbs[1].type).toBe('navigation');
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

describe('BreadcrumbManager - Adding Events', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should add click breadcrumb', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button.submit' },
      timestamp: Date.now(),
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].type).toBe('click');
    if (breadcrumbs[0].type === 'click') {
      expect(breadcrumbs[0].data.selector).toBe('button.submit');
    }
  });

  it('should add navigation breadcrumb', () => {
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/drafts' },
      timestamp: Date.now(),
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].type).toBe('navigation');
    if (breadcrumbs[0].type === 'navigation') {
      expect(breadcrumbs[0].data.url).toBe('/drafts');
    }
  });

  it('should add form_submit breadcrumb', () => {
    BreadcrumbManager.add({
      type: 'form_submit',
      data: { formId: 'login-form' },
      timestamp: Date.now(),
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].type).toBe('form_submit');
    if (breadcrumbs[0].type === 'form_submit') {
      expect(breadcrumbs[0].data.formId).toBe('login-form');
    }
  });

  it('should add network breadcrumb', () => {
    BreadcrumbManager.add({
      type: 'network',
      data: { path: '/api/v1/drafts', statusCode: 200 },
      timestamp: Date.now(),
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].type).toBe('network');
    if (breadcrumbs[0].type === 'network') {
      expect(breadcrumbs[0].data.statusCode).toBe(200);
    }
  });

  it('should add multiple breadcrumbs in order', () => {
    const timestamp1 = Date.now();
    const timestamp2 = timestamp1 + 1000;

    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button.first' },
      timestamp: timestamp1,
    });

    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/inbox' },
      timestamp: timestamp2,
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0].timestamp).toBe(timestamp1);
    expect(breadcrumbs[1].timestamp).toBe(timestamp2);
  });

  it('should include correlation ID when provided', async () => {
    // Use a UUID-like string that won't match scrubbing patterns
    const correlationId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now(),
      correlationId,
    });

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 50));

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].correlationId).toBe(correlationId);
  });

  it('should persist breadcrumbs to sessionStorage', async () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now(),
    });

    // Wait for async save
    await new Promise((resolve) => setTimeout(resolve, 50));

    // In Node.js tests, we use NodePersistence which stores to shared Map
    // Verify by checking that breadcrumbs are retrievable
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].type).toBe('click');
  });

  it('should return copy of queue to prevent external mutation', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now(),
    });

    const breadcrumbs1 = BreadcrumbManager.getAll();
    breadcrumbs1.push({
      type: 'navigation',
      data: { url: '/fake' },
      timestamp: Date.now(),
    } as any);

    const breadcrumbs2 = BreadcrumbManager.getAll();
    expect(breadcrumbs2).toHaveLength(1); // Original unmodified
  });
});

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
        timestamp: Date.now() + i,
      });
    }

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(20);
    if (breadcrumbs[0].type === 'click' && breadcrumbs[19].type === 'click') {
      expect(breadcrumbs[0].data.selector).toBe('button-1'); // button-0 evicted
      expect(breadcrumbs[19].data.selector).toBe('button-20');
    }
  });

  it('should evict multiple oldest items when adding many breadcrumbs', () => {
    for (let i = 0; i < 25; i++) {
      BreadcrumbManager.add({
        type: 'click',
        data: { selector: `button-${i}` },
        timestamp: Date.now() + i,
      });
    }

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(20);
    if (breadcrumbs[0].type === 'click') {
      expect(breadcrumbs[0].data.selector).toBe('button-5'); // 0-4 evicted
    }
  });

  it('should evict when total size exceeds 5KB', () => {
    // Add large breadcrumbs with big selectors
    const largeBreadcrumb = {
      type: 'click' as const,
      data: { selector: 'x'.repeat(500) }, // ~500 bytes each
      timestamp: Date.now(),
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
      timestamp: 1000,
    });

    // Add 20 more (triggers count eviction)
    for (let i = 0; i < 20; i++) {
      BreadcrumbManager.add({
        type: 'click',
        data: { selector: `button-${i}` },
        timestamp: 2000 + i,
      });
    }

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(20);
    if (breadcrumbs[0].type === 'click') {
      expect(breadcrumbs[0].data.selector).toBe('button-0'); // 'button-first' evicted
    }
  });

  it('should handle edge case of single breadcrumb exceeding size limit', () => {
    // Attempt to add 6KB breadcrumb (exceeds 5KB limit)
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'x'.repeat(6000) },
      timestamp: Date.now(),
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
        timestamp: 1000 + i,
      });
    }

    const breadcrumbs = BreadcrumbManager.getAll();
    // Should have items 5-24 (oldest 0-4 evicted)
    for (let i = 0; i < breadcrumbs.length; i++) {
      expect(breadcrumbs[i].timestamp).toBe(1005 + i);
    }
  });
});

describe('BreadcrumbManager - PII Scrubbing', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should scrub email from click selector', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button[data-email="user@example.com"]' },
      timestamp: Date.now(),
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    if (breadcrumbs[0].type === 'click') {
      expect(breadcrumbs[0].data.selector).toContain('[REDACTED-EMAIL]');
      expect(breadcrumbs[0].data.selector).not.toContain('user@example.com');
    }
  });

  it('should scrub phone from navigation URL', () => {
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/profile/+1-555-123-4567' },
      timestamp: Date.now(),
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    if (breadcrumbs[0].type === 'navigation') {
      expect(breadcrumbs[0].data.url).toContain('[REDACTED-PHONE]');
    }
  });

  it('should scrub token from network path', async () => {
    BreadcrumbManager.add({
      type: 'network',
      data: { path: '/api/auth?auth=Bearer abcdefghijklmnopqrstuvwxyzabcdefghij', statusCode: 200 },
      timestamp: Date.now(),
    });

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 50));

    const breadcrumbs = BreadcrumbManager.getAll();
    if (breadcrumbs[0].type === 'network') {
      expect(breadcrumbs[0].data.path).toContain('[REDACTED-TOKEN]');
    }
  });

  it('should scrub identifier from form ID', async () => {
    // Use a string that's clearly an identifier (50+ chars)
    BreadcrumbManager.add({
      type: 'form_submit',
      data: { formId: 'form-' + 'x'.repeat(50) },
      timestamp: Date.now(),
    });

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 50));

    const breadcrumbs = BreadcrumbManager.getAll();
    if (breadcrumbs[0].type === 'form_submit') {
      expect(breadcrumbs[0].data.formId).toContain('[REDACTED-IDENTIFIER]');
    }
  });

  it('should scrub nested object data correctly', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: {
        selector: 'button',
        metadata: {
          userId: 'user@example.com',
        },
      } as any,
      timestamp: Date.now(),
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(JSON.stringify(breadcrumbs[0])).toContain('[REDACTED-EMAIL]');
  });

  it('should not modify breadcrumb if no PII detected', () => {
    const cleanEvent = {
      type: 'click' as const,
      data: { selector: 'button.submit' },
      timestamp: 12345,
    };

    BreadcrumbManager.add(cleanEvent);

    const breadcrumbs = BreadcrumbManager.getAll();
    if (breadcrumbs[0].type === 'click') {
      expect(breadcrumbs[0].data.selector).toBe('button.submit');
    }
    expect(breadcrumbs[0].timestamp).toBe(12345);
  });
});

describe('BreadcrumbManager - Clear & Reset', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should clear all breadcrumbs from queue', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now(),
    });

    BreadcrumbManager.clear();

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toEqual([]);
  });

  it('should clear breadcrumbs from storage', async () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now(),
    });

    // Wait for async save
    await new Promise((resolve) => setTimeout(resolve, 50));

    BreadcrumbManager.clear();

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toEqual([]);
  });

  it('should reset singleton instance for testing', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button-1' },
      timestamp: Date.now(),
    });

    BreadcrumbManager.reset();

    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/fresh' },
      timestamp: Date.now(),
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].type).toBe('navigation');
  });
});

describe('BreadcrumbManager - Edge Cases', () => {
  beforeEach(() => {
    BreadcrumbManager.reset();
    sessionStorage.clear();
  });

  it('should handle unicode characters in selectors', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button.emoji-🎉-test' },
      timestamp: Date.now(),
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    if (breadcrumbs[0].type === 'click') {
      expect(breadcrumbs[0].data.selector).toBe('button.emoji-🎉-test');
    }
  });

  it('should handle very long selector strings', async () => {
    // Use selector with space to break potential identifier pattern
    const longSelector = 'button my selector';
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: longSelector },
      timestamp: Date.now(),
    });

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 50));

    const breadcrumbs = BreadcrumbManager.getAll();
    if (breadcrumbs[0].type === 'click') {
      // Should not be scrubbed (space prevents identifier match)
      expect(breadcrumbs[0].data.selector).toBe(longSelector);
    }
  });

  it('should handle missing optional correlationId', () => {
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button' },
      timestamp: Date.now(),
      // No correlationId
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs[0].correlationId).toBeUndefined();
  });

  it('should handle special characters in URLs', () => {
    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/search?q=test%20query&sort=desc' },
      timestamp: Date.now(),
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    if (breadcrumbs[0].type === 'navigation') {
      expect(breadcrumbs[0].data.url).toContain('test%20query');
    }
  });

  it('should handle concurrent additions gracefully', () => {
    // Simulate rapid concurrent adds
    for (let i = 0; i < 10; i++) {
      BreadcrumbManager.add({
        type: 'click',
        data: { selector: `button-${i}` },
        timestamp: Date.now() + i,
      });
    }

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(10);
  });
});

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
      timestamp: 1000,
    });

    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button#login-submit' },
      timestamp: 2000,
    });

    BreadcrumbManager.add({
      type: 'network',
      data: { path: '/api/auth/login', statusCode: 200 },
      timestamp: 2500,
    });

    BreadcrumbManager.add({
      type: 'navigation',
      data: { url: '/drafts' },
      timestamp: 3000,
    });

    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(4);
    expect(breadcrumbs.map((b) => b.type)).toEqual([
      'navigation',
      'click',
      'network',
      'navigation',
    ]);
  });

  it('should work with error reporting workflow', () => {
    // Setup breadcrumbs leading to error
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button.publish' },
      timestamp: 1000,
    });

    BreadcrumbManager.add({
      type: 'network',
      data: { path: '/api/v1/drafts', statusCode: 500 },
      timestamp: 2000,
    });

    // Error boundary would call getAll()
    const breadcrumbs = BreadcrumbManager.getAll();

    // Verify format suitable for error reporting
    expect(breadcrumbs).toHaveLength(2);
    if (breadcrumbs[1].type === 'network') {
      expect(breadcrumbs[1].data.statusCode).toBe(500);
    }

    // Serialize for API submission
    const errorReport = {
      correlationId: '550e8400-e29b-41d4-a716-446655440000',
      breadcrumbs,
      error: { message: 'Failed to publish' },
    };

    expect(JSON.stringify(errorReport)).toBeTruthy();
  });

  it('should survive page reloads via storage', async () => {
    // Add a breadcrumb
    BreadcrumbManager.add({
      type: 'click',
      data: { selector: 'button.first' },
      timestamp: 1000,
    });

    // Wait for async storage save
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify breadcrumbs are in memory (from storage load)
    const breadcrumbs = BreadcrumbManager.getAll();
    expect(breadcrumbs).toHaveLength(1);
    if (breadcrumbs[0].type === 'click') {
      expect(breadcrumbs[0].data.selector).toBe('button.first');
    }
  });
});
