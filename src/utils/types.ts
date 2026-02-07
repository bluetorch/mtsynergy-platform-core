import type { Platform } from '../constants/types';

/**
 * Validation error code enumeration for error handling and i18n
 * @public
 */
export enum ValidationErrorCode {
  // Caption validation
  CAPTION_TOO_LONG = 'CAPTION_TOO_LONG',
  CAPTION_EMPTY = 'CAPTION_EMPTY',

  // Video validation
  VIDEO_FILE_TOO_LARGE = 'VIDEO_FILE_TOO_LARGE',
  VIDEO_INVALID_EXTENSION = 'VIDEO_INVALID_EXTENSION',
  VIDEO_INVALID_TYPE = 'VIDEO_INVALID_TYPE',

  // Email validation
  EMAIL_INVALID_FORMAT = 'EMAIL_INVALID_FORMAT',
  EMAIL_EMPTY = 'EMAIL_EMPTY',

  // URL validation
  URL_INVALID_FORMAT = 'URL_INVALID_FORMAT',
  URL_EMPTY = 'URL_EMPTY',
}

/**
 * Represents a validation error with platform context
 * @public
 */
export interface ValidationError {
  /** Human-readable error message */
  message: string;

  /** Error code for i18n and programmatic handling */
  code: ValidationErrorCode;

  /** Which platform caused the error (if applicable) */
  platform?: Platform;

  /** Additional context for debugging */
  details?: Record<string, unknown>;
}

/**
 * Locale identifier (IANA timezone or BCP 47 language tag)
 * @public
 */
export type LocaleIdentifier = string;

/**
 * Result of formatting operation (can be used for error handling if needed)
 * @public
 */
export type FormatResult = string;

/**
 * Video metadata for server-side validation
 * @public
 */
export interface VideoMetadata {
  /** Video codec (e.g., 'h264', 'h265') */
  codec: string;
  /** Video width in pixels */
  width: number;
  /** Video height in pixels */
  height: number;
  /** Frames per second */
  fps: number;
  /** Bitrate in Mbps */
  bitrateMbps: number;
}
