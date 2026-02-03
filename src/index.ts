// Export all modules from here
export const PLATFORM_NAME = 'MTSynergy';

export enum UserRole {
  ADMIN = 'ADMIN',
  CREATOR = 'CREATOR',
  VIEWER = 'VIEWER',
}

// Placeholder for API types
export * as API from './api/types';

// Core types module
export * from './types';

// Auto-generated types from BFF OpenAPI specification
export * from './openapi/index';
