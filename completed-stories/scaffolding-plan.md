# Scaffolding Phase Implementation Plan

_Created: 2026-02-03_
_Mode: PLAN_
_Status: Awaiting Approval_

## Overview

This plan establishes the foundational infrastructure for platform-core: Vite+tsc hybrid build system, Vitest testing framework, ESLint/Prettier code quality tooling, and ESM-first package configuration.

**Implementation Approach:** Bottom-up (complete tooling before features)
**Dependency Strategy:** Install all scaffolding dependencies upfront
**Validation:** Basic build output verification

## Phase 1: Install Dependencies

### 1.1 Install Build Dependencies

Add to devDependencies:

```json
"vite": "^5.0.0",
"@types/node": "^20.11.5"  (already installed, keep)
```

Command:

```bash
npm install --save-dev vite@^5.0.0
```

### 1.2 Install Testing Dependencies

Add to devDependencies:

```json
"vitest": "^1.2.0",
"@vitest/coverage-v8": "^1.2.0"
```

Command:

```bash
npm install --save-dev vitest@^1.2.0 @vitest/coverage-v8@^1.2.0
```

### 1.3 Install Code Quality Dependencies

Add to devDependencies:

```json
"@typescript-eslint/eslint-plugin": "^6.19.0",
"@typescript-eslint/parser": "^6.19.0",
"eslint-config-prettier": "^9.1.0",
"eslint-plugin-prettier": "^5.1.3",
"prettier": "^3.2.0"
```

Note: Keep existing `"eslint": "^8.56.0"`

Command:

```bash
npm install --save-dev @typescript-eslint/eslint-plugin@^6.19.0 @typescript-eslint/parser@^6.19.0 eslint-config-prettier@^9.1.0 eslint-plugin-prettier@^5.1.3 prettier@^3.2.0
```

## Phase 2: Configure Build System

### 2.1 Create vite.config.ts

File: `/Users/bholt/dev/mtsynergy/platform-core/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "MTSynergyCore",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
```

### 2.2 Update tsconfig.json

File: `/Users/bholt/dev/mtsynergy/platform-core/tsconfig.json`

Replace entire content with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/__tests__"]
}
```

Key changes:

- `module: "ESNext"` (was CommonJS)
- `moduleResolution: "bundler"` (was node)
- `emitDeclarationOnly: true` (tsc only generates .d.ts files)
- Added strict compiler options for code quality
- Exclude test files from declaration generation

### 2.3 Update package.json - Build Configuration

File: `/Users/bholt/dev/mtsynergy/platform-core/package.json`

Changes required:

1. Add `"type": "module"` field at root level
2. Update `"main"` to `"./dist/index.cjs"`
3. Add `"module"` field: `"./dist/index.mjs"`
4. Update `"types"` to `"./dist/index.d.ts"`
5. Add `"exports"` field
6. Add `"files"` field
7. Update `"scripts"` section

Complete updated package.json:

```json
{
  "name": "@mtsynergy/platform-core",
  "version": "0.0.1",
  "description": "Shared TypeScript library for MTSynergy platform containing types, constants, and utilities.",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "npm run build:vite && npm run build:types",
    "build:vite": "vite build",
    "build:types": "tsc",
    "dev": "vite build --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "type-check": "tsc --noEmit"
  },
  "keywords": ["mtsynergy", "core", "types"],
  "author": "MTSynergy Platform Team",
  "license": "UNLICENSED",
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@vitest/coverage-v8": "^1.2.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "prettier": "^3.2.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.0",
    "vitest": "^1.2.0"
  },
  "publishConfig": {
    "registry": "http://onedev.mtsynergy.internal/lib/npm/"
  }
}
```

## Phase 3: Configure Testing

### 3.1 Create vitest.config.ts

File: `/Users/bholt/dev/mtsynergy/platform-core/vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.config.ts",
        "**/index.ts", // Barrel files
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### 3.2 Create Test Setup File

File: `/Users/bholt/dev/mtsynergy/platform-core/src/__tests__/setup.ts`

