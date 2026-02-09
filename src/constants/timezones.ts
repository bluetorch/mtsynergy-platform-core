import type { Timezone } from './types';

/**
 * All IANA timezone identifiers
 * Source: IANA Time Zone Database (https://www.iana.org/time-zones)
 * Last updated: 2026-02-06
 */
export const TIMEZONES: readonly Timezone[] = [
  // Africa
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Addis_Ababa',
  'Africa/Algiers',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',

  // America - North
  'America/Anchorage',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/New_York',
  'America/Phoenix',
  'America/Toronto',
  'America/Vancouver',

  // America - Central & South
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Caracas',
  'America/Lima',
  'America/Mexico_City',
  'America/Santiago',
  'America/Sao_Paulo',

  // Asia
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Kolkata',
  'Asia/Manila',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',

  // Europe
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Dublin',
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Zurich',

  // Pacific
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',
  'Pacific/Sydney',

  // UTC
  'UTC',
] as const;

/**
 * Human-readable display names for common timezones
 *
 * Maps IANA timezone identifiers to user-friendly display names
 * suitable for dropdowns and UI selection. Includes major cities
 * and regions across all continents.
 *
 * @example
 * ```typescript
 * import { TIMEZONE_DISPLAY_NAMES } from '@mtsynergy/platform-core/constants';
 *
 * const displayName = TIMEZONE_DISPLAY_NAMES['America/New_York'];
 * console.log(displayName); // 'Eastern Time (US & Canada)'
 * ```
 *
 * @public
 */
export const TIMEZONE_DISPLAY_NAMES: Record<string, string> = {
  'America/New_York': 'Eastern Time (US & Canada)',
  'America/Chicago': 'Central Time (US & Canada)',
  'America/Denver': 'Mountain Time (US & Canada)',
  'America/Los_Angeles': 'Pacific Time (US & Canada)',
  'America/Phoenix': 'Arizona',
  'America/Anchorage': 'Alaska',
  'Pacific/Honolulu': 'Hawaii',
  'Europe/London': 'London',
  'Europe/Paris': 'Paris',
  'Europe/Berlin': 'Berlin',
  'Asia/Tokyo': 'Tokyo',
  'Asia/Shanghai': 'Beijing, Shanghai',
  'Asia/Singapore': 'Singapore',
  'Asia/Dubai': 'Dubai',
  'Pacific/Sydney': 'Sydney',
  UTC: 'Coordinated Universal Time',
};

/**
 * Type guard to check if a string is a valid IANA timezone identifier
 *
 * Validates against the comprehensive list of IANA timezone identifiers
 * defined in TIMEZONES constant.
 *
 * @param tz - String to validate as timezone identifier
 * @returns True if the string is a valid IANA timezone
 *
 * @example
 * ```typescript
 * import { isValidTimezone } from '@mtsynergy/platform-core/constants';
 *
 * if (isValidTimezone('America/New_York')) {
 *   console.log('Valid timezone');
 * }
 *
 * isValidTimezone('Invalid/Zone'); // false
 * ```
 *
 * @public
 */
export function isValidTimezone(tz: string): tz is Timezone {
  return TIMEZONES.includes(tz);
}
