import { describe, it, expect } from 'vitest';
import { PLATFORM_NAME, UserRole } from '../index';

describe('platform-core exports', () => {
  it('should export PLATFORM_NAME constant', () => {
    expect(PLATFORM_NAME).toBe('MTSynergy');
  });

  it('should export UserRole enum', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.CREATOR).toBe('CREATOR');
    expect(UserRole.VIEWER).toBe('VIEWER');
  });
});
