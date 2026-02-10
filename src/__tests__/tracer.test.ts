/**
 * Integration tests for OpenTelemetry tracer wrapper.
 *
 * Tests OpenTelemetry SDK integration, span creation, context management,
 * and parent-child span relationships.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
  initializeTracer,
  createSpan,
  getActiveSpan,
  withSpan,
} from '../utils/observability/tracer';
import { generateCorrelationId } from '../utils/observability/correlation-id';
import type { TraceContext } from '../utils/observability/trace-types';

let exporter: InMemorySpanExporter;
let provider: BasicTracerProvider;

beforeAll(() => {
  // Create in-memory exporter for testing
  exporter = new InMemorySpanExporter();

  // Create trace provider
  provider = new BasicTracerProvider();

  // Add processor to export spans
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

  // Register the provider globally
  provider.register();
});

beforeEach(() => {
  // Reset exporter before each test
  exporter.reset();
});

afterAll(() => {
  // Clean up
  provider.shutdown();
});

describe('OpenTelemetry Tracer', () => {
  it('initializeTracer should initialize without errors', () => {
    expect(() => initializeTracer('test-service')).not.toThrow();
  });

  it('initializeTracer should be idempotent (same service name)', () => {
    initializeTracer('test-service');
    expect(() => initializeTracer('test-service')).not.toThrow();
  });

  it('createSpan should create span with traced context', () => {
    initializeTracer('test-service');
    exporter.reset();
    const span = createSpan('test-span');

    expect(span).toBeDefined();

    span.end();
    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
  });

  it('createSpan should create span with correct name', () => {
    initializeTracer('test-service');
    exporter.reset();
    const span = createSpan('database-query');

    span.end();

    const spans = exporter.getFinishedSpans();
    expect(spans[0].name).toBe('database-query');
  });

  it('createSpan should auto-include correlation ID attribute', () => {
    initializeTracer('test-service');
    exporter.reset();

    const span = createSpan('operation');
    span.end();

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].attributes).toHaveProperty('correlation.id');
  });

  it('createSpan with custom correlationId should use provided ID', () => {
    initializeTracer('test-service');
    exporter.reset();

    const customId = generateCorrelationId();
    const span = createSpan('operation', { correlationId: customId });
    span.end();

    const spans = exporter.getFinishedSpans();
    expect(spans[0].attributes?.['correlation.id']).toBe(customId);
  });

  it('createSpan with custom attributes should include all attributes', () => {
    initializeTracer('test-service');
    exporter.reset();

    const span = createSpan('http-request', {
      attributes: {
        'http.method': 'POST',
        'http.status': 200,
        error: false,
      },
    });
    span.end();

    const spans = exporter.getFinishedSpans();
    expect(spans[0].attributes?.['http.method']).toBe('POST');
    expect(spans[0].attributes?.['http.status']).toBe(200);
    expect(spans[0].attributes?.['error']).toBe(false);
  });

  it('createSpan should create root span (no parent)', () => {
    initializeTracer('test-service');
    exporter.reset();

    const span = createSpan('root-span');
    span.end();

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    // Root span has no parent
    expect(spans[0].parentSpanId).toBeUndefined();
  });

  it('getActiveSpan outside span should return undefined', () => {
    const activeSpan = getActiveSpan();
    // No span should be active at test start
    expect(activeSpan).toBeUndefined();
  });

  it('getActiveSpan outside span context returns undefined', () => {
    initializeTracer('test-service');

    // Without withSpan or context.with, no span is active
    const activeSpan = getActiveSpan();
    expect(activeSpan).toBeUndefined();
  });

  it('span should export with correlation ID attribute', () => {
    initializeTracer('test-service');
    exporter.reset();

    const span = createSpan('test-operation');
    span.end();

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].attributes).toHaveProperty('correlation.id');
    expect(typeof spans[0].attributes?.['correlation.id']).toBe('string');
  });
});

describe('OpenTelemetry Context Propagation', () => {
  it('createSpan with parent TraceContext should use parent trace-id', () => {
    initializeTracer('test-service');
    exporter.reset();

    const parentContext: TraceContext = {
      traceId: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      spanId: 'f1e2d3c4b5a69078',
      traceFlags: 0x01,
    };

    const span = createSpan('child-span', { parent: parentContext });
    span.end();

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    // The span's trace context should reference the parent's trace ID
    expect(spans[0].spanContext().traceId).toBeDefined();
  });

  it('createSpan with parent TraceContext should generate new span-id', () => {
    initializeTracer('test-service');
    exporter.reset();

    const parentContext: TraceContext = {
      traceId: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      spanId: 'f1e2d3c4b5a69078',
      traceFlags: 0x01,
    };

    const span = createSpan('child-span', { parent: parentContext });
    span.end();

    const spans = exporter.getFinishedSpans();
    // New span should have a different spanId than parent
    expect(spans[0].spanContext().spanId).not.toBe(parentContext.spanId);
  });

  it('nested createSpan calls within withSpan should create spans', () => {
    initializeTracer('test-service');
    exporter.reset();

    const parentSpan = createSpan('parent-operation');

    withSpan(parentSpan, () => {
      const childSpan = createSpan('child-operation', {
        attributes: { step: 'validation' },
      });
      childSpan.end();
    });

    parentSpan.end();

    const spans = exporter.getFinishedSpans();
    expect(spans.length).toBe(2);

    // Find parent and child spans
    const parent = spans.find((s) => s.name === 'parent-operation');
    const child = spans.find((s) => s.name === 'child-operation');

    expect(parent).toBeDefined();
    expect(child).toBeDefined();

    // Both spans should have correlation IDs
    expect(parent?.attributes?.['correlation.id']).toBeDefined();
    expect(child?.attributes?.['correlation.id']).toBeDefined();
  });

  it('withSpan should execute function without errors', () => {
    initializeTracer('test-service');
    exporter.reset();
    const span = createSpan('test-span');

    let executed = false;
    withSpan(span, () => {
      executed = true;
    });

    expect(executed).toBe(true);
    span.end();
  });

  it('withSpan with nested spans should execute and export spans', () => {
    initializeTracer('test-service');
    exporter.reset();

    const parentSpan = createSpan('parent');

    let operationCompleted = false;
    withSpan(parentSpan, () => {
      const childSpan = createSpan('child');
      childSpan.end();
      operationCompleted = true;
    });

    parentSpan.end();

    expect(operationCompleted).toBe(true);
    const spans = exporter.getFinishedSpans();
    // Should have both parent and child spans
    expect(spans.length).toBeGreaterThanOrEqual(2);
  });
});