```typescript
// Global test setup
// This file runs before all tests

// Add any global test utilities or configuration here
```

### 3.3 Create Sample Test File

File: `/Users/bholt/dev/mtsynergy/platform-core/src/__tests__/index.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { PLATFORM_NAME, UserRole } from "../index";

describe("platform-core exports", () => {
  it("should export PLATFORM_NAME constant", () => {
    expect(PLATFORM_NAME).toBe("MTSynergy");
  });

  it("should export UserRole enum", () => {
    expect(UserRole.ADMIN).toBe("ADMIN");
    expect(UserRole.CREATOR).toBe("CREATOR");
    expect(UserRole.VIEWER).toBe("VIEWER");
  });
});
```

## Phase 4: Configure Code Quality

### 4.1 Create ESLint Configuration

File: `/Users/bholt/dev/mtsynergy/platform-core/.eslintrc.json`

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "prettier"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": "error"
  },
  "ignorePatterns": ["dist", "node_modules", "*.config.ts", "*.config.js"]
}
```

### 4.2 Create Prettier Configuration

File: `/Users/bholt/dev/mtsynergy/platform-core/.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 4.3 Create .prettierignore

File: `/Users/bholt/dev/mtsynergy/platform-core/.prettierignore`

```
dist
node_modules
coverage
*.md
package-lock.json
```

### 4.4 Create .eslintignore

File: `/Users/bholt/dev/mtsynergy/platform-core/.eslintignore`

```
dist
node_modules
coverage
*.config.ts
*.config.js
```

## Phase 5: Update .gitignore

File: `/Users/bholt/dev/mtsynergy/platform-core/.gitignore`

Append these entries (keep existing content):

```
# Build outputs
dist/
*.tsbuildinfo

# Test coverage
coverage/
.nyc_output/

# Environment files
.env
.env.local
.env.*.local

# Editor directories
.vscode/*
!.vscode/settings.json
.idea/

# OS files
.DS_Store
Thumbs.db
```

## Phase 6: Update Source Code for Strict Mode

### 6.1 Update src/index.ts

File: `/Users/bholt/dev/mtsynergy/platform-core/src/index.ts`

Replace with:

```typescript
// Export all modules from here
export const PLATFORM_NAME = "MTSynergy";

export enum UserRole {
  ADMIN = "ADMIN",
  CREATOR = "CREATOR",
  VIEWER = "VIEWER",
}

// Placeholder for generated API types
export * as API from "./api/types";
```

(Minor change: single quotes for consistency with Prettier)

### 6.2 Update src/api/types.ts

File: `/Users/bholt/dev/mtsynergy/platform-core/src/api/types.ts`

Replace with:

```typescript
// Placeholder for OpenAPI generated types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    total: number;
  };
}
```

(Minor change: single quotes)

## Phase 7: Build and Validate

### 7.1 Run Initial Build

Commands:

```bash
npm run build
```

Expected output:

- `dist/index.mjs` (ESM bundle)
- `dist/index.cjs` (CommonJS bundle)
- `dist/index.d.ts` (TypeScript declarations)
- `dist/index.d.ts.map` (Declaration source map)

Validation: Verify all 4 files exist

### 7.2 Run Type Check

Command:

```bash
npm run type-check
```

Expected: No errors

### 7.3 Run Linter

Command:

```bash
npm run lint
```

Expected: No errors (or only warnings that can be auto-fixed)

If errors, run:

```bash
npm run lint:fix
```

### 7.4 Run Tests

Command:

```bash
npm test
```

Expected: All tests pass (1 test file with basic exports test)

### 7.5 Run Tests with Coverage

Command:

```bash
npm run test:coverage
```

Expected:

- Coverage report generated
- May not meet 80% threshold yet (minimal code exists)
- Coverage report saved to `coverage/` directory

## Phase 8: Format Codebase

### 8.1 Format All Files

Command:

```bash
npm run format
```

This will format all TypeScript files according to Prettier rules.

### 8.2 Verify Formatting

Command:

```bash
npm run format:check
```

