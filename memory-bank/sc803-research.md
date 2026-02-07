# SC-803 Research: Validation & Formatting Utilities

_Created: 2026-02-06_
_Mode: RESEARCH_
_Status: In Progress_

## Story Overview

**Story ID:** SC-803-CORE  
**Title:** Export validation functions & formatting utilities  
**Owner:** platform-core team  
**Consumer Projects:** platform-shell, platform-mfe-*, platform-mobile  
**Dependencies:** SC-802 (Platform Constants) ✅ COMPLETE  
**Status:** Research Mode - Information Gathering

## User Story Definition

### Core Requirements

**Validation Functions:**
1. `validateCaption(text, platforms)`: Check length limits per platform
2. `validateVideoFile(file)`: Verify codec, resolution, bitrate
3. `validateEmail(email)`: Email format validation
4. `validateUrl(url)`: URL format validation

**Formatting Functions:**
1. `formatDate(date, locale)`: Localized date formatting
2. `formatNumber(num, style)`: Formatted numbers (1.5K, 50%)
3. `formatMetric(value, metric)`: Short metric notation (150K reach)

## Current State Analysis

### What Exists

1. ✅ **SC-802 Constants Available**
   - `PLATFORM_CONFIGS` with character limits for all 6 platforms
   - `VIDEO_REQUIREMENTS` with resolution, bitrate, fps, codec specs
   - `WORKSPACE_ROLES` and `SOCIAL_ROLES` for role validation
   - `TIMEZONES` (52 IANA timezones) for timezone validation

2. ✅ **Test Infrastructure Ready**
   - Vitest configured and working
   - Coverage tracking enabled (100% current, 80% threshold)
   - Test files: `src/__tests__/*.test.ts` pattern established

3. ✅ **Build System Ready**
   - Vite configured for dual ESM+CJS output
   - TypeScript strict mode enabled
   - Source maps enabled

4. ✅ **Package Exports Ready**
   - `package.json` has `./utils` export path configured
   - Entry point: `src/utils/index.ts` (currently placeholder)

5. ⚠️ **Utils Module Placeholder**
   - File: `src/utils/index.ts`
   - Content: TODO comment with function list
   - No implementation yet

### What's Needed

1. ❌ **Validation Module Implementation**
   - File: `src/utils/validation.ts`
   - Export all validation functions
   - Use SC-802 constants for validation logic

2. ❌ **Formatting Module Implementation**
   - File: `src/utils/formatting.ts`
   - Export all formatting functions
   - Internationalization support for date/number formatting

3. ❌ **Type Definitions**
   - `ValidationError` interface
   - `FormatStyle` types
   - Function signatures with proper TypeScript types

4. ❌ **Test Files**
   - `src/__tests__/validation.test.ts`
   - `src/__tests__/formatting.test.ts`
   - Comprehensive test coverage (target 95%+ for utilities)

5. ❌ **Documentation**
   - Usage examples in README.md
   - JSDoc comments on all functions
   - Update DEVELOPMENT.md with utility usage patterns

## Technical Considerations

### Validation Functions

#### `validateCaption(text, platforms)`

**Purpose:** Validate text against platform-specific character limits

**Inputs:**
- `text: string` - Caption text to validate
- `platforms: Platform[]` - Array of platforms to validate against

**Output:**
- `ValidationError[]` - Array of validation errors (empty if valid)

**Implementation Notes:**
- Import `PLATFORM_CONFIGS` from `src/constants`
- Check `text.length` against each `platform.text.maxLength`
- Return array with errors per platform that fails validation
- Consider handling special characters (emojis count differently on some platforms)

**Example from README.md:**
```typescript
export function validateCaption(text: string, platforms: Platform[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const platform of platforms) {
    const config = PLATFORM_CONFIGS[platform];
    if (text.length > config.maxCaption) {
      errors.push({
        platform,
        message: `Caption exceeds ${config.maxCaption} character limit`,
      });
    }
  }
  
  return errors;
}
```

#### `validateVideoFile(file)`

**Purpose:** Verify video file meets technical requirements

**Inputs:**
- `file: File` - Video file object (browser File API or Node.js equivalent)

**Output:**
- `ValidationError[]` - Array of validation errors

**Implementation Notes:**
- Import `VIDEO_REQUIREMENTS` from `src/constants`
- Check file size against platform limits
- **Challenge:** Browser environment cannot parse video metadata (codec, resolution, fps) without external library
- **Consideration:** May need to validate basic properties only (size, extension) without deep metadata inspection
- **Alternative:** Document that deep validation requires server-side processing with ffmpeg

