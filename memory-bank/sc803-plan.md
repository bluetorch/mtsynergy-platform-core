# SC-803 Implementation Plan: Validation & Formatting Utilities

_Created: 2026-02-06_
_Mode: PLAN_
_Status: Awaiting Approval_

## Overview

Detailed step-by-step implementation plan for SC-803 (Validation & Formatting Utilities).

**Approach:** Build validation functions first (simpler), then formatting functions (require Intl APIs)  
**Dependency Strategy:** Use SC-802 constants (PLATFORM_CONFIGS, VIDEO_REQUIREMENTS)  
**Testing Strategy:** Standard + edge cases, target 95%+ coverage  
**Timeline:** Estimate 2-3 work days

---

## Final Decisions Locked In

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ISO8601DateTime | Export from constants/types | Reuse existing definition |
| ValidationError.code | Required string enum | Enable i18n in future stories |
| Metric parameter | Type safety only | Simplicity, can extend later |
| File type | Browser File only | React Native handles separately |
| Locale default | No default (caller provides) | Forces explicit decision |
| Test coverage | Standard + edge cases | Comprehensive validation |

---

## Phase 1: Type Definitions

### 1.1 Create src/utils/types.ts

**File:** `src/utils/types.ts`

**Content:**
```typescript
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
```

**Rationale:**
- Enum for error codes enables type-safe error handling and future i18n
- ValidationError includes platform context for multi-platform validation
- Detailed interface for structured error information
- LocaleIdentifier type documents expected parameter format
- All exports marked @public for documentation

---

## Phase 2: Validation Functions

### 2.1 Create src/utils/validation.ts

**File:** `src/utils/validation.ts`

**Content:**
```typescript
import type { Platform } from '../constants/types';
import { PLATFORM_CONFIGS, VIDEO_REQUIREMENTS } from '../constants/index';
import { ValidationErrorCode, type ValidationError } from './types';

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
export function validateCaption(
  text: string,
  platforms: Platform[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for empty caption
  if (!text || text.trim().length === 0) {
    return [{
      message: 'Caption cannot be empty',
      code: ValidationErrorCode.CAPTION_EMPTY,
    }];
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

export function validateVideoMetadata(metadata: VideoMetadata): ValidationError[] {
  const errors: ValidationError[] = [];
  const reqs = VIDEO_REQUIREMENTS;

  // Check codec
  if (!reqs.supportedCodecs.includes(metadata.codec as any)) {
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
  if (
    metadata.width < reqs.minResolution.width ||
    metadata.height < reqs.minResolution.height
  ) {
    errors.push({
      message: `Resolution ${metadata.width}x${metadata.height} below minimum ${reqs.minResolution.width}x${reqs.minResolution.height}`,
      code: ValidationErrorCode.VIDEO_INVALID_TYPE,
      details: {
        resolution: `${metadata.width}x${metadata.height}`,
        minResolution: reqs.minResolution,
      },
    });
  }

  if (
    metadata.width > reqs.maxResolution.width ||
    metadata.height > reqs.maxResolution.height
  ) {
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
```

**Rationale:**
- Caption validation uses PLATFORM_CONFIGS from SC-802
- Video validation split into basic (client) and metadata (server)
- Error codes use enum for type safety and i18n support
- Detailed error objects with platform context
- Comprehensive JSDoc with examples
- Email/URL validation use proven patterns (regex, URL constructor)

---

## Phase 3: Formatting Functions

### 3.1 Create src/utils/formatting.ts

**File:** `src/utils/formatting.ts`

