# Technical Context

_Version: 1.0_
_Created: [PENDING START PHASE]_
_Last Updated: [PENDING START PHASE]_

## Technology Stack

### Languages

- **TypeScript 5.3+** - Primary language for all source code
- **JavaScript ES2022** - Compilation target for broad compatibility

### Build & Bundle Tools

- **Vite** - Build tool for ESM + CJS dual output (library mode)
- **TypeScript Compiler (tsc)** - Type checking and declaration file generation
- **esbuild** - Fast bundler (used internally by Vite)

### Testing Frameworks

- **Vitest** - Unit testing framework (Vite-native, fast, ESM-first)
- **@vitest/coverage-v8** - Code coverage reporting (target: 80%+)

### Code Quality

- **ESLint 8.56+** - Linting and code style enforcement
- **Prettier** - Code formatting (to be added)
- **TypeScript strict mode** - Maximum type safety

### Code Generation

- **@openapitools/openapi-generator-cli** - Auto-generate types from BFF OpenAPI spec
- **typescript-fetch generator** - Optional API client generation for Node.js/React Native

### Documentation

- **JSDoc** - Inline code documentation format
- **TypeDoc** - Documentation site generator (Apache 2.0 license)

### Version Control & Release

- **Git** - Version control
- **Conventional Commits** - Commit message standard for semantic versioning
- **semantic-release** - Automated versioning and npm publishing

### Database

- **N/A** - This is a stateless library (no database)

### Dependencies

- **Prod**: `uuid` (v9/v10) - RFC4122 UUID generation
- **Dev**: `@types/uuid`

### Infrastructure

- **OneDev** - Self-hosted CI/CD and npm registry
- **CloudFlare R2** - CDN for browser-optimized ESM bundles
- **CloudFlare Workers** - Target runtime for Shell/MFEs
- **Node.js 20+** - Development and CI/CD runtime
- **React Native (Hermes)** - Target runtime for mobile app

## Development Environment Setup

### Prerequisites

- **Node.js 20+** (LTS version)
- **npm 10+** or **pnpm 8+** (package manager)
- **Git** (version control)
- **VS Code** (recommended IDE) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### Setup Steps

1. **Clone repository**

   ```bash
   git clone <repo-url> platform-core
   cd platform-core
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Verify TypeScript compilation**

   ```bash
   npm run build
   ```

4. **Run tests**

   ```bash
   npm test
   ```

5. **Generate OpenAPI types** (requires BFF OpenAPI spec)

   ```bash
   npm run generate:types
   ```

6. **Start development with watch mode**
   ```bash
   npm run dev  # Watches src/ and rebuilds on changes
   ```

## Dependencies

### Production Dependencies

**None** - This is a zero-dependency library. All utilities are self-contained.

**Rationale:**

- Minimizes bundle size for browser consumption
- Reduces security vulnerabilities
- Avoids version conflicts in consuming projects
- Ensures compatibility across all target runtimes

### Development Dependencies

| Package                               | Version  | Purpose                               |
| ------------------------------------- | -------- | ------------------------------------- |
| `typescript`                          | ^5.3.3   | TypeScript compiler and type checking |
| `vite`                                | ^5.0.0   | Build tool (ESM + CJS dual output)    |
| `vitest`                              | ^1.2.0   | Unit testing framework                |
| `@vitest/coverage-v8`                 | ^1.2.0   | Code coverage reporting               |
| `@types/node`                         | ^20.11.5 | Node.js type definitions              |
| `eslint`                              | ^8.56.0  | Code linting                          |
| `prettier`                            | ^3.2.0   | Code formatting                       |
| `@openapitools/openapi-generator-cli` | ^2.13.0  | OpenAPI type generation               |
| `typedoc`                             | ^0.25.0  | Documentation generation (Apache 2.0) |
| `semantic-release`                    | ^23.0.0  | Automated versioning and publishing   |
| `@semantic-release/git`               | ^10.0.0  | Git integration for semantic-release  |
| `@semantic-release/changelog`         | ^6.0.0   | Changelog generation                  |

## Technical Constraints

### Licensing

- **All dependencies must be Apache 2.0, MIT, or BSD licensed**
- No GPL/AGPL dependencies (incompatible with commercial use)
- Prefer self-hosted solutions over cloud SaaS

### Runtime Compatibility

- **Browser**: ES2022, no Node.js-specific APIs
- **Node.js**: 20+ LTS
- **React Native**: Hermes engine (JavaScriptCore subset)
- **CloudFlare Workers**: V8 isolates (no Node.js APIs)

### Bundle Size

- **Browser bundle**: < 50KB (gzipped, tree-shaken)
- **Mobile bundle**: < 100KB (includes full utilities)
- **Zero production dependencies** to minimize size

### Performance

- **Type generation**: < 30 seconds on BFF spec update
- **Build time**: < 10 seconds for full rebuild
- **Test suite**: < 5 seconds for full run

### Breaking Change Protection

- **Patch versions (1.0.x)**: No breaking changes allowed
- **Minor versions (1.x.0)**: Additive changes only
- **Major versions (x.0.0)**: Breaking changes require manual approval
- **CI/CD fails build** if breaking changes detected in patch/minor bump

### Type Safety

- **TypeScript strict mode enabled** (no `any` types)
- **100% type coverage** for exported APIs
- **No runtime type assertions** (compile-time only)

### Browser Security

- **No eval() or Function() constructors**
- **CSP-compliant** (Content Security Policy)
- **No inline scripts** in generated code

## Build and Deployment

### Build Commands

```bash
# Development build with watch mode
npm run dev

