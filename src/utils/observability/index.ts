/**
 * Observability Utilities
 *
 * Utilities for distributed tracing, logging, and request correlation.
 *
 * @packageDocumentation
 */

// Correlation ID utilities
export type { CorrelationId } from './correlation-id';
export { generateCorrelationId, isValidCorrelationId } from './correlation-id';

// Type definitions for distributed tracing
export type { TraceContext, SpanOptions } from './trace-types';

// W3C Trace Context parsing and generation
export {
  extractTraceContext,
  injectTraceContext,
  generateTraceId,
  generateSpanId,
} from './trace-context';

// OpenTelemetry tracer integration
export { initializeTracer, createSpan, getActiveSpan, withSpan } from './tracer';
