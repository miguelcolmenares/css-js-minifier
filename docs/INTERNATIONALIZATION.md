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

To add support for a new language, follow these detailed steps:

### Step-by-Step Guide: Adding Italian (it) Support

#### Step 1: Create Package Translation File

Create `package.nls.it.json` in the root directory with all 13 keys:

```json
{
  "commands.extension.minify.title": "Minimizza questo file",
  "commands.extension.minifyInNewFile.title": "Minimizza e salva come nuovo file",
  "configuration.title": "Configurazione dello strumento di minimizzazione JS e CSS",
  "configuration.minifyOnSave": "Minimizza automaticamente i file al salvataggio",
  "configuration.minifyInNewFile": "Salva il contenuto minimizzato in un nuovo file",
  "configuration.minifiedNewFilePrefix": "Prefisso per il nuovo file minimizzato. L'estensione sarà la stessa del file originale. Si applica solo quando si salva contenuto minimizzato in un nuovo file.",
  "configuration.minifiedNewFilePrefix.enumDescriptions.1": "Il nome del nuovo file avrà l'estensione '.min'.",
  "configuration.minifiedNewFilePrefix.enumDescriptions.2": "Il nome del nuovo file avrà l'estensione '-min'.",
  "configuration.minifiedNewFilePrefix.enumDescriptions.3": "Il nome del nuovo file avrà l'estensione '.compressed'.",
  "configuration.minifiedNewFilePrefix.enumDescriptions.4": "Il nome del nuovo file avrà l'estensione '-compressed'.",
  "configuration.minifiedNewFilePrefix.enumDescriptions.5": "Il nome del nuovo file avrà l'estensione '.minified'.",
  "configuration.minifiedNewFilePrefix.enumDescriptions.6": "Il nome del nuovo file avrà l'estensione '-minified'.",
  "configuration.autoOpenNewFile": "Apri automaticamente i file minimizzati appena creati nell'editor."
}
```

**Key Points:**
- Must have exactly 13 keys (same as other languages)
- Keys must match exactly (case-sensitive)
- Use native language translations
- Preserve technical terms in their standard form

#### Step 2: Create Runtime Bundle File

Create `l10n/bundle.l10n.it.json` with all 17 runtime message keys:

```json
{
  "validators.fileType.unsupported": "Il tipo di file '{0}' non è supportato. Solo i file CSS e JavaScript possono essere minimizzati.",
  "validators.content.empty": "Impossibile minimizzare un file {0} vuoto. Aggiungi prima del contenuto.",
  "fileService.newFile.success": "File minimizzato con successo e salvato come: {0}",
  "fileService.inPlace.success": "{0} è stato minimizzato con successo.",
  "minificationService.fileType.unsupported": "Tipo di file non supportato per la minimizzazione: {0}",
  "minificationService.fileSize.tooLarge": "File troppo grande: {0}MB. La dimensione massima consentita è 5MB. Riduci la dimensione del file e riprova.",
  "minificationService.error.missingInput": "Parametro di input mancante. Assicurati che il file abbia del contenuto.",
  "minificationService.error.invalidMethod": "Metodo di richiesta non valido. Questo è un errore interno, riprova.",
  "minificationService.error.invalidContentType": "Tipo di contenuto non valido. Questo è un errore interno, riprova.",
  "minificationService.error.fileTooLarge": "File troppo grande. La dimensione massima consentita è 5MB. Riduci la dimensione del file.",
  "minificationService.error.invalidSyntax": "Sintassi {0} non valida. Controlla il codice per errori di sintassi.",
  "minificationService.error.rateLimitExceeded": "Troppe richieste. Il limite API è 30 richieste al minuto. Attendi e riprova.",
  "minificationService.error.apiError": "Errore API {0} ({1}): {2}",
  "minificationService.error.invalidResponse": "Formato di risposta non valido dall'API di minimizzazione",
  "minificationService.error.timeout": "Timeout di minimizzazione: Il servizio {0} sta impiegando più tempo del previsto. Controlla la connessione Internet e riprova.",
  "minificationService.error.network": "Errore di rete: Impossibile connettersi al servizio di minimizzazione. Controlla la connessione Internet e riprova.",
  "minificationService.error.generic": "Impossibile minimizzare il file {0}: {1}"
}
```

