# Testing Guide

## Test Strategy Overview

The CSS & JS Minifier extension uses VS Code's extension testing framework with Mocha. The current test suite covers **66 tests** across four files, spanning activation, main functionality, workspace capabilities, and internationalization. Both CSS and JS minification are fully local (LightningCSS + oxc-minify) so tests run fast with no network dependency or rate-limiting concerns.

## Test Structure

### Test Files (`src/test/`)

| File | Tests | Focus |
|---|---|---|
| `activation.test.ts` | 5 | Regression guard for [#168](https://github.com/miguelcolmenares/css-js-minifier/issues/168): asserts `activationEvents` in `package.json` contains `onLanguage:css` and `onLanguage:javascript`, and that the deprecated `onCommand:*` / invalid `onSaveTextDocument` entries are not re-added. |
| `extension.test.ts` | 31 | Main functionality: CSS/JS minification (in-place + new file), file-prefix configurations, explorer context menu, empty file / unsupported file type validation, configuration behaviors (`autoOpenNewFile`, `minifyInNewFile`, `minifiedNewFilePrefix`, `showSizeReduction`), CSS nth-child selectors, and keybinding smoke tests. |
| `workspaceCapabilities.test.ts` | 7 | Virtual workspace support: registers an in-memory file system under a non-`file` scheme and checks that `Minify and Save as New File` writes the sibling file through that provider (same scheme and authority, no local file, query and fragment dropped), and that in-place minification persists through it. Also asserts the `capabilities` declared in `package.json` (virtual workspaces supported, untrusted workspaces `limited` with the write-target settings restricted). |
| `i18n.test.ts` | 23 | Two nested suites: (a) static bundle validation — file existence, JSON validity, key parity across all seven languages, placeholder preservation; and (b) **Runtime Localization (`vscode.l10n`)** — regression guard for [#169](https://github.com/miguelcolmenares/css-js-minifier/issues/169): asserts `t()` returns real interpolated text (never a raw key), placeholder interpolation is preserved end-to-end, `vscode.l10n.bundle` matches the shipped `bundle.l10n.<locale>.json` when running under a non-English locale, and every non-English bundle differs from English for at least one key. |

Total: **66 tests**.

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
npx vscode-test --grep "Virtual Workspace Test Suite"
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

# Coverage: per-file summary for src/** plus coverage/lcov.info
npm run test:coverage
```

See [`docs/INTERNATIONALIZATION.md#testing-under-a-specific-locale`](INTERNATIONALIZATION.md#testing-under-a-specific-locale) for the runtime localization test wiring.

### Test coverage

`npm run test:coverage` is opt-in. `npm test` is unchanged and collects nothing.

```bash
npm run test:coverage
```

It runs `pretest:coverage` (compile tests, rebuild the bundle with `webpack --env coverage`, lint, copy fixtures), then `vscode-test --coverage --coverage-output coverage`, then `scripts/coverage-report.mjs`. The output is a per-file table of lines, functions and branches for `src/**` (without `src/test/**`) and `coverage/lcov.info` with repository-relative paths. There is no threshold: the numbers are for orientation.

How it is wired:

- `.vscode-test.mjs` holds a `coverage` block (`include`, `exclude`, `reporter: ['lcovonly']`). It is a sibling of `tests` inside `defineConfig({ tests, coverage })`; a flat `defineConfig({ files, version, coverage })` ignores it silently. The CLI also ignores `coverage.output`, so the folder comes from `--coverage-output` in the npm script. Patterns are matched against absolute paths, which is why they start with `**/`.
- The extension under test runs from the webpack bundle `dist/extension.js`, not from the `out/` files that `tsc` emits. Webpack's default source-map paths (`webpack://css-js-minifier/./src/...`) point at nothing c8 can read, so it reports every file at a false 100% or 0%. `--env coverage` makes `webpack.config.cjs` set `devtoolModuleFilenameTemplate` to `[absolute-resource-path]`, which maps the bundle back to the real `src/**` files. Regular builds and the shipped source maps never get these absolute paths.
- c8 also lists non-source modules of the bundle (`external commonjs "vscode"`, `webpack/bootstrap`) as 100% covered. `scripts/coverage-report.mjs` drops them, rewrites `lcov.info` with only `src/**`, and prints the table.
- `scripts/coverage-report.mjs` exits 1 when `src/extension.ts` is missing from the lcov file. That means the bundle was built without `--env coverage` and only the few files the tests import from `out/` were measured, so the run is refused instead of showing a tiny table that looks complete.
- With `includeAll: false`, a file nothing loads, such as a type-only module, does not appear.

**What it cannot measure**: the minification itself runs in the Rust bindings `lightningcss` and `oxc-minify`, so the percentages describe the VS Code orchestration around them.

**CI**: the Ubuntu job of `.github/workflows/test-vscode-stable.yml` (VS Code Stable) reruns the suite with `npm run test:coverage` and appends the table to `$GITHUB_STEP_SUMMARY`. Both steps use `continue-on-error`, so a coverage problem never changes a required check. The other jobs are unchanged.

**Local note**: on macOS, VS Code needs the user-data path under 103 characters for its IPC socket. In a deeply nested checkout (for example a git worktree) the run fails with `listen EINVAL ... main.sock`. Pass a short directory through `launchArgs: ['--user-data-dir=/tmp/short']` in a local, uncommitted copy of the config.

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

```text
src/test/
├── activation.test.ts     # Activation Events regression guard (#168)
├── extension.test.ts      # Main test suite (31 tests)
├── i18n.test.ts           # Static + runtime i18n suites (23 tests)
├── workspaceCapabilities.test.ts # Virtual workspace + capabilities (7 tests)
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

**Last Updated**: 2026-10-28
**Extension Version**: 1.3.4
**Test Suite**: 66 tests across 4 files (activation, main, workspace capabilities, i18n)