**Content:**
```typescript
import type { LocaleIdentifier, FormatResult } from './types';

/**
 * Formats ISO8601 datetime string for display in specified locale.
 *
 * Uses native Intl.DateTimeFormat for locale-aware formatting.
 * Returns fallback string if date cannot be parsed.
 *
 * @param date - ISO8601 datetime string (e.g., '2026-02-06T15:30:00Z')
 * @param locale - IANA locale identifier (e.g., 'en-US', 'es-ES', 'ja-JP')
 * @returns Formatted date string in user's locale
 *
 * @example
 * ```typescript
 * formatDate('2026-02-06T15:30:00Z', 'en-US');  // "2/6/2026"
 * formatDate('2026-02-06T15:30:00Z', 'es-ES');  // "6/2/2026"
 * formatDate('2026-02-06T15:30:00Z', 'ja-JP');  // "2026年2月6日"
 * ```
 *
 * @public
 */
export function formatDate(
  date: string,
  locale: LocaleIdentifier
): FormatResult {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return new Intl.DateTimeFormat(locale).format(dateObj);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Formats number with locale-aware formatting (decimal or percentage).
 *
 * Uses native Intl.NumberFormat for locale-specific grouping and
 * decimal separators.
 *
 * @param num - Number to format
 * @param locale - IANA locale identifier (e.g., 'en-US', 'de-DE')
 * @param style - Format style: 'decimal' (1,234.56) or 'percent' (12.34%)
 * @returns Formatted number string
 *
 * @example
 * ```typescript
 * formatNumber(1234.567, 'en-US', 'decimal');  // "1,234.567"
 * formatNumber(1234.567, 'de-DE', 'decimal');  // "1.234,567"
 * formatNumber(0.1234, 'en-US', 'percent');    // "12.34%"
 * formatNumber(0.1234, 'fr-FR', 'percent');    // "12,34 %"
 * ```
 *
 * @public
 */
export function formatNumber(
  num: number,
  locale: LocaleIdentifier,
  style: 'decimal' | 'percent' = 'decimal'
): FormatResult {
  try {
    return new Intl.NumberFormat(locale, { style }).format(num);
  } catch {
    return num.toString();
  }
}

/**
 * Formats numeric metric with K/M suffixes for compact display.
 *
 * - Values >= 1,000,000 formatted as "X.XM" (e.g., "2.5M")
 * - Values >= 1,000 formatted as "X.XK" (e.g., "150K")
 * - Values < 1,000 shown as plain number
 *
 * @param value - Numeric metric value (reach, engagement, impressions, etc.)
 * @param metric - Metric type (for type safety and future extensions)
 * @returns Formatted metric string with K/M suffix
 *
 * @example
 * ```typescript
 * formatMetric(150000, 'reach');        // "150K"
 * formatMetric(2500000, 'impressions'); // "2.5M"
 * formatMetric(456, 'engagement');      // "456"
 * formatMetric(0, 'reach');             // "0"
 * ```
 *
 * @public
 */
export function formatMetric(
  value: number,
  metric: 'reach' | 'engagement' | 'impressions'
): FormatResult {
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toString();
}
```

**Rationale:**
- formatDate uses Intl.DateTimeFormat with fallback for invalid dates
- formatNumber uses Intl.NumberFormat with style parameter
- formatMetric implements K/M suffix logic with proper rounding
- Graceful fallback behavior (returns fallback string instead of throwing)
- Comprehensive JSDoc with locale examples
- All three functions are type-safe and zero-dependency

---

## Phase 4: Barrel Export

### 4.1 Update src/utils/index.ts

**File:** `src/utils/index.ts`

**Current Content:**
```typescript
/**
 * Platform Utilities Module
 * TODO: Implement in SC-803
 * Validation utilities:
 * - validateCaption()
 * - validateVideoFile()
 * - validateEmail()
 * - validateUrl()
 *
 * Formatting utilities:
 * - formatDate()
 * - formatNumber()
 * - formatMetric()
 */

export {};
```

**New Content:**
```typescript
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
export {
  formatDate,
  formatNumber,
  formatMetric,
} from './formatting';
```

**Rationale:**
- Barrel export enables tree-shaking at consumer level
- Separate type and function exports
- ValidationErrorCode enum exported for type safety
- Comprehensive module documentation

