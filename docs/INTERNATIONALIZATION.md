# Internationalization (i18n) Architecture

This document describes the internationalization (i18n) implementation for the CSS & JS Minifier extension.

## Overview

The extension uses VS Code's native localization system to provide a fully internationalized user experience across 7 languages. All user-facing text is translated, including commands, configuration settings, error messages, and notifications.

## Supported Languages

The extension currently supports:

| Language | Code | Package File | Runtime Bundle |
|----------|------|--------------|----------------|
| English (Default) | en | `package.nls.json` | `l10n/bundle.l10n.json` |
| Spanish | es | `package.nls.es.json` | `l10n/bundle.l10n.es.json` |
| French | fr | `package.nls.fr.json` | `l10n/bundle.l10n.fr.json` |
| German | de | `package.nls.de.json` | `l10n/bundle.l10n.de.json` |
| Portuguese (Brazil) | pt-br | `package.nls.pt-br.json` | `l10n/bundle.l10n.pt-br.json` |
| Japanese | ja | `package.nls.ja.json` | `l10n/bundle.l10n.ja.json` |
| Chinese Simplified | zh-cn | `package.nls.zh-cn.json` | `l10n/bundle.l10n.zh-cn.json` |

## Architecture

### Two-Layer Translation System

The extension uses two separate translation systems:

#### 1. Package-Level Translations (`package.nls.*.json`)

Used for static contributions in `package.json`:
- Command titles
- Configuration section titles
- Configuration setting descriptions
- Enum option descriptions

**File Location:** Root directory  
**Format:** JSON key-value pairs  
**Usage in package.json:** `%key%` syntax

**Example:**
```json
// package.json
{
  "contributes": {
    "commands": [{
      "command": "extension.minify",
      "title": "%commands.extension.minify.title%"
    }]
  }
}

// package.nls.json (English)
{
  "commands.extension.minify.title": "Minify this File"
}

// package.nls.es.json (Spanish)
{
  "commands.extension.minify.title": "Minificar este archivo"
}
```

#### 2. Runtime Message Bundles (`l10n/bundle.l10n.*.json`)

Used for dynamic messages in TypeScript code:
- Error messages
- Success notifications
- Validation messages
- User feedback

**File Location:** `l10n/` directory  
**Format:** JSON key-value pairs with placeholder support  
**Usage in code:** `l10n.t('key', ...args)`

**Example:**
```typescript
// TypeScript code
import * as l10n from '@vscode/l10n';

vscode.window.showErrorMessage(
  l10n.t('validators.fileType.unsupported', fileType)
);

// l10n/bundle.l10n.json (English)
{
  "validators.fileType.unsupported": "File type '{0}' is not supported. Only CSS and JavaScript files can be minified."
}

// l10n/bundle.l10n.es.json (Spanish)
{
  "validators.fileType.unsupported": "El tipo de archivo '{0}' no es compatible. Solo se pueden minificar archivos CSS y JavaScript."
}
```

## Translation Keys Structure

### Package.nls Keys (13 keys)

```
commands.extension.minify.title
commands.extension.minifyInNewFile.title
configuration.title
configuration.minifyOnSave
configuration.minifyInNewFile
configuration.minifiedNewFilePrefix
configuration.minifiedNewFilePrefix.enumDescriptions.1
configuration.minifiedNewFilePrefix.enumDescriptions.2
configuration.minifiedNewFilePrefix.enumDescriptions.3
configuration.minifiedNewFilePrefix.enumDescriptions.4
configuration.minifiedNewFilePrefix.enumDescriptions.5
configuration.minifiedNewFilePrefix.enumDescriptions.6
configuration.autoOpenNewFile
```

### Runtime Bundle Keys (17 keys)

```
validators.fileType.unsupported
validators.content.empty
fileService.newFile.success
fileService.inPlace.success
minificationService.fileType.unsupported
minificationService.fileSize.tooLarge
minificationService.error.missingInput
minificationService.error.invalidMethod
minificationService.error.invalidContentType
minificationService.error.fileTooLarge
minificationService.error.invalidSyntax
minificationService.error.rateLimitExceeded
minificationService.error.apiError
minificationService.error.invalidResponse
minificationService.error.timeout
minificationService.error.network
minificationService.error.generic
```

## Message Interpolation

Runtime messages support parameter interpolation using `{0}`, `{1}`, `{2}`, etc.

**Examples:**

```typescript
// Single parameter
l10n.t('validators.fileType.unsupported', 'html')
// Result: "File type 'html' is not supported..."

// Multiple parameters
l10n.t('minificationService.error.apiError', 'CSS Minifier', '429', 'Too Many Requests')
// Result: "CSS Minifier API error (429): Too Many Requests"
```

## Implementation Details

### Source Code Integration

Three main modules were updated to use l10n:

