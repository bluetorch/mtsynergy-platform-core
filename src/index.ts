/**
 * @mtsynergy/platform-core - Main Entry Point
 *
 * Shared TypeScript library for MTSynergy platform providing:
 * - Auto-generated types from BFF OpenAPI specification
 * - Platform-specific constants and configurations
 * - Validation utilities and formatters
 * - PII sanitization and data handling utilities
 * - Observability helpers (correlation IDs, trace context)
 *
 * @packageDocumentation
 */

/** Platform name constant for branding and logging */
export const PLATFORM_NAME = 'MTSynergy';

/**
 * User role enumeration (legacy - for backwards compatibility)
 *
 * @deprecated Use WorkspaceRole or SocialRole from constants module instead
 * @see constants/types for current role definitions
 */
export enum UserRole {
  /** Administrator role (legacy) - use WorkspaceRole.ADMIN instead */
  ADMIN = 'ADMIN',

  /** Creator role (legacy) - use WorkspaceRole or SocialRole.EDITOR instead */
  CREATOR = 'CREATOR',

  /** Viewer role (legacy) - use SocialRole.GUEST instead */
  VIEWER = 'VIEWER',
}

// Placeholder for API types (deprecated in favor of OpenAPI types)
export * as API from './api/types';

// Core types module
export * from './types';

// Auto-generated types from BFF OpenAPI specification
export * from './openapi/index';