---

## Phase 5: Testing Strategy

### 5.1 Create src/__tests__/validation.test.ts

**File:** `src/__tests__/validation.test.ts`

**Test Coverage (20+ tests):**

**validateCaption tests:**
- ✅ Valid caption within all platform limits
- ✅ Valid caption exactly at limit for one platform
- ✅ Invalid caption exceeding one platform limit
- ✅ Invalid caption exceeding multiple platform limits
- ✅ Empty string (edge case)
- ✅ Whitespace only (edge case)
- ✅ Unicode characters (edge case)
- ✅ Multiple platforms validation

**validateVideoFile tests:**
- ✅ Valid file (size, extension, MIME type)
- ✅ File exceeds size limit
- ✅ Invalid file extension
- ✅ Wrong MIME type
- ✅ Missing file extension (edge case)
- ✅ Edge case: exactly at size limit

**validateVideoMetadata tests:**
- ✅ Valid metadata (all within limits)
- ✅ Unsupported codec
- ✅ Resolution below minimum
- ✅ Resolution above maximum
- ✅ Frame rate exceeds limit
- ✅ Bitrate exceeds limit

**validateEmail tests:**
- ✅ Valid email
- ✅ Invalid: no @ symbol
- ✅ Invalid: no domain
- ✅ Invalid: no TLD
- ✅ Invalid: spaces in address
- ✅ Edge case: multiple @ symbols

**validateUrl tests:**
- ✅ Valid http URL
- ✅ Valid https URL
- ✅ Valid URL with path and params
- ✅ Invalid: malformed URL
- ✅ Invalid: missing protocol
- ✅ Edge case: localhost

**Implementation Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import {
  validateCaption,
  validateVideoFile,
  validateVideoMetadata,
  validateEmail,
  validateUrl,
} from '../validation';
import { ValidationErrorCode } from '../types';
import { PLATFORM_CONFIGS } from '../../constants';

describe('Validation Utilities', () => {
  describe('validateCaption', () => {
    it('should accept caption within platform limits', () => {
      const result = validateCaption('Hello world', ['twitter']);
      expect(result).toHaveLength(0);
    });

    it('should reject caption exceeding platform limit', () => {
      const longCaption = 'a'.repeat(300);
      const result = validateCaption(longCaption, ['twitter']);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe(ValidationErrorCode.CAPTION_TOO_LONG);
      expect(result[0].platform).toBe('twitter');
    });

    // ... more tests
  });

  // ... other describe blocks for each validator
});
```

### 5.2 Create src/__tests__/formatting.test.ts

**File:** `src/__tests__/formatting.test.ts`

**Test Coverage (15+ tests):**

**formatDate tests:**
- ✅ Valid ISO8601 date (en-US locale)
- ✅ Valid ISO8601 date (es-ES locale)
- ✅ Valid ISO8601 date (ja-JP locale)
- ✅ Invalid date string returns fallback
- ✅ Null date handling (edge case)

**formatNumber tests:**
- ✅ Decimal format (en-US)
- ✅ Decimal format (de-DE with comma separator)
- ✅ Percent format (en-US)
- ✅ Percent format (fr-FR)
- ✅ Negative numbers
- ✅ Zero value

**formatMetric tests:**
- ✅ Value >= 1M formatted as "X.XM"
- ✅ Value >= 1K formatted as "X.XK"
- ✅ Value < 1K shown as plain number
- ✅ Zero value
- ✅ Edge case: exactly 1000 (formatted as "1.0K")
- ✅ Edge case: exactly 1000000 (formatted as "1.0M")

**Implementation Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatNumber,
  formatMetric,
} from '../formatting';

describe('Formatting Utilities', () => {
  describe('formatDate', () => {
    it('should format ISO8601 date in en-US locale', () => {
      const result = formatDate('2026-02-06T15:30:00Z', 'en-US');
      expect(result).toBe('2/6/2026');
    });

    it('should format ISO8601 date in es-ES locale', () => {
      const result = formatDate('2026-02-06T15:30:00Z', 'es-ES');
      expect(result).toBe('6/2/2026');
    });

    it('should return fallback for invalid date', () => {
      const result = formatDate('invalid-date', 'en-US');
      expect(result).toBe('Invalid Date');
    });

    // ... more tests
  });

  // ... other describe blocks for formatNumber and formatMetric
});
```