# Production build (ESM + CJS + type declarations)
npm run build

# Type checking only (no emit)
npm run type-check

# Generate OpenAPI types from BFF spec
npm run generate:types

# Generate documentation site
npm run docs:generate

# Lint code
npm run lint

# Format code
npm run format
```

### Deployment Process

#### Automated CI/CD (OneDev)

**Trigger**: Push to `main` branch or BFF OpenAPI spec update

**Pipeline Steps:**

1. **Install dependencies**

   ```bash
   npm ci
   ```

2. **Type checking**

   ```bash
   npm run type-check
   ```

3. **Linting**

   ```bash
   npm run lint
   ```

4. **Run tests with coverage**

   ```bash
   npm test -- --coverage
   npm run test:coverage-threshold  # Fails if < 80%
   ```

5. **Build library**

   ```bash
   npm run build
   ```

6. **Breaking change detection** (for patch/minor)

   ```bash
   npm run type:compare  # Compares public API surface
   ```

7. **Semantic versioning**

   ```bash
   npx semantic-release  # Auto-bumps version based on commits
   ```

8. **Publish to OneDev npm registry**

   ```bash
   npm publish --registry=http://onedev.mtsynergy.internal/lib/npm/
   ```

9. **Deploy to CloudFlare R2 CDN**

   ```bash
   npm run deploy:cdn  # Uploads dist/ to R2 with versioned URLs
   ```

10. **Generate and publish documentation**
    ```bash
    npm run docs:generate
    npm run docs:deploy  # Deploy to OneDev or static hosting
    ```

#### Manual Publishing (Development)

```bash
# Build locally
npm run build

# Test package contents
npm pack

# Publish to registry
npm publish --registry=http://onedev.mtsynergy.internal/lib/npm/
```

#### CDN Deployment

**CloudFlare R2 Structure:**

```
r2.cdn.mtsynergy.com/
  @mtsynergy/core/
    1.0.0/
      index.mjs
      index.d.ts
      types/index.mjs
      constants/index.mjs
      utils/index.mjs
    1.0.1/
      ...
    latest/  # Symlink to latest version
      ...
```

**Import Map Usage (Browser):**

```html
<script type="importmap">
  {
    "imports": {
      "@mtsynergy/core": "https://r2.cdn.mtsynergy.com/@mtsynergy/core/1.0.0/index.mjs"
    }
  }
</script>
```

## Testing Approach

### Testing Frameworks

- **Vitest** - Unit testing (fast, ESM-native, Vite integration)
- **@vitest/coverage-v8** - Code coverage (V8 engine)

### Test Structure

```
src/
  utils/
    validation.ts
    __tests__/
      validation.test.ts
  constants/
    platforms.ts
    __tests__/
      platforms.test.ts
  i18n/
    index.ts
    __tests__/
      i18n.test.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Coverage threshold check (fails if < 80%)
npm run test:coverage-threshold

# Run specific test file
npm test -- validation.test.ts
```

### Coverage Goals

- **Overall**: 80%+ line coverage
- **Validators/Formatters**: 95%+ (critical business logic)
- **Constants**: Schema validation only
- **Auto-generated code**: Excluded from coverage
- **Type definitions**: No runtime testing (compile-time only)

### Test Categories

#### Unit Tests (validators, formatters, utilities)

```typescript
// src/utils/__tests__/validation.test.ts
describe("validateCaption", () => {
  it("should pass for valid Twitter caption", () => {
    expect(validateCaption("Hello", ["twitter"])).toEqual([]);
  });

  it("should fail when exceeding platform limit", () => {
    const long = "a".repeat(281);
    const errors = validateCaption(long, ["twitter"]);
    expect(errors).toHaveLength(1);
    expect(errors[0].platform).toBe("twitter");
  });
});
```

#### Constant Validation Tests

```typescript
// src/constants/__tests__/platforms.test.ts
describe("PLATFORM_CONFIGS", () => {
  it("should have all required platforms", () => {
    const required = [
      "twitter",
      "tiktok",
      "facebook",
      "instagram",
      "linkedin",
      "youtube",
    ];
    required.forEach((platform) => {
      expect(PLATFORM_CONFIGS[platform]).toBeDefined();
    });
  });
});
```

#### i18n Tests

```typescript
// src/i18n/__tests__/i18n.test.ts
describe("t (translation)", () => {
  it("should return correct translation", () => {
    expect(t("labels.publish", "en-US")).toBe("Publish");
    expect(t("labels.publish", "es-ES")).toBe("Publicar");
  });

  it("should interpolate parameters", () => {
    expect(t("errors.limit", "en-US", { limit: "280" })).toContain("280");
  });
});
```

### Not Tested

- TypeScript type definitions (verified at compile-time)
- Auto-generated OpenAPI types (tested via BFF integration tests)
- Vite configuration
- Build scripts

---

_This file is updated when adding technologies, updating dependencies, or changing build processes._
