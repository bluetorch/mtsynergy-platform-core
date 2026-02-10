/**
 * Platform Utilities Module
 *
 * Provides validation and formatting utilities for social media content
 * validation and display formatting with locale awareness.
 *
 * @packageDocumentation
 */

// Type exports
export type { ValidationError, LocaleIdentifier, FormatResult, VideoMetadata } from './types';
export { ValidationErrorCode } from './types';

// Validation exports
export {
  validateCaption,
  validateVideoFile,
  validateVideoMetadata,
  validateEmail,
  validateUrl,
} from './validation';

// Formatting exports
export { formatDate, formatNumber, formatMetric } from './formatting';
// PII Sanitization exports
export type { PiiPattern, ScrubOptions, ValidationResult, PiiPatternName } from './pii-types';
export {
  sanitizeEmail,
  sanitizePhone,
  redactToken,
  maskIdentifier,
  scrubObject,
} from './pii-sanitizers';

// Observability exports
export type { CorrelationId, TraceContext, SpanOptions } from './observability';
export {
  generateCorrelationId,
  isValidCorrelationId,
  extractTraceContext,
  injectTraceContext,
  generateTraceId,
  generateSpanId,
  initializeTracer,
  createSpan,
  getActiveSpan,
  withSpan,
} from './observability';