### 5.3 Create src/__tests__/utils-exports.test.ts

**File:** `src/__tests__/utils-exports.test.ts`

**Test Coverage (8+ tests):**
- ✅ All validation functions exported from barrel
- ✅ All formatting functions exported from barrel
- ✅ ValidationErrorCode enum exported
- ✅ Type definitions exported (ValidationError, LocaleIdentifier, etc.)
- ✅ Module imports work correctly
- ✅ ESM and CJS export paths both work

**Implementation Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import * as utils from '../index';
import { ValidationErrorCode } from '../types';

describe('Utils Module Exports', () => {
  it('should export all validation functions', () => {
    expect(typeof utils.validateCaption).toBe('function');
    expect(typeof utils.validateVideoFile).toBe('function');
    expect(typeof utils.validateVideoMetadata).toBe('function');
    expect(typeof utils.validateEmail).toBe('function');
    expect(typeof utils.validateUrl).toBe('function');
  });

  it('should export all formatting functions', () => {
    expect(typeof utils.formatDate).toBe('function');
    expect(typeof utils.formatNumber).toBe('function');
    expect(typeof utils.formatMetric).toBe('function');
  });

  it('should export ValidationErrorCode enum', () => {
    expect(ValidationErrorCode.CAPTION_TOO_LONG).toBe('CAPTION_TOO_LONG');
    expect(ValidationErrorCode.EMAIL_INVALID_FORMAT).toBe('EMAIL_INVALID_FORMAT');
  });

  // ... more export verification tests
});
```

---

## Phase 6: Documentation Updates

### 6.1 Update README.md

Add section after existing platform constants section:

```markdown
### 3. **Validation & Formatting Utilities (SC-803)**

Provides validation functions for user input and formatting functions for display.

#### Validation Functions

```typescript
import {
  validateCaption,
  validateVideoFile,
  validateVideoMetadata,
  validateEmail,
  validateUrl,
} from '@mtsynergy/platform-core/utils';

// Validate caption against platform limits
const captionErrors = validateCaption('Hello world', ['twitter', 'tiktok']);
if (captionErrors.length > 0) {
  console.log('Caption too long for:', captionErrors.map(e => e.platform));
}

// Validate file from input element
const fileInput = document.querySelector('input[type="file"]');
const fileErrors = validateVideoFile(fileInput.files[0]);

// Validate email
if (validateEmail('user@example.com')) {
  console.log('Valid email');
}

// Validate URL
if (validateUrl('https://example.com')) {
  console.log('Valid URL');
}
```

#### Formatting Functions

```typescript
import {
  formatDate,
  formatNumber,
  formatMetric,
} from '@mtsynergy/platform-core/utils';

// Format date for locale
const formatted = formatDate('2026-02-06T15:30:00Z', 'en-US');
console.log(formatted); // "2/6/2026"

// Format number with locale-aware separators
const num = formatNumber(1234.56, 'de-DE', 'decimal');
console.log(num); // "1.234,56"

// Format metric with K/M suffix
const reach = formatMetric(2500000, 'reach');
console.log(reach); // "2.5M"
```
```

### 6.2 Update DEVELOPMENT.md

Add section:

```markdown
## Using Validation & Formatting Utilities

### Validation Patterns

#### Multi-Platform Validation

```typescript
const errors = validateCaption(userInput, ['twitter', 'tiktok']);
errors.forEach(err => {
  console.error(`${err.platform}: ${err.message}`);
});
```

