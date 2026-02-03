# Internationalization (i18n)

This project uses [i18next](https://www.i18next.com/) for internationalization with [react-i18next](https://react.i18next.com/) bindings.

## Supported Languages

| Code | Language | Status |
|------|----------|--------|
| `en` | English  | Reference (source of truth) |
| `de` | German   | Complete |

## File Structure

```
src/lib/i18n/
├── config.ts           # i18next configuration
├── README.md           # This file
└── locales/
    ├── en.json         # English translations (reference)
    └── de.json         # German translations
```

## Key Naming Conventions

### General Rules

1. **Use dot notation** for nested keys: `section.subsection.key`
2. **Use camelCase** for key names: `cafeCard.addToFavorites`
3. **Keep keys semantic**: Describe the content, not the location
4. **Group by feature/section**: All keys for a component should share a prefix

### Key Structure

```
{section}.{subsection}.{key}
```

Examples:
- `header.login` - Header navigation login button
- `errors.api.serverError` - API error message for server errors
- `cafeDetail.hours` - Cafe detail page hours section

### Naming Patterns

| Pattern | Example | Usage |
|---------|---------|-------|
| `{page}.*` | `hero.title` | Page-specific content |
| `{component}.*` | `cafeCard.rating` | Reusable component text |
| `common.*` | `common.loading` | Shared across multiple components |
| `errors.*` | `errors.api.generic` | Error messages |
| `validation.*` | `validation.required` | Form validation messages |

### Pluralization

Use i18next's pluralization with `_one` and `_other` suffixes:

```json
{
  "locationCount_one": "{{count}} location",
  "locationCount_other": "{{count}} locations"
}
```

### Interpolation

Use double curly braces for variables:

```json
{
  "greeting": "Hello, {{name}}!"
}
```

## Usage in Code

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t('hero.title')}</h1>;
}
```

### With Variables

```tsx
{t('greeting', { name: user.name })}
```

### With Pluralization

```tsx
{t('locationCount', { count: locations.length })}
```

## Adding New Translations

### 1. Add to English First

English (`en.json`) is the reference locale. Always add new keys here first:

```json
{
  "myFeature": {
    "title": "My Feature Title",
    "description": "Description of my feature"
  }
}
```

### 2. Add to Other Locales

Add the same keys to all other locale files (`de.json`, etc.):

```json
{
  "myFeature": {
    "title": "Mein Feature-Titel",
    "description": "Beschreibung meines Features"
  }
}
```

### 3. Validate Translations

Run the validation script to ensure all locales are in sync:

```bash
npm run i18n:check
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run i18n:check` | Validate all translations are in sync |
| `npm run i18n:extract` | Extract keys from code (use with caution) |

## CI/CD Integration

The `i18n:check` script runs in CI and will fail the build if:
- Any locale is missing keys that exist in the reference locale (English)
- This ensures translations are never deployed incomplete

## Best Practices

1. **Never hardcode user-facing text** - Always use `t('key')`
2. **Keep translations short** - Long text is harder to maintain
3. **Avoid HTML in translations** - Use the `Trans` component if needed
4. **Test in both languages** - Check that translated text fits the UI
5. **Use context** - If a word has multiple meanings, add context:
   ```json
   {
     "save_action": "Save",      // Button action
     "save_noun": "Save"         // As in "savings"
   }
   ```

## Troubleshooting

### Missing Translation Key

If you see a key displayed instead of text (e.g., `errors.api.generic`):

1. Check if the key exists in `en.json`
2. Run `npm run i18n:check` to find missing keys
3. Add the missing key to all locale files

### Translation Not Updating

1. Check that you're using the correct key
2. Verify the JSON syntax is valid (no trailing commas)
3. Restart the dev server if needed

### Adding a New Language

1. Create a new file: `locales/{code}.json`
2. Copy the structure from `en.json`
3. Add the locale code to:
   - `i18next-parser.config.js` (LOCALES array)
   - `scripts/check-i18n.js` (LOCALES array)
   - `config.ts` (resources object)

## Architecture Decision: Namespace Splitting

**Decision: Single namespace (deferred splitting)**

### Current State
- ~776 lines / 592 keys per locale file
- 31 logical top-level sections
- Largest: `amenities` (74 keys), `cafeDetail` (43 keys)

### Why We Chose Single Namespace

| Factor | Assessment |
|--------|------------|
| File size | Manageable (< 1000 lines) |
| Organization | Already well-structured with 31 sections |
| Team size | Small team, single-file is simpler |
| Lazy loading | Not needed - app loads all translations upfront |
| Maintenance | Validation script works well with single files |

### When to Reconsider

Consider splitting namespaces if:
- Locale files exceed 2000 lines
- Multiple teams work on different features
- Lazy-loading becomes necessary for performance
- Significantly more languages are added

### Potential Split Structure (for future)

```
locales/
├── en/
│   ├── common.json      # common, errors
│   ├── auth.json        # auth, forms, account
│   ├── cafe.json        # cafeCard, cafeDetail, amenities
│   └── pages.json       # hero, about, explore, etc.
└── de/
    └── ...
```