**`src/utils/validators.ts`**
- 2 messages internationalized
- File type validation errors
- Content length validation errors

**`src/services/fileService.ts`**
- 2 messages internationalized
- Success notifications for file operations

**`src/services/minificationService.ts`**
- 13 messages internationalized
- API error messages
- Network error messages
- Validation error messages

### Import Pattern

```typescript
import * as l10n from "@vscode/l10n";
```

### Translation Pattern

```typescript
// Before (hardcoded)
vscode.window.showErrorMessage(
  `File type '${fileType}' is not supported. Only CSS and JavaScript files can be minified.`
);

// After (internationalized)
vscode.window.showErrorMessage(
  l10n.t('validators.fileType.unsupported', fileType)
);
```

## Testing

### Automated i18n Tests

The extension includes comprehensive i18n tests in `src/test/i18n.test.ts`:

**Test Coverage:**
1. **File Existence**: Verify all translation files exist
2. **JSON Validity**: Ensure all files are valid JSON
3. **Key Consistency**: All languages have the same keys
4. **Value Completeness**: No empty or missing translations
5. **Placeholder Preservation**: Translations maintain {0}, {1}, etc.
6. **VS Code Integration**: Commands and config use i18n keys
7. **Translation Quality**: No untranslated English text in other languages

**Running i18n Tests:**
```bash
# Run all i18n tests
npm run pretest
npx vscode-test --grep "Internationalization"

# Or use VS Code task
# Tasks: Run Task -> Test: Internationalization (i18n) Suite Only
```

## Adding a New Language

To add support for a new language:

### 1. Create Package Translation File

Create `package.nls.{locale}.json` in the root directory:

```json
{
  "commands.extension.minify.title": "...",
  "commands.extension.minifyInNewFile.title": "...",
  // ... (13 total keys)
}
```

### 2. Create Runtime Bundle File

Create `l10n/bundle.l10n.{locale}.json`:

```json
{
  "validators.fileType.unsupported": "...",
  "validators.content.empty": "...",
  // ... (17 total keys)
}
```

### 3. Update Language Constants

Add the new language to test files:

**`src/test/i18n.test.ts`:**
```typescript
const SUPPORTED_LANGUAGES = [
  // ... existing languages
  { code: 'xx', name: 'New Language', file: 'package.nls.xx.json' }
];

const RUNTIME_BUNDLES = [
  // ... existing languages
  { code: 'xx', name: 'New Language', file: 'bundle.l10n.xx.json' }
];
```

### 4. Verify Translation Quality

- Ensure all placeholders ({0}, {1}) are preserved
- Maintain consistent terminology across all keys
- Test in VS Code with the target language selected

## Best Practices

### For Translators

1. **Preserve Placeholders**: Always keep {0}, {1}, etc. in the same order
2. **Context Awareness**: Understand the context where the message appears
3. **Consistent Terminology**: Use consistent terms for "minify", "file", "error", etc.
4. **Character Limits**: Consider UI space constraints for menu items
5. **Professional Tone**: Maintain a professional, helpful tone in error messages

### For Developers

1. **Always Use l10n.t()**: Never hardcode user-facing strings
2. **Descriptive Keys**: Use clear, hierarchical key names
3. **Document Parameters**: Comment what each placeholder represents
4. **Test All Languages**: Verify translations load correctly
5. **Update All Files**: When adding keys, update all language files

## Language Selection

VS Code automatically selects the appropriate language based on:
1. User's VS Code display language setting (`locale`)
2. System locale if VS Code language not explicitly set
3. Falls back to English if no matching translation exists

Users can change their VS Code language:
1. Open Command Palette (Ctrl/Cmd+Shift+P)
2. Type "Configure Display Language"
3. Select desired language
4. Restart VS Code

## Performance Considerations

- Translation files are loaded once at extension activation
- No runtime performance impact from l10n.t() calls
- Bundles are small (~2KB per language)
- VS Code caches translations efficiently

## Maintenance

### When Adding New Messages

1. Add key to English files first (`package.nls.json` and `l10n/bundle.l10n.json`)
2. Update all other language files with translations
3. Run i18n tests to verify consistency
4. Update this documentation if adding new categories

### Translation Updates

- Review translations when updating VS Code API messages
- Monitor user feedback for translation quality issues
- Consider professional translation services for new languages

## Resources

- [VS Code Localization API](https://code.visualstudio.com/api/references/vscode-api#l10n)
- [@vscode/l10n Package](https://www.npmjs.com/package/@vscode/l10n)
- [VS Code Language Packs](https://code.visualstudio.com/docs/getstarted/locales)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

## Support

For translation issues or requests for additional languages:
- Open an issue on [GitHub](https://github.com/miguelcolmenares/css-js-minifier/issues)
- Tag with `i18n` label
- Provide language code and any specific translation concerns
