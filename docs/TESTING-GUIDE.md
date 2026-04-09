# Testing Guide

## Test Strategy Overview

The CSS & JS Minifier extension uses VS Code's extension testing framework with Mocha. The test suite includes 52+ tests covering all functionality. Since both CSS and JS minification are fully local (LightningCSS + oxc-minify), tests run fast with no network dependency or rate limiting concerns.

## Test Structure

### Test Suites

1. **Internationalization (i18n) Test Suite (16 tests)**
   - Package.nls file validation (existence, JSON validity, key consistency)
   - Bundle.l10n runtime message validation across 7 languages
   - VS Code integration (localized commands, configuration)
   - Translation quality (placeholder preservation, no English-only text)

2. **Main Functionality Tests (21 tests)**
   - Basic CSS/JS minification (in-place and new file)
   - File prefix configurations (`.min`, `-min`, `.compressed`, `-compressed`, `.minified`, `-minified`)
   - Explorer context menu actions
   - Empty file and unsupported file type validation

3. **CSS nth-child Test Suite (2 tests, pending)**
   - CSS nth-child selectors minification
   - Currently pending due to LightningCSS handling differences

4. **Keybinding Test Suite (2 tests)**
   - Keyboard shortcut functionality
   - Command palette integration

5. **Configuration Test Suite (4 tests + 8 size reduction tests)**
   - `autoOpenNewFile` setting validation (enabled/disabled)
   - `minifiedNewFilePrefix` custom prefix configuration
   - `minifyInNewFile` vs in-place minification behavior
   - Size reduction statistics display and formatting

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

| Task | Tests | Time |
|------|-------|------|
| Test: Run All Tests | 52+ | ~1 min |
| Test: Configuration Suite Only | 12 | ~30s |
| Test: Main Functionality Suite Only | 21 | ~15s |
| Test: Internationalization (i18n) Suite Only | 16 | ~10s |
| Test: Keybinding Suite Only | 2 | ~5s |
| Test: CSS nth-child Suite Only | 2 | ~5s |
| Test: Specific Test by Name | 1 | ~5s |
| Test: Compile and Build Only | — | ~10s |

### Command Line

```bash
# Complete test suite
npm test

# Individual suite execution
npx vscode-test --grep "Configuration Test Suite"
npx vscode-test --grep "Internationalization"
npx vscode-test --grep "JS & CSS Minifier Test Suite"

# Specific test
npx vscode-test --grep "autoOpenNewFile setting - enabled"

# Build only
npm run pretest
```

### Development Workflow

**Feature Development:**

1. Start watch mode: "tasks: watch-tests"
2. Run specific tests for your feature
3. Run full suite before commit: "Test: Run All Tests"

**Bug Fixing:**

1. Identify failing suite: "Test: Run All Tests"
2. Focus on specific suite
3. Target specific test: "Test: Specific Test by Name"

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
├── extension.test.ts      # Main test suite (52+ tests)
├── i18n.test.ts           # Internationalization test suite
├── fixtures/
│   ├── test.css           # Basic CSS test file
│   ├── test.js            # Basic JS test file
│   ├── test-minified.js   # Expected JS minified output
│   ├── nth-child-test.css # CSS nth-child test case
│   ├── large.css          # Large CSS file for size tests
│   ├── empty.css          # Empty file test case
│   ├── empty.js           # Empty file test case
│   └── test.txt           # Unsupported file type
```

## Debugging Test Failures

### Common Issues

1. **Configuration Test Failures**
   - VS Code configuration updates are asynchronous — use delays
   - Always use temporary files, never modify source fixtures

2. **File Path Issues**
   - Ensure `npm run copy-fixtures` ran during `pretest`
   - Check `out/test/fixtures/` directory exists

3. **In-Place Modification Conflicts**
   - Use unique temporary file names per test
   - Comprehensive cleanup in `beforeAll` hooks

## Best Practices

1. **Source Protection**: Never modify files in `src/test/fixtures/`
2. **Temporary Files**: Use unique prefixes (`temp-test.css`)
3. **Complete Cleanup**: Remove generated and temporary files after tests
4. **Fixture Restoration**: Copy fresh content from source when needed
5. **Spy Management**: Always restore Sinon spies to prevent interference
6. **Descriptive Names**: Use clear functionality descriptions for test names
7. **Content Verification**: Assert specific minified output, not just "changed"

---

**Last Updated**: April 2026
**Extension Version**: 1.3.0
**Test Suite**: 52+ tests, 100% passing rate