Expected: All files properly formatted, no changes needed

## Phase 9: Final Validation

### 9.1 Clean Build

Commands:

```bash
rm -rf dist
npm run build
```

Verify clean build succeeds

### 9.2 Test ESM Import (Manual)

Create temporary test file `test-esm.mjs`:

```javascript
import { PLATFORM_NAME, UserRole } from "./dist/index.mjs";
console.log(PLATFORM_NAME, UserRole.ADMIN);
```

Run:

```bash
node test-esm.mjs
```

Expected output: `MTSynergy ADMIN`

Delete test file:

```bash
rm test-esm.mjs
```

### 9.3 Test CJS Require (Manual)

Create temporary test file `test-cjs.cjs`:

```javascript
const { PLATFORM_NAME, UserRole } = require("./dist/index.cjs");
console.log(PLATFORM_NAME, UserRole.ADMIN);
```

Run:

```bash
node test-cjs.cjs
```

Expected output: `MTSynergy ADMIN`

Delete test file:

```bash
rm test-cjs.cjs
```

### 9.4 Run Full CI Simulation

Commands (in sequence):

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

All commands should succeed with no errors.

---

## Implementation Checklist

Once this plan is approved, the following checklist will guide EXECUTE mode:

1. Install Vite dependency
2. Install Vitest and coverage dependencies
3. Install ESLint TypeScript plugins and parser
4. Install Prettier and ESLint-Prettier integration
5. Create vite.config.ts with library mode configuration
6. Update tsconfig.json for declaration-only mode with strict rules
7. Update package.json - add "type": "module"
8. Update package.json - update main/module/types fields
9. Update package.json - add exports field
10. Update package.json - add files field
11. Update package.json - replace scripts section
12. Update package.json - add new devDependencies
13. Create vitest.config.ts with coverage thresholds
14. Create src/**tests**/setup.ts
15. Create src/**tests**/index.test.ts
16. Create .eslintrc.json with strict TypeScript configuration
17. Create .prettierrc.json
18. Create .prettierignore
19. Create .eslintignore
20. Update .gitignore with build and coverage entries
21. Update src/index.ts for Prettier formatting
22. Update src/api/types.ts for Prettier formatting
23. Run npm run build - verify dist/ output
24. Run npm run type-check - verify no errors
25. Run npm run lint:fix - fix auto-fixable issues
26. Run npm test - verify tests pass
27. Run npm run test:coverage - verify coverage report
28. Run npm run format - format all files
29. Run npm run format:check - verify formatting
30. Clean build validation (rm -rf dist && npm run build)
31. Test ESM import manually (create test-esm.mjs, run, delete)
32. Test CJS require manually (create test-cjs.cjs, run, delete)
33. Run full CI simulation (type-check, lint, test, build)

---

## Expected Outcomes

After completing this plan:

✅ **Build System:**

- Dual ESM+CJS output via Vite
- TypeScript declarations via tsc
- Source maps for debugging

✅ **Testing:**

- Vitest configured and working
- Coverage reporting enabled
- 80% threshold configured (may not be met yet with minimal code)

✅ **Code Quality:**

- Strict ESLint rules enforced
- Prettier formatting configured
- Pre-commit hooks ready (not installed per decision)

✅ **Package Configuration:**

- ESM-first with backward compatibility
- Proper exports for modular imports
- Ready for npm publishing

✅ **Developer Experience:**

- Complete npm scripts for all workflows
- Fast development with watch mode
- Interactive testing with UI

✅ **Foundation Ready:**

- Infrastructure complete for feature implementation
- Ready to implement SC-801, SC-802, SC-803, I18N stories
- Validated dual-format package works correctly

---

## Post-Scaffolding Next Steps

After this plan is executed and validated:

1. **REVIEW mode:** Validate implementation matches this plan exactly
2. **Feature Planning:** Create plans for SC-801 (OpenAPI), SC-802 (Constants), SC-803 (Validators)
3. **Iterative Development:** Use RIPER workflow for each feature story

---

_This plan requires approval before proceeding to EXECUTE mode._
