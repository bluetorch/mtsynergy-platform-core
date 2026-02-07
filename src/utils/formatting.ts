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
 * formatDate('2026-02-06T15:30:00Z', 'ja-JP');  // "2026/2/6"
 * ```
 *
 * @public
 */
export function formatDate(date: string, locale: LocaleIdentifier): FormatResult {
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
 * formatNumber(0.1234, 'en-US', 'percent');    // "12%"
 * formatNumber(0.1234, 'fr-FR', 'percent');    // "12 %"
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
 * formatMetric(150000, 'reach');        // "150.0K"
 * formatMetric(2500000, 'impressions'); // "2.5M"
 * formatMetric(456, 'engagement');      // "456"
 * formatMetric(0, 'reach');             // "0"
 * ```
 *
 * @public
 */
export function formatMetric(
  value: number,
  _metric: 'reach' | 'engagement' | 'impressions'
): FormatResult {
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toString();
}
