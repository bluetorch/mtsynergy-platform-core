import type { Platform } from '../constants/types';
import { PLATFORM_CONFIGS, VIDEO_REQUIREMENTS } from '../constants/index';
import { ValidationErrorCode, type ValidationError, type VideoMetadata } from './types';

/**
 * Validates caption text against platform-specific character limits.
 *
 * @param text - Caption text to validate
 * @param platforms - Array of platforms to validate against
 * @returns Array of validation errors (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateCaption('Hello world', ['twitter', 'tiktok']);
 * if (errors.length === 0) {
 *   console.log('Caption is valid for all platforms');
 * } else {
 *   errors.forEach(err => console.log(err.message, err.platform));
 * }
 * ```
 *
 * @public
 */
export function validateCaption(text: string, platforms: Platform[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for empty caption
  if (!text || text.trim().length === 0) {
    return [
      {
        message: 'Caption cannot be empty',
        code: ValidationErrorCode.CAPTION_EMPTY,
      },
    ];
  }

  // Validate against each platform's limits
  for (const platform of platforms) {
    const config = PLATFORM_CONFIGS[platform];
    const maxLength = config.text.maxCaptionLength;

    if (text.length > maxLength) {
      errors.push({
        message: `Caption exceeds ${maxLength} character limit for ${platform}`,
        code: ValidationErrorCode.CAPTION_TOO_LONG,
        platform,
        details: {
          length: text.length,
          maxLength,
          platform,
        },
      });
    }
  }

  return errors;
}

/**
 * Validates video file meets basic requirements (size and extension).
 *
 * Note: Browser environment cannot inspect video metadata (codec, resolution, fps)
 * without additional tools. For complete validation, use server-side processing
 * with ffmpeg or similar tools. Use {@link validateVideoMetadata} for server-side
 * metadata validation.
 *
 * @param file - File object to validate
 * @returns Array of validation errors (empty if valid)
 *
 * @example
 * ```typescript
 * const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
 * if (fileInput.files && fileInput.files[0]) {
 *   const errors = validateVideoFile(fileInput.files[0]);
 *   if (errors.length > 0) {
 *     console.log('File validation failed:', errors);
 *   }
 * }
 * ```
 *
 * @see validateVideoMetadata for server-side metadata validation
 *
 * @public
 */
export function validateVideoFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check file size
  const maxFileSizeBytes = VIDEO_REQUIREMENTS.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxFileSizeBytes) {
    errors.push({
      message: `File size exceeds ${VIDEO_REQUIREMENTS.maxFileSizeMB}MB limit`,
      code: ValidationErrorCode.VIDEO_FILE_TOO_LARGE,
      details: {
        fileSize: file.size,
        maxSize: maxFileSizeBytes,
        fileName: file.name,
      },
    });
  }

  // Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  const supportedExtensions = VIDEO_REQUIREMENTS.supportedExtensions;
  if (ext && !supportedExtensions.includes(ext)) {
    errors.push({
      message: `File extension .${ext} not supported. Supported: ${supportedExtensions.join(', ')}`,
      code: ValidationErrorCode.VIDEO_INVALID_EXTENSION,
      details: {
        extension: ext,
        supported: supportedExtensions,
        fileName: file.name,
      },
    });
  }

  // Check MIME type (basic check)
  if (!file.type.startsWith('video/')) {
    errors.push({
      message: `File type must be video, received: ${file.type || 'unknown'}`,
      code: ValidationErrorCode.VIDEO_INVALID_TYPE,
      details: {
        mimeType: file.type,
        fileName: file.name,
      },
    });
  }

  return errors;
}