#### Error Codes for i18n

```typescript
import { ValidationErrorCode } from '@mtsynergy/platform-core/utils';

const errors = validateCaption(text, platforms);
errors.forEach(err => {
  const i18nKey = `validation.${err.code}`;
  const message = t(i18nKey); // Use i18n function
});
```

### Formatting Patterns

#### Locale-Aware Display

```typescript
import { formatDate, formatNumber } from '@mtsynergy/platform-core/utils';

const userLocale = navigator.language || 'en-US';
const dateStr = formatDate(draft.createdAt, userLocale);
const countStr = formatNumber(metrics.reach, userLocale, 'decimal');
```

#### Metric Display

```typescript
const reach = formatMetric(metrics.reach, 'reach');     // "2.5M"
const engagement = formatMetric(metrics.engagement, 'engagement'); // "150K"
```

### Server-Side Video Validation

For complete video validation, use client-side `validateVideoFile()` for basic checks,
then server-side `validateVideoMetadata()` after extracting metadata with ffmpeg:

```typescript
// On server after ffmpeg processing:
import { validateVideoMetadata } from '@mtsynergy/platform-core/utils';

const metadata = extractVideoMetadata(file); // ffmpeg or similar
const errors = validateVideoMetadata(metadata);
```
```

---

## Phase 7: Quality Assurance

### 7.1 Type Checking
- Run `npm run type-check` - must pass with no errors
- Verify all exports have proper TypeScript definitions

### 7.2 Linting
- Run `npm run lint` - must pass ESLint
- Verify JSDoc comments are correct and complete

### 7.3 Testing
- Run `npm run test` - all tests must pass
- Verify coverage: `npm run test:coverage`
- Target: 95%+ coverage on utilities (higher than 80% minimum)

### 7.4 Build Validation
- Run `npm run build` - must generate dist files
- Verify ESM and CJS outputs are generated
- Verify declaration files (.d.ts) are generated with proper types

### 7.5 Module Export Verification
- Verify imports work: `import { validateCaption } from '@mtsynergy/platform-core/utils'`
- Verify type imports work: `import type { ValidationError } from '@mtsynergy/platform-core/utils'`
- Verify barrel export works: `import * as utils from '@mtsynergy/platform-core/utils'`

---

## Implementation Checklist

### PHASE 1: Type Definitions
1. ✅ Create src/utils/types.ts with ValidationErrorCode enum
2. ✅ Create ValidationError interface with code, platform, message, details
3. ✅ Create LocaleIdentifier and FormatResult type aliases
4. ✅ Create VideoMetadata interface for server-side validation

### PHASE 2: Validation Functions
5. ✅ Implement validateCaption(text, platforms) using PLATFORM_CONFIGS
6. ✅ Implement validateVideoFile(file) with file size and extension checks
7. ✅ Implement validateVideoMetadata(metadata) for server-side checks
8. ✅ Implement validateEmail(email) with regex pattern
9. ✅ Implement validateUrl(url) with native URL constructor
10. ✅ Add comprehensive JSDoc to all validators

### PHASE 3: Formatting Functions
11. ✅ Implement formatDate(date, locale) using Intl.DateTimeFormat
12. ✅ Implement formatNumber(num, locale, style) using Intl.NumberFormat
13. ✅ Implement formatMetric(value, metric) with K/M suffix logic
14. ✅ Add comprehensive JSDoc to all formatters
15. ✅ Add graceful error handling (return fallback values)

### PHASE 4: Barrel Export
16. ✅ Update src/utils/index.ts with all exports
17. ✅ Export types: ValidationError, LocaleIdentifier, FormatResult, VideoMetadata
18. ✅ Export enum: ValidationErrorCode
19. ✅ Export functions: all 5 validators and 3 formatters
20. ✅ Add module documentation to barrel export

### PHASE 5: Testing - Validation
21. ✅ Create src/__tests__/validation.test.ts
22. ✅ Write validateCaption tests (8 tests: valid, exceeds limit, empty, unicode, multiple platforms)
23. ✅ Write validateVideoFile tests (6 tests: valid, size, extension, MIME type, edge cases)
24. ✅ Write validateVideoMetadata tests (6 tests: valid, codec, resolution, fps, bitrate)
25. ✅ Write validateEmail tests (6 tests: valid, no @, no domain, no TLD, spaces, multiple @)
26. ✅ Write validateUrl tests (6 tests: http, https, path+params, malformed, no protocol, localhost)

### PHASE 6: Testing - Formatting
27. ✅ Create src/__tests__/formatting.test.ts
28. ✅ Write formatDate tests (5 tests: en-US, es-ES, ja-JP, invalid date, fallback)
29. ✅ Write formatNumber tests (6 tests: decimal en-US, decimal de-DE, percent, negative, zero)
30. ✅ Write formatMetric tests (6 tests: >=1M, >=1K, <1K, zero, edge cases 1K and 1M)

### PHASE 7: Testing - Exports
31. ✅ Create src/__tests__/utils-exports.test.ts
32. ✅ Write module export tests (8 tests: validation exports, formatting exports, enum, types)

### PHASE 8: Code Quality
33. ✅ Run `npm run type-check` - verify no TypeScript errors
34. ✅ Run `npm run lint` - verify ESLint passes
35. ✅ Run `npm run test` - verify all tests pass
36. ✅ Check test coverage: must be 95%+ for utils

### PHASE 9: Build & Distribution
37. ✅ Run `npm run build` - verify ESM and CJS outputs generated
38. ✅ Verify dist/utils/index.mjs and dist/utils/index.cjs exist
39. ✅ Verify dist/utils/index.d.ts has proper types
40. ✅ Verify source maps generated (index.mjs.map, index.cjs.map)

### PHASE 10: Module Verification
41. ✅ Test ESM import: `import { validateCaption } from './dist/utils/index.mjs'`
42. ✅ Test CJS require: `const { validateCaption } = require('./dist/utils/index.cjs')`
43. ✅ Test barrel import: `import * as utils from '@mtsynergy/platform-core/utils'`
44. ✅ Test type imports: `import type { ValidationError } from '@mtsynergy/platform-core/utils'`

### PHASE 11: Documentation
45. ✅ Update README.md with validation & formatting sections
46. ✅ Add code examples to README for each function
47. ✅ Update DEVELOPMENT.md with usage patterns
48. ✅ Document video validation (basic client + server metadata)
49. ✅ Document error codes for i18n integration

### PHASE 12: Final Validation
50. ✅ Run full pipeline: `npm run type-check && npm run lint && npm run test && npm run build`
51. ✅ Verify no console warnings or errors
52. ✅ Verify all tests passed with 95%+ coverage
53. ✅ Verify build artifacts are complete

---

## Success Criteria

✅ **Implementation Complete When:**

1. All 7 functions implemented (5 validators + 3 formatters)
2. All types defined with proper exports
3. **50-step checklist completed** with all items verified
4. **43+ tests passing** with **95%+ coverage** on utils module
5. **Zero TypeScript errors** in type-check
6. **ESLint passes** with no violations
7. **Build succeeds** with all outputs generated (ESM, CJS, .d.ts, source maps)
8. **Module exports verified** (ESM import, CJS require, barrel import, type import)
9. **Documentation complete** (README.md, DEVELOPMENT.md updated with examples)
10. **Ready for REVIEW mode** and production deployment

---

## Next Steps

After user approval of this plan:

1. User confirms: "ENTER EXECUTE MODE"
2. Implement all 50 checklist items sequentially
3. After completion: transition to REVIEW mode for quality validation
4. Upon review approval: ready for production release

---

_Plan ready for user approval. Once approved, transition to EXECUTE mode to implement._
