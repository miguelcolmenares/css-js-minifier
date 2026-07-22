# Testing Guide

## Test Strategy Overview

The CSS & JS Minifier extension uses VS Code's extension testing framework with Mocha. The current test suite covers **58 tests** across three files, spanning activation, main functionality, and internationalization. Both CSS and JS minification are fully local (LightningCSS + oxc-minify) so tests run fast with no network dependency or rate-limiting concerns.

## Test Structure

### Test Files (`src/test/`)

| File | Tests | Focus |
|---|---|---|
| `activation.test.ts` | 5 | Regression guard for [#168](https://github.com/miguelcolmenares/css-js-minifier/issues/168): asserts `activationEvents` in `package.json` contains `onLanguage:css` and `onLanguage:javascript`, and that the deprecated `onCommand:*` / invalid `onSaveTextDocument` entries are not re-added. |
| `extension.test.ts` | 31 | Main functionality: CSS/JS minification (in-place + new file), file-prefix configurations, explorer context menu, empty file / unsupported file type validation, configuration behaviors (`autoOpenNewFile`, `minifyInNewFile`, `minifiedNewFilePrefix`, `showSizeReduction`), CSS nth-child selectors, and keybinding smoke tests. |
| `i18n.test.ts` | 22 | Two nested suites: (a) static bundle validation — file existence, JSON validity, key parity across all seven languages, placeholder preservation; and (b) **Runtime Localization (`vscode.l10n`)** — regression guard for [#169](https://github.com/miguelcolmenares/css-js-minifier/issues/169): asserts `t()` returns real interpolated text (never a raw key), placeholder interpolation is preserved end-to-end, `vscode.l10n.bundle` matches the shipped `bundle.l10n.<locale>.json` when running under a non-English locale, and every non-English bundle differs from English for at least one key. |

Total: **58 tests**.

## File Management & Test Isolation

### Temporary File Strategy

Configuration tests use temporary files to avoid modifying source fixtures:

```typescript
const sourceFile = path.join(__dirname, "..", "..", "src", "test", "fixtures", "test.css");
const testFile = path.join(__dirname, "fixtures", "temp-test.css");
fs.copyFileSync(sourceFile, testFile);
```

### Comprehensive Cleanup Strategy

Each test suite includes cleanup in `beforeAll` hooks:

- Reset all configurations to defaults
- Remove generated minified files (`.min`, `.compressed`, etc.)
- Restore original fixture files from source

### Sinon Spy Management

```typescript
this.afterEach(function () {
  sinon.restore();
});
```

## Running Tests

### VS Code Tasks (Recommended)

Access via `Ctrl/Cmd + Shift + P` → "Tasks: Run Task":

| Task | Focus |
|---|---|
| Test: Run All Tests | Full 58-test suite (compile + lint + all suites) |
| Test: Configuration Suite Only | `Configuration Test Suite` in `extension.test.ts` |
| Test: Main Functionality Suite Only | `JS & CSS Minifier Test Suite` in `extension.test.ts` |
| Test: CSS nth-child Suite Only | `CSS nth-child Test Suite` in `extension.test.ts` |
| Test: Keybinding Suite Only | `Keybinding Test Suite` in `extension.test.ts` |
| Test: Internationalization (i18n) Suite Only | Both static + runtime suites in `i18n.test.ts` |
| Test: Specific Test by Name | Prompts for a `--grep` pattern and runs matching tests |
| Test: Compile and Build Only | `npm run pretest` (compile + lint + copy fixtures, no test run) |
| Test: Quick Compile and Test | `npm run compile-tests` (TS only, no webpack, no lint) |

### Command Line

```bash
# Complete test suite (compile + lint + all tests)
npm test

# Individual suites (grep-based)
npx vscode-test --grep "Configuration Test Suite"
npx vscode-test --grep "JS & CSS Minifier Test Suite"
npx vscode-test --grep "CSS nth-child Test Suite"
npx vscode-test --grep "Keybinding Test Suite"
npx vscode-test --grep "Internationalization"
npx vscode-test --grep "Activation Events"
npx vscode-test --grep "Runtime Localization"

# Specific test
npx vscode-test --grep "autoOpenNewFile setting - enabled"

# Under a specific display locale (VS Code Language Pack must be installed)
VSCODE_LOCALE=es npm test
VSCODE_LOCALE=fr npx vscode-test --grep "Internationalization"
VSCODE_LOCALE=qps-ploc npm test  # pseudo-locale, no pack needed

# Build only (no tests)
npm run pretest
```

See [`docs/INTERNATIONALIZATION.md#testing-under-a-specific-locale`](INTERNATIONALIZATION.md#testing-under-a-specific-locale) for the runtime localization test wiring.

### Development Workflow

**Feature Development:**

1. Start watch mode: "tasks: watch-tests"
2. Run the relevant suite for your change (e.g. `Test: Configuration Suite Only`).
3. Run the full suite before commit: `Test: Run All Tests`.

**Bug Fixing:**

1. Identify failing suite via `Test: Run All Tests`.
2. Focus on the specific suite.
3. Target a single test via `Test: Specific Test by Name`.

## Test Data Management

### Expected Minification Results

```typescript
// CSS (LightningCSS output)
const cssMinifiedContent = "p{color:red}";

// JavaScript (oxc-minify output)
const jsMinifiedContent = 'function test(){for(var e=`Hello, World!`,t=``,n=0;n<e.length;n++)t+=String.fromCharCode(e.charCodeAt(n)+1);return t}';
```

### Test File Organization

```
src/test/
├── activation.test.ts     # Activation Events regression guard (#168)
├── extension.test.ts      # Main test suite (31 tests)
├── i18n.test.ts           # Static + runtime i18n suites (22 tests)
└── fixtures/
    ├── test.css           # Basic CSS test file
    ├── test.js            # Basic JS test file
    ├── test-minified.js   # Expected JS minified output
    ├── nth-child-test.css # CSS nth-child test case
    ├── starting-style.css # CSS @starting-style test case
    ├── large.css          # Larger CSS file for size-reduction tests
    ├── empty.css          # Empty file test case
    ├── empty.js           # Empty file test case
    └── test.txt           # Unsupported file type
```

## Debugging Test Failures

### Common Issues

1. **Configuration Test Failures**
   - VS Code configuration updates are asynchronous — use small delays after `.update()`.
   - Always use temporary files, never modify source fixtures.

2. **File Path Issues**
   - Ensure `npm run copy-fixtures` ran during `pretest`.
   - Check `out/test/fixtures/` directory exists.

3. **In-Place Modification Conflicts**
   - Use unique temporary file names per test.
   - Comprehensive cleanup in `beforeAll` hooks.

4. **Runtime i18n Assertions Silently Pass Under English**
   - `Runtime Localization` tests use `vscode.env.language` to decide what to assert. Under the default English locale several assertions no-op. Run them under a non-English locale (`VSCODE_LOCALE=es npm test`) or the pseudo-locale (`VSCODE_LOCALE=qps-ploc npm test`) to exercise them properly.

## Best Practices

1. **Source Protection**: Never modify files in `src/test/fixtures/`.
2. **Temporary Files**: Use unique prefixes (`temp-test.css`).
3. **Complete Cleanup**: Remove generated and temporary files after tests.
4. **Fixture Restoration**: Copy fresh content from source when needed.
5. **Spy Management**: Always restore Sinon spies to prevent interference.
6. **Descriptive Names**: Use clear functionality descriptions for test names.
7. **Content Verification**: Assert specific minified output, not just "changed".

---

**Last Updated**: 2026-07-22
**Extension Version**: 1.3.3
**Test Suite**: 58 tests across 3 files (activation, main, i18n)
