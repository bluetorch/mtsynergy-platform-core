import { describe, it, expect } from 'vitest';
import {
  WORKSPACE_ROLES,
  SOCIAL_ROLES,
  hasWorkspacePermission,
  hasSocialPermission,
} from '../constants';

describe('Workspace Roles', () => {
  it('should have all workspace roles', () => {
    expect(WORKSPACE_ROLES).toEqual(['OWNER', 'ADMIN', 'MEMBER']);
  });

  it('should check workspace permissions correctly', () => {
    // OWNER has all permissions
    expect(hasWorkspacePermission('OWNER', 'OWNER')).toBe(true);
    expect(hasWorkspacePermission('OWNER', 'ADMIN')).toBe(true);
    expect(hasWorkspacePermission('OWNER', 'MEMBER')).toBe(true);

    // ADMIN has admin and member permissions
    expect(hasWorkspacePermission('ADMIN', 'OWNER')).toBe(false);
    expect(hasWorkspacePermission('ADMIN', 'ADMIN')).toBe(true);
    expect(hasWorkspacePermission('ADMIN', 'MEMBER')).toBe(true);

    // MEMBER has only member permissions
    expect(hasWorkspacePermission('MEMBER', 'OWNER')).toBe(false);
    expect(hasWorkspacePermission('MEMBER', 'ADMIN')).toBe(false);
    expect(hasWorkspacePermission('MEMBER', 'MEMBER')).toBe(true);
  });
});

describe('Social Roles', () => {
  it('should have all social roles', () => {
    expect(SOCIAL_ROLES).toEqual(['ADMIN', 'MODERATOR', 'EDITOR', 'GUEST']);
  });

  it('should check social permissions correctly', () => {
    // ADMIN has all permissions
    expect(hasSocialPermission('ADMIN', 'ADMIN')).toBe(true);
    expect(hasSocialPermission('ADMIN', 'GUEST')).toBe(true);

    // EDITOR cannot do moderator actions
    expect(hasSocialPermission('EDITOR', 'MODERATOR')).toBe(false);
    expect(hasSocialPermission('EDITOR', 'EDITOR')).toBe(true);
    expect(hasSocialPermission('EDITOR', 'GUEST')).toBe(true);

    // GUEST has minimal permissions
    expect(hasSocialPermission('GUEST', 'ADMIN')).toBe(false);
    expect(hasSocialPermission('GUEST', 'GUEST')).toBe(true);
  });
});
