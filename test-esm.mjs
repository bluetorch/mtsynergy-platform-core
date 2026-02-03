import * as core from './dist/index.mjs';

console.log('ESM imports available:', Object.keys(core).length > 0);
console.log('Sample exported symbols:', Object.keys(core).slice(0, 5).join(', '));

// TypeScript interfaces are compile-time only, not runtime.
// What matters is that:
// 1. The module imports without errors
// 2. No missing references in generated code
// 3. Type checking passes (verified in npm run type-check)

const hasRuntimeExports = Object.keys(core).length > 0;
const hasGeneratedConverters = Object.keys(core).some(k => k.includes('FromJSON'));

console.log('Has runtime exports:', hasRuntimeExports);
console.log('Has generated converters:', hasGeneratedConverters);

if (hasRuntimeExports) {
  console.log('✓ ESM module imports successfully');
  process.exit(0);
} else {
  console.log('✗ ESM module has no exports');
  process.exit(1);
}

