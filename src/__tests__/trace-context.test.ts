/**
 * Unit tests for W3C Trace Context parsing and injection.
 *
 * Tests strict compliance with W3C Trace Context specification:
 * https://www.w3.org/TR/trace-context/
 */

import { describe, it, expect } from 'vitest';
import {
  extractTraceContext,
  injectTraceContext,
  generateTraceId,
  generateSpanId,
} from '../utils/observability/trace-context';
import type { TraceContext } from '../utils/observability/trace-types';

describe('W3C Trace Context - extractTraceContext', () => {
  it('should parse valid traceparent with sampled flag (0x01)', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).not.toBeNull();
    expect(context?.traceId).toBe('6ba7b8109dad11d180b400c04fd430c8');
    expect(context?.spanId).toBe('b7ad6b7169203331');
    expect(context?.traceFlags).toBe(0x01);
    expect(context?.tracestate).toBeUndefined();
  });

  it('should parse valid traceparent with not-sampled flag (0x00)', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-00',
    });

    const context = extractTraceContext(headers);

    expect(context).not.toBeNull();
    expect(context?.traceFlags).toBe(0x00);
  });

  it('should parse traceparent with tracestate', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-01',
      tracestate: 'vendorA=value1,vendorB=value2',
    });

    const context = extractTraceContext(headers);

    expect(context).not.toBeNull();
    expect(context?.tracestate).toBe('vendorA=value1,vendorB=value2');
  });

  it('should return null if traceparent is missing', () => {
    const headers = new Headers({
      'other-header': 'value',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for invalid format (wrong number of dashes)', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for invalid version (not 00)', () => {
    const headers = new Headers({
      traceparent: '01-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for version ff (forbidden future version)', () => {
    const headers = new Headers({
      traceparent: 'ff-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for uppercase hex chars in trace-id', () => {
    const headers = new Headers({
      traceparent: '00-6BA7B8109DAD11D180B400C04FD430C8-b7ad6b7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for uppercase hex chars in span-id', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430c8-B7AD6B7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for all-zeros trace-id', () => {
    const headers = new Headers({
      traceparent: '00-00000000000000000000000000000000-b7ad6b7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for all-zeros span-id', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430c8-0000000000000000-01',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for invalid trace-flags (non-hex)', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-gg',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for too short trace-id (31 chars)', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430c-b7ad6b7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for too long trace-id (33 chars)', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430c87-b7ad6b7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for non-hex characters in trace-id', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430cXY-b7ad6b7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should return null for non-hex characters in span-id', () => {
    const headers = new Headers({
      traceparent: '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331XY-01',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });

  it('should handle case-insensitive header lookup (Traceparent)', () => {
    const headers = new Headers({
      Traceparent: '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).not.toBeNull();
    expect(context?.traceId).toBe('6ba7b8109dad11d180b400c04fd430c8');
  });

  it('should handle case-insensitive header lookup (TRACEPARENT)', () => {
    const headers = new Headers({
      TRACEPARENT: '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-01',
    });

    const context = extractTraceContext(headers);

    expect(context).not.toBeNull();
    expect(context?.traceId).toBe('6ba7b8109dad11d180b400c04fd430c8');
  });

  it('should return null for empty traceparent value', () => {
    const headers = new Headers({
      traceparent: '',
    });

    const context = extractTraceContext(headers);

    expect(context).toBeNull();
  });
});

describe('W3C Trace Context - injectTraceContext', () => {
  it('should inject valid context into headers', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c8',
      spanId: 'b7ad6b7169203331',
      traceFlags: 0x01,
    };
    const headers = new Headers();

    injectTraceContext(context, headers);

    expect(headers.get('traceparent')).toBe(
      '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-01'
    );
  });

  it('should inject context with tracestate', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c8',
      spanId: 'b7ad6b7169203331',
      traceFlags: 0x01,
      tracestate: 'vendorA=value1,vendorB=value2',
    };
    const headers = new Headers();

    injectTraceContext(context, headers);

    expect(headers.get('tracestate')).toBe('vendorA=value1,vendorB=value2');
  });

  it('should format sampled flag (0x01) as -01', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c8',
      spanId: 'b7ad6b7169203331',
      traceFlags: 0x01,
    };
    const headers = new Headers();

    injectTraceContext(context, headers);

    expect(headers.get('traceparent')).toMatch(/-01$/);
  });

  it('should format not-sampled flag (0x00) as -00', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c8',
      spanId: 'b7ad6b7169203331',
      traceFlags: 0x00,
    };
    const headers = new Headers();

    injectTraceContext(context, headers);

    expect(headers.get('traceparent')).toMatch(/-00$/);
  });

  it('should throw error for invalid trace-id (all zeros)', () => {
    const context: TraceContext = {
      traceId: '00000000000000000000000000000000',
      spanId: 'b7ad6b7169203331',
      traceFlags: 0x01,
    };
    const headers = new Headers();

    expect(() => injectTraceContext(context, headers)).toThrow(/all zeros/);
  });

  it('should throw error for invalid span-id (all zeros)', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c8',
      spanId: '0000000000000000',
      traceFlags: 0x01,
    };
    const headers = new Headers();

    expect(() => injectTraceContext(context, headers)).toThrow(/all zeros/);
  });

  it('should throw error for invalid trace-id (wrong length, 30 chars)', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c',
      spanId: 'b7ad6b7169203331',
      traceFlags: 0x01,
    };
    const headers = new Headers();

    expect(() => injectTraceContext(context, headers)).toThrow(/Invalid traceId/);
  });

  it('should throw error for invalid span-id (wrong length, 14 chars)', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c8',
      spanId: 'b7ad6b716920333',
      traceFlags: 0x01,
    };
    const headers = new Headers();

    expect(() => injectTraceContext(context, headers)).toThrow(/Invalid spanId/);
  });

  it('should format trace flags with leading zero (0x0a → "0a")', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c8',
      spanId: 'b7ad6b7169203331',
      traceFlags: 0x0a,
    };
    const headers = new Headers();

    injectTraceContext(context, headers);

    expect(headers.get('traceparent')).toMatch(/-0a$/);
  });

  it('should preserve other existing headers', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c8',
      spanId: 'b7ad6b7169203331',
      traceFlags: 0x01,
    };
    const headers = new Headers({
      'x-custom-header': 'custom-value',
    });

    injectTraceContext(context, headers);

    expect(headers.get('x-custom-header')).toBe('custom-value');
  });

  it('should overwrite existing traceparent', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c8',
      spanId: 'b7ad6b7169203331',
      traceFlags: 0x01,
    };
    const headers = new Headers({
      traceparent: '00-oldtraceid0000000000000000000-oldspanid000000-00',
    });

    injectTraceContext(context, headers);

    expect(headers.get('traceparent')).toBe(
      '00-6ba7b8109dad11d180b400c04fd430c8-b7ad6b7169203331-01'
    );
  });

  it('should handle injection into empty Headers object', () => {
    const context: TraceContext = {
      traceId: '6ba7b8109dad11d180b400c04fd430c8',
      spanId: 'b7ad6b7169203331',
      traceFlags: 0x01,
    };
    const headers = new Headers();

    injectTraceContext(context, headers);

    expect(headers.has('traceparent')).toBe(true);
  });
});

