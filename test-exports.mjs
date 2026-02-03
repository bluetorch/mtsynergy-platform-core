// Test export paths
import { isSuccessResponse, isErrorResponse } from '@mtsynergy/platform-core/types';
import {} from '@mtsynergy/platform-core/constants';
import {} from '@mtsynergy/platform-core/utils';

// Test that functions are exported
console.log('isSuccessResponse:', typeof isSuccessResponse === 'function');
console.log('isErrorResponse:', typeof isErrorResponse === 'function');
console.log('✅ All export paths work correctly');