**Questions for PLAN mode:**
- Should this be browser-compatible validation only?
- Or should we accept that metadata validation requires server-side tools?
- Should we have two variants: `validateVideoFileBasic()` and `validateVideoFileDeep()`?

#### `validateEmail(email)`

**Purpose:** Basic email format validation

**Inputs:**
- `email: string` - Email address to validate

**Output:**
- `boolean` - True if valid format, false otherwise

**Implementation Notes:**
- Simple regex pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- This is basic validation, not RFC 5322 compliant
- Good enough for UI validation
- Server-side should do comprehensive validation

**Example from README.md:**
```typescript
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

#### `validateUrl(url)`

**Purpose:** Validate URL format

**Inputs:**
- `url: string` - URL to validate

**Output:**
- `boolean` - True if valid URL, false otherwise

**Implementation Notes:**
- Use native `URL` constructor for validation
- Catches malformed URLs
- Works in both browser and Node.js

**Example from README.md:**
```typescript
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### Formatting Functions

#### `formatDate(date, locale)`

**Purpose:** Format ISO8601 datetime string for display

**Inputs:**
- `date: ISO8601DateTime` - ISO8601 datetime string
- `locale: string = 'en-US'` - IANA locale identifier

**Output:**
- `string` - Formatted date string

**Implementation Notes:**
- Use `Intl.DateTimeFormat` for internationalization
- Convert ISO8601 string to Date object first
- Consider exposing format options (short, long, full)
- **Question:** Should we validate locale against supported locales?

**Example from README.md:**
```typescript
export function formatDate(date: ISO8601DateTime, locale: string = 'en-US'): string {
  return new Date(date).toLocaleDateString(locale);
}
```

#### `formatNumber(num, style)`

**Purpose:** Format numbers with locale-aware formatting

**Inputs:**
- `num: number` - Number to format
- `style: 'decimal' | 'percent' = 'decimal'` - Format style

**Output:**
- `string` - Formatted number

**Implementation Notes:**
- Use `Intl.NumberFormat` for locale support
- Support decimal and percent styles
- Consider adding currency style in future
- Default locale: 'en-US'

**Example from README.md:**
```typescript
export function formatNumber(num: number, style: 'decimal' | 'percent' = 'decimal'): string {
  return new Intl.NumberFormat('en-US', { style }).format(num);
}
```

#### `formatMetric(value, metric)`

**Purpose:** Format large numbers with K/M suffixes for metrics

**Inputs:**
- `value: number` - Numeric metric value
- `metric: 'reach' | 'engagement' | 'impressions'` - Metric type (for semantic context)

**Output:**
- `string` - Formatted metric (e.g., "150K", "2.5M")

**Implementation Notes:**
- Format >= 1,000,000 as "X.XM"
- Format >= 1,000 as "X.XK"
- Format < 1,000 as plain number
- One decimal place for K/M values
- **Question:** Should `metric` parameter influence formatting? Or is it just for type safety?

**Example from README.md:**
```typescript
export function formatMetric(value: number, metric: 'reach' | 'engagement' | 'impressions'): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}
```

## Type Definitions Required

### ValidationError Interface

```typescript
export interface ValidationError {
  field?: string;        // Optional: which field failed
  platform?: Platform;   // Optional: which platform caused error
  message: string;       // Human-readable error message
  code?: string;         // Optional: error code for i18n
}
```

### ISO8601DateTime Type

```typescript
// Already defined in src/constants/types.ts
export type ISO8601DateTime = string;
```

### Platform Type

```typescript
// Already defined in src/constants/types.ts
export type Platform = 'twitter' | 'tiktok' | 'facebook' | 'instagram' | 'linkedin' | 'youtube';
```

## Dependencies & Zero-Dependency Principle

**Current Project Principle:** Zero production dependencies

**Implications for SC-803:**
- ✅ Email validation: Use regex (no dependency)
- ✅ URL validation: Use native `URL` constructor (no dependency)
- ✅ Date formatting: Use `Intl.DateTimeFormat` (native)
- ✅ Number formatting: Use `Intl.NumberFormat` (native)
- ✅ Metric formatting: Custom logic (no dependency)
- ⚠️ Video validation: Cannot inspect metadata without external tool
  - **Option 1:** Basic validation only (size, extension)
  - **Option 2:** Document that deep validation requires server-side ffmpeg
  - **Option 3:** Accept this limitation and validate only what's possible

