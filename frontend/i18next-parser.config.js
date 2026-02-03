/**
 * i18next-parser configuration
 *
 * This configuration extracts translation keys from the codebase
 * and validates that all keys exist in all locale files.
 *
 * Usage:
 *   npm run i18n:extract  - Extract keys from code to locale files
 *   npm run i18n:check    - Check for missing translations (CI)
 */

export default {
  // Context separator used in keys (e.g., key_context)
  contextSeparator: '_',

  // Create old catalog backup
  createOldCatalogs: false,

  // Default namespace
  defaultNamespace: 'translation',

  // Default value for new keys (empty = must be filled manually)
  defaultValue: '',

  // Indentation for JSON files
  indentation: 2,

  // Keep existing keys that are no longer in code
  // Set to false to remove unused keys (use with caution)
  keepRemoved: true,

  // Key separator in nested keys (e.g., errors.api.generic)
  keySeparator: '.',

  // Wrap long lines
  lineEnding: 'auto',

  // Supported locales
  locales: ['en', 'de'],

  // Namespace separator
  namespaceSeparator: ':',

  // Output path for extracted keys
  // $LOCALE is replaced with the locale code
  output: 'src/lib/i18n/locales/$LOCALE.json',

  // Plural separator
  pluralSeparator: '_',

  // Input files to scan for translation keys
  input: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/api/generated/**',
  ],

  // Sort keys alphabetically
  sort: true,

  // Use key as default value for new keys (helpful for initial extraction)
  useKeysAsDefaultValue: false,

  // Verbose output
  verbose: false,

  // Fail on warnings (useful for CI)
  failOnWarnings: false,

  // Fail on update (useful for CI - fails if any changes would be made)
  failOnUpdate: false,

  // Custom lexers for parsing files
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
  },

  // Trans component configuration
  trans: {
    component: 'Trans',
    i18nKey: 'i18nKey',
    defaultsKey: 'defaults',
    extensions: ['.tsx'],
  },
};
