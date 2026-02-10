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

// Logger types
export type { LogLevel, LogEntry, LoggerConfig, LogContext } from './logger-types';

// Logger singleton
export { Logger } from './logger';

// Breadcrumb types
export type {
  BreadcrumbType,
  ClickBreadcrumb,
  NavigationBreadcrumb,
  FormSubmitBreadcrumb,
  NetworkBreadcrumb,
  BreadcrumbEvent,
  BreadcrumbConfig,
  IPersistenceProvider,
} from './breadcrumb-types';

// Breadcrumb manager
export { BreadcrumbManager } from './breadcrumb-manager';