**Critical Requirements:**
- Must have exactly 17 keys
- Preserve all placeholders: `{0}`, `{1}`, `{2}` in correct positions
- Maintain professional tone suitable for error messages
- Keep technical terms (CSS, JavaScript, API, MB) untranslated

#### Step 3: Update Test Constants

Edit `src/test/i18n.test.ts` to include the new language:

```typescript
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', file: 'package.nls.json' },
  { code: 'es', name: 'Spanish', file: 'package.nls.es.json' },
  { code: 'fr', name: 'French', file: 'package.nls.fr.json' },
  { code: 'de', name: 'German', file: 'package.nls.de.json' },
  { code: 'pt-br', name: 'Brazilian Portuguese', file: 'package.nls.pt-br.json' },
  { code: 'ja', name: 'Japanese', file: 'package.nls.ja.json' },
  { code: 'zh-cn', name: 'Chinese Simplified', file: 'package.nls.zh-cn.json' },
  { code: 'it', name: 'Italian', file: 'package.nls.it.json' }  // New language
];

const RUNTIME_BUNDLES = [
  { code: 'en', name: 'English', file: 'bundle.l10n.json' },
  { code: 'es', name: 'Spanish', file: 'bundle.l10n.es.json' },
  { code: 'fr', name: 'French', file: 'bundle.l10n.fr.json' },
  { code: 'de', name: 'German', file: 'bundle.l10n.de.json' },
  { code: 'pt-br', name: 'Brazilian Portuguese', file: 'bundle.l10n.pt-br.json' },
  { code: 'ja', name: 'Japanese', file: 'bundle.l10n.ja.json' },
  { code: 'zh-cn', name: 'Chinese Simplified', file: 'bundle.l10n.zh-cn.json' },
  { code: 'it', name: 'Italian', file: 'bundle.l10n.it.json' }  // New language
];
```

#### Step 4: Validate Translation Files

Run comprehensive validation:

```bash
# 1. Verify JSON syntax
jq empty package.nls.it.json
jq empty l10n/bundle.l10n.it.json

# 2. Count keys (should be 13 and 17)
echo "Package keys: $(jq 'keys | length' package.nls.it.json)"
echo "Runtime keys: $(jq 'keys | length' l10n/bundle.l10n.it.json)"

# 3. Compare keys with English (should have no differences)
diff <(jq -r 'keys[]' package.nls.json | sort) \
     <(jq -r 'keys[]' package.nls.it.json | sort)

diff <(jq -r 'keys[]' l10n/bundle.l10n.json | sort) \
     <(jq -r 'keys[]' l10n/bundle.l10n.it.json | sort)

# 4. Verify placeholder preservation
grep -E '\{[0-9]\}' l10n/bundle.l10n.it.json
```

#### Step 5: Run i18n Test Suite

```bash
# Compile tests
npm run compile-tests

# Run i18n tests
npx vscode-test --grep "Internationalization"
```

**Expected Results:**
- ✅ All language files exist
- ✅ All language files are valid JSON
- ✅ All language files have the same keys
- ✅ All expected keys exist
- ✅ All values are non-empty strings
- ✅ Placeholders are preserved

#### Step 6: Manual Testing in VS Code

1. **Install Italian Language Pack:**
   - Open Command Palette (Ctrl/Cmd+Shift+P)
   - Type "Configure Display Language"
   - Select "Install additional languages"
   - Install "Italian Language Pack"

2. **Change VS Code Language:**
   - Command Palette → "Configure Display Language"
   - Select "Italiano (Italian)"
   - Restart VS Code

3. **Test Extension:**
   - Open a CSS or JS file
   - Try minifying (should see Italian messages)
   - Try with invalid file type (should see Italian error)
   - Check settings (should see Italian descriptions)

#### Step 7: Update Documentation

Update the language support table in:
- `README.md` - Add Italian flag and name
- `docs/INTERNATIONALIZATION.md` - Add to supported languages table
- `.github/copilot-instructions.md` - Add to language list

#### Step 8: Update CHANGELOG

```markdown
### Added
- 🇮🇹 Italian (it) language support
  - Complete package.nls.it.json with 13 translations
  - Complete l10n/bundle.l10n.it.json with 17 runtime messages
```

### Quick Reference for Common Languages

| Language | Code | Locale | Users |
|----------|------|--------|-------|
| Italian | it | it | ~2M developers |
| Korean | ko | ko | ~3M developers |
| Russian | ru | ru | ~5M developers |
| Polish | pl | pl | ~500K developers |
| Dutch | nl | nl | ~500K developers |
| Turkish | tr | tr | ~500K developers |

