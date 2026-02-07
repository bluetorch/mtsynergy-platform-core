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
 * Common timezone display names
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
 * Check if a string is a valid IANA timezone
 */
export function isValidTimezone(tz: string): tz is Timezone {
  return TIMEZONES.includes(tz);
}