/**
 * Server-side helper for validating video metadata extracted from file.
 *
 * Use this function on the server after extracting metadata with ffmpeg
 * or similar tools. Validates codec, resolution, fps, and bitrate against
 * platform requirements.
 *
 * @param metadata - Extracted video metadata
 * @returns Array of validation errors (empty if valid)
 *
 * @example
 * ```typescript
 * // On server after ffmpeg processing:
 * const metadata = {
 *   codec: 'h264',
 *   width: 1920,
 *   height: 1080,
 *   fps: 30,
 *   bitrateMbps: 5,
 * };
 * const errors = validateVideoMetadata(metadata);
 * ```
 *
 * @public
 */
export function validateVideoMetadata(metadata: VideoMetadata): ValidationError[] {
  const errors: ValidationError[] = [];
  const reqs = VIDEO_REQUIREMENTS;

  // Check codec
  if (!reqs.supportedCodecs.includes(metadata.codec as never)) {
    errors.push({
      message: `Codec ${metadata.codec} not supported. Supported: ${reqs.supportedCodecs.join(', ')}`,
      code: ValidationErrorCode.VIDEO_INVALID_TYPE,
      details: {
        codec: metadata.codec,
        supported: reqs.supportedCodecs,
      },
    });
  }

  // Check resolution
  if (metadata.width < reqs.minResolution.width || metadata.height < reqs.minResolution.height) {
    errors.push({
      message: `Resolution ${metadata.width}x${metadata.height} below minimum ${reqs.minResolution.width}x${reqs.minResolution.height}`,
      code: ValidationErrorCode.VIDEO_INVALID_TYPE,
      details: {
        resolution: `${metadata.width}x${metadata.height}`,
        minResolution: reqs.minResolution,
      },
    });
  }

  if (metadata.width > reqs.maxResolution.width || metadata.height > reqs.maxResolution.height) {
    errors.push({
      message: `Resolution ${metadata.width}x${metadata.height} exceeds maximum ${reqs.maxResolution.width}x${reqs.maxResolution.height}`,
      code: ValidationErrorCode.VIDEO_INVALID_TYPE,
      details: {
        resolution: `${metadata.width}x${metadata.height}`,
        maxResolution: reqs.maxResolution,
      },
    });
  }

  // Check FPS
  if (metadata.fps > reqs.maxFrameRate) {
    errors.push({
      message: `Frame rate ${metadata.fps} exceeds maximum ${reqs.maxFrameRate}`,
      code: ValidationErrorCode.VIDEO_INVALID_TYPE,
      details: {
        fps: metadata.fps,
        maxFps: reqs.maxFrameRate,
      },
    });
  }

  // Check bitrate
  if (metadata.bitrateMbps > reqs.maxBitrateMbps) {
    errors.push({
      message: `Bitrate ${metadata.bitrateMbps}Mbps exceeds maximum ${reqs.maxBitrateMbps}Mbps`,
      code: ValidationErrorCode.VIDEO_INVALID_TYPE,
      details: {
        bitrate: metadata.bitrateMbps,
        maxBitrate: reqs.maxBitrateMbps,
      },
    });
  }

  return errors;
}

/**
 * Validates email address format using RFC-compliant regex pattern.
 *
 * This is basic validation suitable for UI forms. Server-side validation
 * should perform more rigorous checks (deliverability, SMTP verification, etc.).
 *
 * @param email - Email address to validate
 * @returns True if email matches valid format, false otherwise
 *
 * @example
 * ```typescript
 * if (validateEmail('user@example.com')) {
 *   console.log('Valid email');
 * } else {
 *   console.log('Invalid email format');
 * }
 * ```
 *
 * @public
 */
export function validateEmail(email: string): boolean {
  // RFC 5322 simplified pattern (practical, not strict compliance)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format using native URL constructor.
 *
 * Supports http, https, and other protocols. Works in both browser
 * and Node.js environments.
 *
 * @param url - URL string to validate
 * @returns True if URL is valid, false otherwise
 *
 * @example
 * ```typescript
 * if (validateUrl('https://example.com')) {
 *   console.log('Valid URL');
 * } else {
 *   console.log('Invalid URL format');
 * }
 * ```
 *
 * @public
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