**Recommendation:** Maintain zero-dependency principle, document video validation limitations

## File Structure

```
src/
├── utils/
│   ├── index.ts           # Barrel export
│   ├── validation.ts      # All validation functions
│   ├── formatting.ts      # All formatting functions
│   └── types.ts           # ValidationError and other utility types
├── __tests__/
│   ├── validation.test.ts # 20+ tests for validation functions
│   ├── formatting.test.ts # 15+ tests for formatting functions
│   └── utils-exports.test.ts # Module export verification
```

## Test Coverage Requirements

**Target:** 95%+ for utility functions (higher than project minimum of 80%)

**Rationale:** Utilities are critical shared code used across all projects

**Test Categories:**

### Validation Tests

1. **validateCaption:**
   - Valid captions (within limits)
   - Invalid captions (exceeding limits for each platform)
   - Empty string
   - Multiple platforms (some pass, some fail)
   - Edge cases: exactly at limit, one character over

2. **validateVideoFile:**
   - Valid file size
   - Exceeds max file size
   - Missing file
   - Invalid file type (if checking extensions)

3. **validateEmail:**
   - Valid email formats
   - Invalid formats (no @, no domain, etc.)
   - Edge cases (multiple @, spaces, etc.)

4. **validateUrl:**
   - Valid URLs (http, https, with paths, with params)
   - Invalid URLs (malformed, missing protocol, etc.)
   - Edge cases (localhost, IP addresses, etc.)

### Formatting Tests

1. **formatDate:**
   - Valid ISO8601 strings
   - Different locales (en-US, es-ES, fr-FR)
   - Invalid date strings (should handle gracefully)

2. **formatNumber:**
   - Decimal format
   - Percent format
   - Large numbers
   - Small numbers
   - Negative numbers

3. **formatMetric:**
   - Values >= 1M (should show "X.XM")
   - Values >= 1K (should show "X.XK")
   - Values < 1K (should show plain number)
   - Zero value
   - Negative values (if applicable)

## Documentation Requirements

### 1. JSDoc Comments

All functions must have comprehensive JSDoc:
- Description
- `@param` for each parameter
- `@returns` for return value
- `@example` with usage code
- `@see` links to related functions/constants

### 2. README.md Updates

Add section: "Validation & Formatting Utilities"
- Overview of available functions
- Code examples for each function
- Import examples
- Links to full API documentation

### 3. DEVELOPMENT.md Updates

Add section: "Using Validation & Formatting Utilities"
- How to import
- Best practices
- Performance considerations
- Limitations (e.g., video validation)

## Open Questions for PLAN Mode

1. **Video Validation Scope:**
   - Should we implement basic validation only (size, extension)?
   - Or should we add deep validation with external dependency?
   - Or document server-side validation requirement?

2. **Locale Support:**
   - Should we validate locale strings against supported locales?
   - Or accept any valid IANA locale identifier?
   - Should we add a `SUPPORTED_LOCALES` constant?

3. **Error Handling:**
   - Should formatting functions throw on invalid input?
   - Or return fallback values (e.g., "Invalid Date")?
   - What about null/undefined inputs?

4. **ValidationError Structure:**
   - Is the proposed interface sufficient?
   - Should we add `severity` field (error vs warning)?
   - Should we add `path` for nested validation?

5. **Function Variants:**
   - Should we have both `validateEmail()` and `isValidEmail()`?
   - Or stick with boolean return for simple validators?
   - Should complex validators return objects with more detail?

6. **Metric Types:**
   - Is the metric parameter in `formatMetric()` necessary?
   - Or should it just be `formatMetric(value: number)`?
   - Future: Should metric type influence formatting rules?

## Success Criteria

✅ **Research Complete When:**
1. All existing documentation reviewed
2. SC-802 constants integration points identified
3. Function signatures and types defined
4. Test coverage strategy documented
5. Open questions identified for PLAN mode
6. Zero-dependency approach validated
7. File structure designed

## Next Steps

After research completion:
1. User reviews research findings
2. User provides answers to open questions
3. Transition to INNOVATE mode to explore implementation approaches
4. OR transition directly to PLAN mode if approach is clear

## Related Stories

- **SC-802:** Platform Constants ✅ COMPLETE (provides constants for validation)
- **SC-801:** OpenAPI Type Generation ✅ COMPLETE (provides type patterns)
- **I18N-1101:** Localization Support (future - may enhance formatDate/formatNumber)

---

_Research mode complete. Ready for user review and transition to next mode._
