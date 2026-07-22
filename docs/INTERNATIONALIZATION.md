# Internationalization (i18n) Architecture

This document describes the internationalization (i18n) implementation for the CSS & JS Minifier extension.

## Overview

The extension uses **VS Code's native `vscode.l10n` API** to provide a fully internationalized user experience across 7 languages. All user-facing text is translated, including commands, configuration settings, error messages, and notifications.

> **Runtime translation (v1.3.3+)**: Every runtime message goes through the `t()` helper in [`src/utils/l10nHelper.ts`](../src/utils/l10nHelper.ts), which is now a thin one-line delegate to `vscode.l10n.t(message, ...args)` — following the [canonical VS Code l10n sample](https://github.com/microsoft/vscode-extension-samples/tree/main/l10n-sample):
>
> - The **first argument to `t()` is the English source string** (e.g. `t("File type '{0}' is not supported.", type)`), not a symbolic dotted key.
> - For non-English locales (es, fr, de, pt-br, ja, zh-cn) VS Code automatically loads the matching `bundle.l10n.<locale>.json` and returns the translated string.
> - When VS Code runs under the default English locale, no bundle is loaded and `vscode.l10n.t()` returns the source `message` argument as-is (with positional placeholders substituted). **There is intentionally no `bundle.l10n.en.json`** — English lives in the source code.
>
> Issue [#169](https://github.com/miguelcolmenares/css-js-minifier/issues/169) tracked the earlier implementation, which relied on a manually loaded English bundle and dotted keys, and effectively never called `vscode.l10n.t()` — breaking translations for every non-English user. v1.3.3 migrated all call sites to the English-as-key convention and dropped the fallback helper.
>
> The `@vscode/l10n` npm package (mentioned in older tutorials) is **only** required by extensions that spawn subprocesses — the main extension host must use `vscode.l10n` directly. See the [VS Code l10n API docs](https://code.visualstudio.com/api/references/vscode-api#l10n).

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
**Format:** JSON key-value pairs where the key is the **English source string** and the value is the localized translation (with matching positional placeholders).  
**Usage in code:** `t(englishText, ...args)` (via [`src/utils/l10nHelper.ts`](../src/utils/l10nHelper.ts))

**Example:**

```typescript
// TypeScript code
import { t } from '../utils/l10nHelper';

vscode.window.showErrorMessage(
  t("File type '{0}' is not supported. Only CSS and JavaScript files can be minified.", fileType)
);

// l10n/bundle.l10n.es.json (Spanish)
{
  "File type '{0}' is not supported. Only CSS and JavaScript files can be minified.": "El tipo de archivo '{0}' no es compatible. Solo se pueden minificar archivos CSS y JavaScript."
}
```

> Note: `l10n/bundle.l10n.json` (no locale suffix) ships as an identity map — useful only as an artifact for tooling such as `@vscode/l10n-dev export`. **There is no `bundle.l10n.en.json`**; VS Code never loads a bundle for the default English locale.

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

### Runtime Bundle Keys (12 English source strings)

Starting in v1.3.3, runtime bundle keys are the English source strings themselves. The extension currently ships translations for 12 messages:

```
"File type '{0}' is not supported. Only CSS and JavaScript files can be minified."
"Cannot minify empty {0} file. Please add some content first."
"File successfully minified and saved as: {0}"
"File successfully minified and saved as: {0} (Size reduced from {1} to {2}, {3}% reduction)"
"{0} has been successfully minified."
"{0} has been successfully minified (Size reduced from {1} to {2}, {3}% reduction)"
"Unsupported file type for minification: {0}"
"CSS minification error: {0}"
"JavaScript minification error: {0}"
"CSS & JS Minifier failed to activate: {0}. Check the Output panel for details."
"Failed to open file: {0}"
"Please save the file to disk before using 'Minify and Save as New File'. The new minified file needs an existing location to be created next to."
```

> The canonical source of truth is `l10n/bundle.l10n.json` (identity map, one entry per source string). To regenerate it from the codebase, run `npx @vscode/l10n-dev export -o ./l10n ./src`.

## Message Interpolation

Runtime messages support parameter interpolation using `{0}`, `{1}`, `{2}`, etc.

**Examples:**

```typescript
import { t } from '../utils/l10nHelper';

// Single parameter
t("File type '{0}' is not supported. Only CSS and JavaScript files can be minified.", 'html');
// Result (English): "File type 'html' is not supported. Only CSS and JavaScript files can be minified."

// Multiple parameters
t(
  'File successfully minified and saved as: {0} (Size reduced from {1} to {2}, {3}% reduction)',
  'style.min.css',
  '10.5 KB',
  '3.2 KB',
  '69.5'
);
// Result: (localized message with all four values interpolated)
```

## Implementation Details

### Source Code Integration

User-facing runtime messages live in these modules (all call sites pass an English source string as the first argument to `t()`):

**`src/utils/validators.ts`** — 2 messages (file-type + content-empty validation)

**`src/services/fileService.ts`** — 4 messages (in-place / new-file success, with and without size stats)

**`src/services/minificationService.ts`** — 1 message (unsupported file type)

**`src/services/strategies/localCssMinifier.ts`** — 1 message (CSS minification error)

**`src/services/strategies/localJsMinifier.ts`** — 1 message (JavaScript minification error)

**`src/commands/minifyCommand.ts`** — 2 messages (failed to open file, untitled document)

**`src/extension.ts`** — 1 message (activation failure)

### Import Pattern

```typescript
import { t } from '../utils/l10nHelper';
```

The helper is a one-line delegate to `vscode.l10n.t()` — import it from `./utils/l10nHelper` (adjust the relative path from your source file). Never import `@vscode/l10n` directly in extension-host code.

### Translation Pattern

```typescript
// Before (hardcoded)
vscode.window.showErrorMessage(
  `File type '${fileType}' is not supported. Only CSS and JavaScript files can be minified.`
);

// After (internationalized — English source is the key)
import { t } from '../utils/l10nHelper';

vscode.window.showErrorMessage(
  t("File type '{0}' is not supported. Only CSS and JavaScript files can be minified.", fileType)
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
# Run all i18n tests (default English locale)
npm run pretest
npx vscode-test --grep "Internationalization"

# Or use VS Code task
# Tasks: Run Task -> Test: Internationalization (i18n) Suite Only
```

### Testing Under a Specific Locale

The test runner supports launching VS Code under a specific display language via the `VSCODE_LOCALE` environment variable (wired through `.vscode-test.mjs` → `launchArgs: ['--locale', <lang>]`):

```bash
# Run the full test suite as if VS Code were set to Spanish
VSCODE_LOCALE=es npm test

# Run only i18n tests under French
VSCODE_LOCALE=fr npx vscode-test --grep "Internationalization"

# Use the built-in pseudo-locale (no language pack required)
VSCODE_LOCALE=qps-ploc npm test
```

**Requirements:**

- **`es`, `fr`, `de`, `pt-br`, `ja`, `zh-cn`**: the matching Marketplace Language Pack must be installed in the VS Code test host. Without it, VS Code silently falls back to English (`vscode.env.language === 'en'`) and the runtime bundle test in `i18n.test.ts` becomes a no-op.
- **`qps-ploc`**: VS Code ships the [Pseudo Language Pack](https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-qps-ploc) as an official extension. Once installed, all strings render with pseudo-localization markers, making i18n regressions visually obvious.

**What the runtime tests verify** (see `Runtime Localization (vscode.l10n)` suite in `src/test/i18n.test.ts`):

1. `t()` returns real text (either the English source with placeholders substituted, or the translated equivalent) — the regression guard for issue #169.
2. Placeholder interpolation (`{0}`, `{1}`, …) is preserved end-to-end.
3. `vscode.l10n.bundle` matches the shipped `bundle.l10n.<locale>.json` on disk when running under a non-English locale.
4. Every non-English bundle differs from English for at least one key (guards against accidental bundle overwrites).

### Manual Testing in VS Code

To exercise the extension in a specific language interactively:

```bash
# Launch VS Code with a specific locale (Language Pack must be installed)
code . --locale=es
code . --locale=fr
code . --locale=qps-ploc
```

Alternatively use the **Command Palette → Configure Display Language** command and restart VS Code.

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

Create `l10n/bundle.l10n.it.json`. The **key is the English source string** exactly as it appears in the `t()` call sites, and the **value is the Italian translation**. Placeholders `{0}`, `{1}`, … must be preserved in the translation:

```json
{
  "File type '{0}' is not supported. Only CSS and JavaScript files can be minified.": "Il tipo di file '{0}' non è supportato. Solo i file CSS e JavaScript possono essere minimizzati.",
  "Cannot minify empty {0} file. Please add some content first.": "Impossibile minimizzare un file {0} vuoto. Aggiungi prima del contenuto.",
  "File successfully minified and saved as: {0}": "File minimizzato con successo e salvato come: {0}",
  "File successfully minified and saved as: {0} (Size reduced from {1} to {2}, {3}% reduction)": "File minimizzato con successo e salvato come: {0} (Dimensione ridotta da {1} a {2}, riduzione {3}%)",
  "{0} has been successfully minified.": "{0} è stato minimizzato con successo.",
  "{0} has been successfully minified (Size reduced from {1} to {2}, {3}% reduction)": "{0} è stato minimizzato con successo (Dimensione ridotta da {1} a {2}, riduzione {3}%)",
  "Unsupported file type for minification: {0}": "Tipo di file non supportato per la minimizzazione: {0}",
  "CSS minification error: {0}": "Errore di minimizzazione CSS: {0}",
  "JavaScript minification error: {0}": "Errore di minimizzazione JavaScript: {0}",
  "CSS & JS Minifier failed to activate: {0}. Check the Output panel for details.": "Attivazione di CSS & JS Minifier non riuscita: {0}. Controlla il pannello Output per i dettagli.",
  "Failed to open file: {0}": "Impossibile aprire il file: {0}",
  "Please save the file to disk before using 'Minify and Save as New File'. The new minified file needs an existing location to be created next to.": "Salva il file su disco prima di usare 'Minimizza e salva come nuovo file'. Il nuovo file minimizzato ha bisogno di una posizione esistente accanto a cui essere creato."
}
```

**Critical Requirements:**

- Must contain exactly the 12 English source strings shown above as keys
- Preserve all placeholders (`{0}`, `{1}`, `{2}`, `{3}`) in the exact positions required by the message
- Maintain professional tone suitable for error messages
- Keep technical terms (CSS, JavaScript, KB) untranslated where appropriate
- Do **not** create `bundle.l10n.en.json` — English is served from the source strings themselves

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

- Crowdin (<https://crowdin.com/>)
- Lokalise (<https://lokalise.com/>)
- POEditor (<https://poeditor.com/>)

**Terminology Databases:**

- Microsoft Terminology: <https://www.microsoft.com/en-us/language>
- Apple Style Guide: <https://help.apple.com/applestyleguide/>
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

1. **Always Use `t()`**: Never hardcode user-facing strings; pass the English source text as the first argument
2. **Stable Source Strings**: Treat the English source string as the key — editing wording is a breaking change for every bundle
3. **Document Parameters**: Comment what each placeholder represents
4. **Test All Languages**: Verify translations load correctly (`VSCODE_LOCALE=es npm test`)
5. **Update All Files**: When adding messages, update every `l10n/bundle.l10n.<locale>.json`

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
- No runtime performance impact from `t()` calls (single delegate to `vscode.l10n.t`)
- Bundles are small (~2KB per language)
- VS Code caches translations efficiently

## Maintenance

### When Adding New Messages

1. Add the English source string inline at the call site: `t("New English message", ...args)`
2. Add the same English source string as a new key to every `l10n/bundle.l10n.<locale>.json` (translation on the value side)
3. Optionally run `npx @vscode/l10n-dev export -o ./l10n ./src` to regenerate `l10n/bundle.l10n.json` (identity map)
4. Run the i18n test suite to verify key consistency
5. Update this documentation if adding new categories

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

2. **Typo in `t()` Call**

   ```typescript
   // Wrong — truncated or misspelled English source
   t("File type '{0}' is unsupported", fileType)

   // Correct — must match the exact key in every bundle.l10n.<locale>.json
   t("File type '{0}' is not supported. Only CSS and JavaScript files can be minified.", fileType)
   ```

**Solution:**

- Run i18n tests to verify key consistency
- Check for typos in source code `t()` calls
- Ensure all translation files have identical keys

### Parameter Interpolation Not Working

**Symptom:** Messages show `{0}` or `{1}` instead of actual values.

**Possible Causes:**

1. **Missing Parameters in `t()` Call**

   ```typescript
   // Wrong — missing parameter
   t("File type '{0}' is not supported. Only CSS and JavaScript files can be minified.");

   // Correct — includes parameter
   t("File type '{0}' is not supported. Only CSS and JavaScript files can be minified.", fileType);
   ```

2. **Parameter Order Mismatch**

   ```typescript
   // Source: "File {0} is too large: {1}MB"

   // Wrong — reversed parameters
   t('File {0} is too large: {1}MB', sizeMB, fileName);

   // Correct — matches placeholder order
   t('File {0} is too large: {1}MB', fileName, sizeMB);
   ```

**Solution:**

- Always pass required parameters to `t()`
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
| `Cannot find module '@vscode/l10n'` | You should not import `@vscode/l10n` in extension-host code | Use `import { t } from '../utils/l10nHelper';` instead |
| `vscode.l10n.t is not a function` | VS Code version too old | Require `engines.vscode >= 1.73.0` in package.json |
| `Translation key not found` | Key doesn't exist in bundle | Check key spelling and bundle file |
| `Unexpected token in JSON` | Syntax error in .nls file | Validate JSON with `jq` or online validator |
| `Encoding error` | Non-UTF-8 characters | Save files with UTF-8 encoding |

## Support

For translation issues or requests for additional languages:

- Open an issue on [GitHub](https://github.com/miguelcolmenares/css-js-minifier/issues)
- Tag with `i18n` label
- Provide language code and any specific translation concerns