### Translation Resources

**Professional Translation Services:**
- Crowdin (https://crowdin.com/)
- Lokalise (https://lokalise.com/)
- POEditor (https://poeditor.com/)

**Terminology Databases:**
- Microsoft Terminology: https://www.microsoft.com/en-us/language
- Apple Style Guide: https://help.apple.com/applestyleguide/
- Google Developer Documentation Style Guide

**Community Translation:**
- Request translations in GitHub issues
- Accept pull requests from native speakers
- Use VS Code's built-in language packs as reference

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

### Migration Guide for Translation Updates

When updating or modifying existing translations:

#### Step 1: Identify Changed Messages
```bash
# Compare translation keys between versions
git diff v1.0.0..HEAD -- package.nls.json l10n/bundle.l10n.json
```

#### Step 2: Update All Language Files
For each changed key:
1. Update English translation first as the reference
2. Update all other language files (es, fr, de, pt-br, ja, zh-cn)
3. Preserve parameter placeholders ({0}, {1}, etc.)
4. Maintain consistent terminology

#### Step 3: Verify Changes
```bash
# Run i18n test suite
npm run compile-tests
npx vscode-test --grep "Internationalization"

# Verify all languages have same keys
for file in package.nls*.json; do 
  echo "$file: $(cat $file | jq 'keys | length')"
done
```

#### Step 4: Test in VS Code
1. Change VS Code display language to each supported language
2. Test all commands and error scenarios
3. Verify messages display correctly with proper formatting
4. Check that parameter interpolation works

#### Example Migration

**Before (v1.0.0):**
```json
// l10n/bundle.l10n.json
{
  "validators.fileType.unsupported": "File type '{0}' is not supported."
}
```

**After (v1.1.0):**
```json
// l10n/bundle.l10n.json
{
  "validators.fileType.unsupported": "File type '{0}' is not supported. Only CSS and JavaScript files can be minified."
}
```

**Migration checklist:**
- [ ] Update English bundle.l10n.json
- [ ] Update all 6 other language bundles
- [ ] Run i18n tests
- [ ] Test with each language in VS Code

## Resources

- [VS Code Localization API](https://code.visualstudio.com/api/references/vscode-api#l10n)
- [@vscode/l10n Package](https://www.npmjs.com/package/@vscode/l10n)
- [VS Code Language Packs](https://code.visualstudio.com/docs/getstarted/locales)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

## Troubleshooting

### Messages Appear in English Instead of Expected Language

**Symptom:** Extension shows English messages even though VS Code is set to another language.

**Possible Causes:**
1. **Missing Translation File**
   ```bash
   # Verify all translation files exist
   ls -1 package.nls*.json l10n/bundle.l10n*.json
   ```
   
2. **Invalid JSON in Translation File**
   ```bash
   # Validate JSON syntax for each language
   for file in package.nls*.json l10n/bundle.l10n*.json; do
     echo "Checking $file..."
     jq empty "$file" 2>&1 || echo "ERROR in $file"
   done
   ```

3. **VS Code Language Pack Not Installed**
   - Open Command Palette (Ctrl/Cmd+Shift+P)
   - Type "Configure Display Language"
   - Install the language pack if prompted
   - Restart VS Code

4. **Locale Code Mismatch**
   - VS Code uses specific locale codes (e.g., `pt-br`, not `pt`)
   - Check VS Code's locale: Help → About → Copy locale info
   - Ensure translation file matches exact locale code

**Solution:**
```bash
# Run i18n test suite to identify issues
npm run compile-tests
npx vscode-test --grep "Internationalization"
```

### Translation Keys Not Found

**Symptom:** Extension crashes or shows `[Missing translation]` errors.

**Possible Causes:**
1. **Key Mismatch Between Files**
   ```bash
   # Compare keys across all languages
   diff <(jq -r 'keys[]' package.nls.json | sort) \
        <(jq -r 'keys[]' package.nls.es.json | sort)
   ```

2. **Typo in l10n.t() Call**
   ```typescript
   // Wrong
   l10n.t('validators.fileType.unsupported')
   
   // Correct (must match key in bundle.l10n.json)
   l10n.t('validators.fileType.unsupported', fileType)
   ```

**Solution:**
- Run i18n tests to verify key consistency
- Check for typos in source code l10n.t() calls
- Ensure all translation files have identical keys

### Parameter Interpolation Not Working

**Symptom:** Messages show `{0}` or `{1}` instead of actual values.

**Possible Causes:**
1. **Missing Parameters in l10n.t() Call**
   ```typescript
   // Wrong - missing parameter
   l10n.t('validators.fileType.unsupported')
   
   // Correct - includes parameter
   l10n.t('validators.fileType.unsupported', fileType)
   ```

2. **Parameter Order Mismatch**
   ```typescript
   // Translation: "File {0} is too large: {1}MB"
   
   // Wrong - reversed parameters
   l10n.t('error.fileTooLarge', sizeMB, fileName)
   
   // Correct - matches placeholder order
   l10n.t('error.fileTooLarge', fileName, sizeMB)
   ```

**Solution:**
- Always pass required parameters to l10n.t()
- Ensure parameter order matches placeholders in translation
- Test with actual values, not just in development

### Extension Won't Load After Adding Translations

**Symptom:** Extension fails to activate or VS Code shows error.

**Possible Causes:**
1. **Syntax Error in JSON Files**
   - Missing commas between entries
   - Unescaped quotes in translations
   - Trailing commas in JSON

2. **Invalid UTF-8 Encoding**
   - Ensure all translation files use UTF-8 encoding
   - Special characters must be properly encoded

**Solution:**
```bash
# Validate all JSON files
npm run lint

# Check file encoding
file -i package.nls*.json l10n/bundle.l10n*.json

# Re-compile and test
npm run compile
npm run pretest
```

### Translation Quality Issues

**Symptom:** Translations are technically correct but sound unnatural or confusing.

**Common Issues:**
1. **Literal Translation**: Translated word-by-word without considering context
2. **Missing Cultural Context**: Technical terms that don't translate directly
3. **Inconsistent Terminology**: Same concept translated differently across messages

**Best Practices:**
- Use professional translators familiar with technical content
- Maintain a glossary of technical terms for consistency
- Have native speakers review translations for natural phrasing
- Consider regional differences (e.g., European vs. Latin American Spanish)

**Resources for Quality Translations:**
- Microsoft Terminology Database
- Apple Localization Guidelines
- Google Developer Style Guides

### Webpack Bundle Missing Translation Files

**Symptom:** Extension works in development but not after packaging.

**Possible Causes:**
- Translation files not included in webpack config
- `.vscodeignore` excluding translation files

**Solution:**
```javascript
// webpack.config.cjs - ensure l10n is included
module.exports = {
  // ...
  resolve: {
    extensions: ['.ts', '.js', '.json']
  }
};
```

Verify `.vscodeignore` doesn't exclude translation files:
```bash
# Check what will be packaged
vsce ls
```

### Performance Issues After Adding i18n

**Symptom:** Extension activation is slower after adding translations.

**Analysis:**
- Translation files are loaded once at activation
- Each bundle is ~2KB, total ~14KB for all languages
- This should have negligible impact (<50ms)

**If Performance Degrades:**
1. **Check Bundle Sizes**
   ```bash
   du -h l10n/*.json package.nls*.json
   ```

2. **Profile Extension Loading**
   - Open Developer Tools: Help → Toggle Developer Tools
   - Go to Performance tab
   - Record extension activation
   - Look for l10n-related bottlenecks

3. **Verify Webpack Configuration**
   ```bash
   # Check bundle size
   npm run package
   ls -lh *.vsix
   ```

**Solution:**
- Ensure webpack is properly minifying translations
- Verify l10n package is using VS Code's cached translations
- Consider lazy loading for rare languages (advanced)

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module '@vscode/l10n'` | Package not installed | Run `npm install` |
| `l10n.t is not a function` | Missing import statement | Add `import * as l10n from '@vscode/l10n';` |
| `Translation key not found` | Key doesn't exist in bundle | Check key spelling and bundle file |
| `Unexpected token in JSON` | Syntax error in .nls file | Validate JSON with `jq` or online validator |
| `Encoding error` | Non-UTF-8 characters | Save files with UTF-8 encoding |

## Support

For translation issues or requests for additional languages:
- Open an issue on [GitHub](https://github.com/miguelcolmenares/css-js-minifier/issues)
- Tag with `i18n` label
- Provide language code and any specific translation concerns
