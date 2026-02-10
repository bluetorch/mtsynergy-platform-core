/**
 * Type definitions for W3C Trace Context and OpenTelemetry integration.
 *
 * This module defines the core types for distributed tracing compliance with
 * the W3C Trace Context specification (https://www.w3.org/TR/trace-context/).
 *
 * @packageDocumentation
 */

import type { CorrelationId } from './correlation-id';

/**
 * W3C Trace Context extracted from traceparent header.
 *
 * Represents a trace context compliant with the W3C Trace Context specification.
 * The trace context uniquely identifies a distributed trace and spans within it.
 *
 * @example
 * ```typescript
 * const context: TraceContext = {
 *   traceId: '6ba7b8109dad11d180b400c04fd430c8',  // 32 hex chars
 *   spanId: 'b7ad6b7169203331',                   // 16 hex chars
 *   traceFlags: 0x01,                             // sampled
 * };
 * ```
 *
 * @see https://www.w3.org/TR/trace-context/#traceparent-header
 */
export interface TraceContext {
  /**
   * The trace identifier in lowercase hex format.
   *
   * Must be exactly 32 hexadecimal characters representing a 128-bit value.
   * The value must not be all zeros (00000000000000000000000000000000).
   *
   * @example "6ba7b8109dad11d180b400c04fd430c8"
   */
  traceId: string;

  /**
   * The span identifier in lowercase hex format.
   *
   * Must be exactly 16 hexadecimal characters representing a 64-bit value.
   * The value must not be all zeros (0000000000000000).
   *
   * @example "b7ad6b7169203331"
   */
  spanId: string;

  /**
   * Trace flags indicating sampling decision.
   *
   * Currently only supports:
   * - 0x00: not sampled
   * - 0x01: sampled (recommended for tracing systems)
   *
   * Other values are reserved for future use per W3C spec.
   */
  traceFlags: number;

  /**
   * Optional vendor-specific trace state metadata.
   *
   * Preserves vendor-specific tracing state information without parsing.
   * Follows the W3C Tracestate format: comma-separated key-value pairs.
   *
   * @see https://www.w3.org/TR/trace-context/#tracestate-header
   */
  tracestate?: string;
}

/**
 * Configuration options for creating a new span in OpenTelemetry.
 *
 * Provides flexible span creation with optional attributes, parent context,
 * and automatic correlation ID injection.
 *
 * @example
 * ```typescript
 * const options: SpanOptions = {
 *   attributes: {
 *     'http.method': 'POST',
 *     'http.url': '/api/users',
 *   },
 *   parent: incomingTraceContext,
 *   correlationId: existingCorrelationId,
 * };
 * ```
 */
export interface SpanOptions {
  /**
   * Key-value pairs to attach to the span for observability.
   *
   * Attributes enable tagging spans with business and technical context.
   * Values must be primitive types: string, number, or boolean.
   *
   * The span will automatically include 'correlation.id' from the correlation ID.
   *
   * @example
   * ```typescript
   * {
   *   'http.method': 'GET',
   *   'http.status': 200,
   *   'error': false,
   * }
   * ```
   */
  attributes?: Record<string, string | number | boolean>;

  /**
   * Optional parent trace context for this span.
   *
   * When provided, creates an explicit parent-child relationship.
   * If not provided, uses the current active span context.
   *
   * Allows explicit control over trace hierarchy for complex scenarios.
   */
  parent?: TraceContext;

  /**
   * Optional correlation ID to attach to the span.
   *
   * If not provided, a new correlation ID is automatically generated.
   * Enables propagating correlation IDs from external systems (e.g., API requests).
   *
   * The correlation ID is automatically added to span attributes as 'correlation.id'.
   */
  correlationId?: CorrelationId;
}
