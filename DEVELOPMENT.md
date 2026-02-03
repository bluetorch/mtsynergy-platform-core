# Development Guide

## Setup

### Prerequisites

- Node.js 20+ (includes npm 10+)
- Java 21 LTS (required for OpenAPI code generator)

### Installation

```bash
# Clone and install
git clone <repo-url> platform-core
cd platform-core
npm install
```

### Verify Setup

```bash
# All commands should succeed
npm run type-check   # TypeScript validation
npm run lint         # Code style check
npm run test         # Unit tests
npm run build        # Production build
```

## Development Workflow

### Working with OpenAPI Types

The `src/openapi/` directory contains **auto-generated** TypeScript types from the BFF OpenAPI specification. Do not edit these files directly.

**When BFF OpenAPI spec changes:**

1. **Option A: Local Development** (no BFF running)
   - Update `openapi/bff-spec-mock.json` with new types
   - Run `npm run generate:types`
   - Commit the generated `src/openapi/src/models/` files

2. **Option B: From Live BFF** (BFF running)
   ```bash
   npm run generate:types -- --input-spec https://bff.api.local/api/spec.json
   ```

3. **Option C: CI/CD Automation** (OneDev pipeline)
   - BFF commits spec → triggers platform-core pipeline
   - Pipeline runs `npm run generate:types` from live spec
   - Automatically commits and merges updated types

**After regenerating types:**
```bash
npm run test        # Verify types work with existing tests
npm run build       # Ensure no build errors
```

### Adding New Tests

All test files go in `src/__tests__/` and use Vitest:

```typescript
// src/__tests__/my-feature.test.ts
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

Run tests:
```bash
npm run test              # Run all tests once
npm run test -- --watch  # Watch mode (dev)
npm run test:coverage    # With coverage report
```

### Code Quality Checks

**Before committing, ensure all checks pass:**

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint -- --fix   # Auto-fix issues

# Testing
npm run test

# Coverage (must be ≥80%)
npm run test:coverage
```

**Or run everything at once:**
```bash
npm run validate-all  # Custom script (if available)
```

## Architecture

### Type Hierarchy

```
src/
├── api/types.ts           # Hand-written domain types
├── openapi/               # Auto-generated from BFF spec
│   ├── src/models/        # Generated model interfaces
│   └── index.ts           # Re-exports from models/
└── index.ts               # Main barrel export
```

### Export Strategy

The library exports types via a single entry point:

```typescript
// src/index.ts
export * from './api/types';
export * from './openapi/index';
```

Built output:
```javascript
// dist/index.mjs (ESM)
// dist/index.cjs (CJS)
// dist/index.d.ts (TypeScript declarations)
```

## Build & Distribution

### Building Locally

```bash
npm run build        # Full build (vite + tsc)
npm run build:vite   # Just Vite (ESM + CJS)
npm run build:types  # Just TypeScript declarations
```

Output:
```
dist/
├── index.mjs           # ESM bundle (5.5 KB gzipped)
├── index.cjs           # CJS bundle (4.7 KB gzipped)
├── index.d.ts          # TypeScript declarations
├── index.d.ts.map      # Declaration source map
├── index.mjs.map       # ESM source map
└── index.cjs.map       # CJS source map
```

### Publishing

```bash
# Increment version
npm version patch  # or minor, major

# Build and publish
npm run build
npm publish  # or `npm run publish:npm` for npm registry

# Check what will be published
npm pack --dry-run
```

## Troubleshooting

### Type Checking Fails

**Error:** `noUnusedLocals: true` prevents compilation

**Solution:** Generated code has verbose patterns with unused helpers. The tsconfig.json excludes generated code from strict checks. If your code has this error:
```bash
npm run type-check -- --explainFiles  # See what's included
```

### OpenAPI Generation Fails

**Error:** `java: command not found`

**Solution:** Install Java 21 LTS
```bash
# macOS
brew install openjdk@21

# Ubuntu/Debian
sudo apt install openjdk-21-jdk

# Verify
java -version
```

**Error:** Generator times out or crashes

**Solution:** Check Java memory:
```bash
JAVA_TOOL_OPTIONS="-Xmx2g" npm run generate:types
```

### Tests Fail After Type Generation

**Cause:** Generated types changed, tests use old property names

**Solution:**
1. Check generated files in `src/openapi/src/models/`
2. Update tests to match new interfaces
3. Verify with `npm run test`

Example: If `CreateDraftRequest` changed from `title` to `caption`:
```typescript
// Before
const draft: CreateDraftRequest = { title: 'Post' };

// After  
const draft: CreateDraftRequest = { caption: 'Post' };
```

### Build Size Too Large

**Solution:** Check what's being included:
```bash
npm run build -- --analyze  # If Vite plugin available
npm run build:vite          # Check console output size
```

Typical sizes:
- ESM: 5.5 KB (gzipped)
- CJS: 4.7 KB (gzipped)

If significantly larger, check for:
- Unused exports in `src/index.ts`
- Large dependencies in `package.json`
- Dead code in `src/api/`

## CI/CD Pipeline

**OneDev pipeline:** `.onedev-buildspec.yml`

Stages:
1. **Validate** — Type-check and lint
2. **Test** — Unit tests with coverage ≥80%
3. **Build** — Vite + TypeScript compilation
4. **Generate** — Fetch latest BFF spec and regenerate types (optional, on-failure ignored)

**Triggers:**
- Push to `main`, `develop`, `feature/**`
- Pull request to `main` or `develop`
- Changes in `src/`, `package.json`, or config files

## Contributing

### Before Submitting PR

1. **Update types if needed:**
   ```bash
   npm run generate:types
   ```

2. **Pass all checks:**
   ```bash
   npm run type-check && npm run lint && npm run test:coverage && npm run build
   ```

3. **Commit with message:**
   ```bash
   git add .
   git commit -m "feat(openapi): add new types from BFF spec"
   ```

4. **Push to feature branch:**
   ```bash
   git push origin feature/your-feature
   ```

### Code Style

- **Language:** TypeScript (strict mode)
- **Format:** Prettier (auto-format on save)
- **Lint:** ESLint (no errors, warnings allowed)
- **Naming:** camelCase for variables/functions, PascalCase for types/classes

### Documentation

- Use JSDoc comments for exported functions/types
- Keep README.md updated with major changes
- Add tests for new functionality
- Update this DEVELOPMENT.md if adding new processes

## Related Documentation

- [README.md](README.md) — Project overview and usage
- [USER_STORIES.md](USER_STORIES.md) — Feature specifications
- [SPECIFICATION.md](SPECIFICATION.md) — Technical specifications
- [package.json](package.json) — Dependencies and scripts
