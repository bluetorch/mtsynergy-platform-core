#!/usr/bin/env node
/**
 * Type Validation Script
 * Validates that all critical types are present in generated OpenAPI exports
 * Exit code 0: All Tier 1 types present
 * Exit code 1: One or more Tier 1 types missing
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Tier 1: MUST exist (build fails if missing)
const TIER_1_TYPES = ['CreateDraftRequest', 'CreateDraftResponse', 'InboxItem', 'Platform'];

// Tier 2: SHOULD exist (warning if missing)
const TIER_2_TYPES = ['ListInboxResponse', 'ListInboxResponsePagination'];

function readAllDtsFiles(dir) {
  let content = '';
  try {
    const files = readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = join(dir, file.name);
      if (file.isDirectory()) {
        content += readAllDtsFiles(fullPath);
      } else if (file.name.endsWith('.d.ts')) {
        content += readFileSync(fullPath, 'utf-8') + '\n';
      }
    }
  } catch (e) {
    // Ignore directory read errors
  }
  return content;
}

function validateTypes() {
  console.log(`${colors.blue}🔍 Validating OpenAPI Generated Types...${colors.reset}\n`);

  let hasErrors = false;
  let hasWarnings = false;

  try {
    // Read all TypeScript declaration files recursively
    const distPath = join(__dirname, '../dist');
    const allDtsContent = readAllDtsFiles(distPath);

    // Validate Tier 1 types (critical)
    console.log(`${colors.blue}Tier 1 Types (Critical):${colors.reset}`);
    for (const typeName of TIER_1_TYPES) {
      // Check if type is exported (look for "export" and the type name)
      const typeRegex = new RegExp(
        `export\\s+(?:declare\\s+)?(?:interface|type|class|enum|const)\\s+${typeName}\\b|export\\s+declare\\s+${typeName}`
      );
      if (typeRegex.test(allDtsContent)) {
        console.log(`  ${colors.green}✓${colors.reset} ${typeName}`);
      } else {
        console.log(
          `  ${colors.red}✗${colors.reset} ${typeName} ${colors.red}(MISSING)${colors.reset}`
        );
        hasErrors = true;
      }
    }

    // Validate Tier 2 types (important but not critical)
    console.log(`\n${colors.blue}Tier 2 Types (Important):${colors.reset}`);
    for (const typeName of TIER_2_TYPES) {
      const typeRegex = new RegExp(
        `export\\s+(?:declare\\s+)?(?:interface|type|class|enum|const)\\s+${typeName}\\b|export\\s+declare\\s+${typeName}`
      );
      if (typeRegex.test(allDtsContent)) {
        console.log(`  ${colors.green}✓${colors.reset} ${typeName}`);
      } else {
        console.log(
          `  ${colors.yellow}⚠${colors.reset} ${typeName} ${colors.yellow}(MISSING - Warning)${colors.reset}`
        );
        hasWarnings = true;
      }
    }

    // Summary
    console.log('\n' + '─'.repeat(50));
    if (hasErrors) {
      console.log(`${colors.red}❌ Validation FAILED${colors.reset}`);
      console.log(`${colors.red}One or more critical types are missing.${colors.reset}`);
      console.log(`${colors.red}Please regenerate types from the BFF OpenAPI spec.${colors.reset}`);
      process.exit(1);
    } else if (hasWarnings) {
      console.log(`${colors.yellow}⚠️  Validation PASSED with warnings${colors.reset}`);
      console.log(
        `${colors.yellow}Some important types are missing but build can continue.${colors.reset}`
      );
      process.exit(0);
    } else {
      console.log(`${colors.green}✅ Validation PASSED${colors.reset}`);
      console.log(`${colors.green}All critical and important types are present.${colors.reset}`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error validating types:${colors.reset}`, error.message);
    process.exit(1);
  }
}

validateTypes();
