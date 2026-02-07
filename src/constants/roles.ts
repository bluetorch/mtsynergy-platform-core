import type { WorkspaceRole, SocialRole } from './types';

/**
 * All available workspace roles
 */
export const WORKSPACE_ROLES: readonly WorkspaceRole[] = ['OWNER', 'ADMIN', 'MEMBER'] as const;

/**
 * All available social account roles
 */
export const SOCIAL_ROLES: readonly SocialRole[] = [
  'ADMIN',
  'MODERATOR',
  'EDITOR',
  'GUEST',
] as const;

/**
 * Role hierarchy for workspace roles (higher number = more permissions)
 */
export const WORKSPACE_ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

/**
 * Role hierarchy for social account roles (higher number = more permissions)
 */
export const SOCIAL_ROLE_HIERARCHY: Record<SocialRole, number> = {
  ADMIN: 4,
  MODERATOR: 3,
  EDITOR: 2,
  GUEST: 1,
};

/**
 * Check if a workspace role has at least the specified permission level
 */
export function hasWorkspacePermission(
  userRole: WorkspaceRole,
  requiredRole: WorkspaceRole
): boolean {
  return WORKSPACE_ROLE_HIERARCHY[userRole] >= WORKSPACE_ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a social role has at least the specified permission level
 */
export function hasSocialPermission(userRole: SocialRole, requiredRole: SocialRole): boolean {
  return SOCIAL_ROLE_HIERARCHY[userRole] >= SOCIAL_ROLE_HIERARCHY[requiredRole];
}
