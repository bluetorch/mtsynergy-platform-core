import {
  PLATFORM_CONFIGS,
  getPlatformConfig,
  WORKSPACE_ROLES,
  hasWorkspacePermission,
  TIMEZONES,
  isValidTimezone,
} from './dist/constants/index.mjs';

console.log('✅ ESM Import Test');
console.log('Platforms:', Object.keys(PLATFORM_CONFIGS));
console.log('Instagram config:', getPlatformConfig('instagram').displayName);
console.log('Workspace roles:', WORKSPACE_ROLES);
console.log('OWNER has ADMIN perms:', hasWorkspacePermission('OWNER', 'ADMIN'));
console.log('Timezone count:', TIMEZONES.length);
console.log('Valid timezone:', isValidTimezone('America/New_York'));
console.log('Invalid timezone:', isValidTimezone('Invalid/Zone'));