describe('W3C Trace Context - Helpers', () => {
  it('generateTraceId should return 32 lowercase hex chars', () => {
    const traceId = generateTraceId();

    expect(traceId).toMatch(/^[0-9a-f]{32}$/);
  });

  it('generateTraceId should never return all zeros', () => {
    const allZeros = '00000000000000000000000000000000';

    for (let i = 0; i < 100; i++) {
      const traceId = generateTraceId();
      expect(traceId).not.toBe(allZeros);
    }
  });

  it('generateTraceId should generate unique values (1000 iterations)', () => {
    const traceIds = new Set<string>();

    for (let i = 0; i < 1000; i++) {
      traceIds.add(generateTraceId());
    }

    expect(traceIds.size).toBe(1000);
  });

  it('generateTraceId should match pattern /^[0-9a-f]{32}$/', () => {
    const traceId = generateTraceId();

    expect(traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(traceId.length).toBe(32);
  });

  it('generateSpanId should return 16 lowercase hex chars', () => {
    const spanId = generateSpanId();

    expect(spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it('generateSpanId should never return all zeros', () => {
    const allZeros = '0000000000000000';

    for (let i = 0; i < 100; i++) {
      const spanId = generateSpanId();
      expect(spanId).not.toBe(allZeros);
    }
  });

  it('generateSpanId should generate unique values (1000 iterations)', () => {
    const spanIds = new Set<string>();

    for (let i = 0; i < 1000; i++) {
      spanIds.add(generateSpanId());
    }

    expect(spanIds.size).toBe(1000);
  });

  it('generateSpanId should match pattern /^[0-9a-f]{16}$/', () => {
    const spanId = generateSpanId();

    expect(spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(spanId.length).toBe(16);
  });
});
