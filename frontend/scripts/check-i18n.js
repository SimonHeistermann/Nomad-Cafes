#!/usr/bin/env node

/**
 * i18n Validation Script
 *
 * Validates that all translation keys exist in all locale files.
 * Exits with code 1 if there are missing translations.
 *
 * Usage:
 *   node scripts/check-i18n.js           # Check all locales
 *   node scripts/check-i18n.js --verbose # Show all keys
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '../src/lib/i18n/locales');
const LOCALES = ['en', 'de'];
const REFERENCE_LOCALE = 'en'; // Source of truth

const verbose = process.argv.includes('--verbose');

/**
 * Recursively extract all keys from a nested object
 */
function extractKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Load and parse a locale file
 */
function loadLocale(locale) {
  const filePath = join(LOCALES_DIR, `${locale}.json`);

  if (!existsSync(filePath)) {
    console.error(`❌ Locale file not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to parse ${locale}.json: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Find keys that exist in source but not in target
 */
function findMissingKeys(sourceKeys, targetKeys) {
  const targetSet = new Set(targetKeys);
  return sourceKeys.filter((key) => !targetSet.has(key));
}

/**
 * Find keys that exist in target but not in source (extra keys)
 */
function findExtraKeys(sourceKeys, targetKeys) {
  const sourceSet = new Set(sourceKeys);
  return targetKeys.filter((key) => !sourceSet.has(key));
}

/**
 * Main validation function
 */
function validateTranslations() {
  console.log('🌍 Validating i18n translations...\n');

  // Load reference locale
  const referenceData = loadLocale(REFERENCE_LOCALE);
  const referenceKeys = extractKeys(referenceData);

  console.log(`📝 Reference locale (${REFERENCE_LOCALE}): ${referenceKeys.length} keys\n`);

  if (verbose) {
    console.log('Keys in reference locale:');
    referenceKeys.forEach((key) => console.log(`  - ${key}`));
    console.log('');
  }

  let hasErrors = false;
  const results = [];

  // Check each locale against reference
  for (const locale of LOCALES) {
    if (locale === REFERENCE_LOCALE) continue;

    const localeData = loadLocale(locale);
    const localeKeys = extractKeys(localeData);

    const missingKeys = findMissingKeys(referenceKeys, localeKeys);
    const extraKeys = findExtraKeys(referenceKeys, localeKeys);

    results.push({
      locale,
      totalKeys: localeKeys.length,
      missingKeys,
      extraKeys,
    });

    if (missingKeys.length > 0 || extraKeys.length > 0) {
      hasErrors = true;
    }
  }

  // Report results
  for (const result of results) {
    const status = result.missingKeys.length === 0 && result.extraKeys.length === 0
      ? '✅'
      : '❌';

    console.log(`${status} ${result.locale.toUpperCase()}: ${result.totalKeys} keys`);

    if (result.missingKeys.length > 0) {
      console.log(`   ⚠️  Missing ${result.missingKeys.length} keys:`);
      result.missingKeys.forEach((key) => console.log(`      - ${key}`));
    }

    if (result.extraKeys.length > 0) {
      console.log(`   ℹ️  Extra ${result.extraKeys.length} keys (not in ${REFERENCE_LOCALE}):`);
      result.extraKeys.forEach((key) => console.log(`      - ${key}`));
    }

    console.log('');
  }

  // Summary
  if (hasErrors) {
    console.log('❌ i18n validation failed! Please fix the missing translations.\n');
    console.log('To add missing keys, either:');
    console.log('  1. Manually add them to the locale files');
    console.log('  2. Run: npm run i18n:extract (extracts keys from code)\n');
    process.exit(1);
  } else {
    console.log('✅ All translations are in sync!\n');
    process.exit(0);
  }
}

// Run validation
validateTranslations();
