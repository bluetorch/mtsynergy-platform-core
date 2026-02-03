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

## Publishing to OneDev Registry

### Prerequisites

- OneDev npm registry credentials configured in `.npmrc`
- Semantic versioning knowledge (major.minor.patch)
- Git repository access for tagging releases

### Publishing Process

1. **Update Version**
   ```bash
   # Patch release (bug fixes): 0.0.1 → 0.0.2
   npm version patch
   
   # Minor release (new features): 0.0.1 → 0.1.0
   npm version minor
   
   # Major release (breaking changes): 0.0.1 → 1.0.0
   npm version major
   ```

2. **Run Pre-Publish Checks**
   ```bash
   npm run prepublishOnly
   # This automatically runs: build + test + validate:types
   ```

3. **Tag Release in Git**
   ```bash
   git tag -a v0.1.0 -m "Release version 0.1.0"
   git push origin v0.1.0
   ```

4. **Publish to Registry**
   ```bash
   npm publish
   # Publishes to: http://onedev.mtsynergy.internal/lib/npm/
   ```

### Registry Configuration

The package is configured to publish to the OneDev internal npm registry:

```json
"publishConfig": {
  "registry": "http://onedev.mtsynergy.internal/lib/npm/"
}
```

**License:** Apache 2.0 (open source)  
**Distribution:** Internal only (OneDev registry)

### Consuming the Package

To install `@mtsynergy/platform-core` in your project:

1. **Configure `.npmrc`** (in your project root or `~/.npmrc`):
   ```
   registry=http://onedev.mtsynergy.internal/lib/npm/
   ```

2. **Install the package**:
   ```bash
   npm install @mtsynergy/platform-core
   ```

3. **Import in your code**:
   ```typescript
   // Main exports
   import { Platform, CreateDraftRequest } from '@mtsynergy/platform-core';
   
   // Types module
   import { ApiSuccessResponse, isSuccessResponse } from '@mtsynergy/platform-core/types';
   
   // Constants (available after SC-802)
   import { PLATFORM_CONFIGS } from '@mtsynergy/platform-core/constants';
   
   // Utils (available after SC-803)
   import { validateCaption } from '@mtsynergy/platform-core/utils';
   ```

### Pre-Publish Checklist

Before publishing a new version:

- [ ] All tests passing (`npm run test`)
- [ ] Type generation successful (`npm run generate:types`)
- [ ] Type validation passing (`npm run validate:types`)
- [ ] Build successful (`npm run build`)
- [ ] Version bumped in `package.json`
- [ ] Git tag created for release
- [ ] CHANGELOG updated (if exists)
- [ ] No uncommitted changes in working directory

### Versioning Strategy

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes (incompatible API changes)
- **MINOR** (0.x.0): New features (backward-compatible)
- **PATCH** (0.0.x): Bug fixes (backward-compatible)

**Current version:** 0.0.1 (initial development)

**Pre-1.0.0 Note:** Until version 1.0.0, minor version increments may include breaking changes.

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
