# Change Log

All notable changes to the "css-js-minifier" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [1.3.3] - 2026-07-22

### Fixed

- **Fix "command not found" and hangs on unsaved (untitled) documents** ([#145](https://github.com/miguelcolmenares/css-js-minifier/issues/145))
  - `extension.minify` no longer calls `document.save()` on untitled documents — this previously triggered a blocking "Save As" dialog that made the command appear broken. Minified content is now applied to the editor buffer, letting the user decide when to save.
  - `extension.minifyInNewFile` now detects untitled documents and shows a clear, localized error asking the user to save the file first, instead of throwing a cryptic `EROFS: read-only file system` error when attempting to write `/Untitled-1`.
  - Extension activation was refactored to register commands **synchronously** at the top of `activate()`. This eliminates a race condition where a fast user action could invoke a command before it was registered, surfacing as "command 'extension.minifyInNewFile' not found".

- **Fix runtime translations always displaying in English regardless of the user's display language** ([#169](https://github.com/miguelcolmenares/css-js-minifier/issues/169))
  - Migrated the entire runtime i18n layer to VS Code's canonical `vscode.l10n` pattern: every `t()` call site now passes the **English source string** as its first argument (e.g., `t("File type '{0}' is not supported...", type)`) instead of a symbolic dotted key. VS Code returns the source string as-is when running under the default English locale and looks it up in `bundle.l10n.<locale>.json` for every other language — matching the [official VS Code l10n sample](https://github.com/microsoft/vscode-extension-samples/tree/main/l10n-sample). The previous implementation never called `vscode.l10n.t()` at all — it always resolved keys against an in-memory English bundle — so users running VS Code in Spanish, French, German, Portuguese, Japanese, or Chinese saw every runtime message (validation errors, success notifications, exception dialogs) in English despite the shipped translation bundles.
  - Simplified `src/utils/l10nHelper.ts` down to a one-line delegate around `vscode.l10n.t(message, ...args)` and removed the activation-time `initializeEnglishFallback()` preload. There is intentionally no `bundle.l10n.en.json` — English lives in the source code, as the l10n sample recommends.
  - Regenerated every `l10n/bundle.l10n.<locale>.json` (es, fr, de, pt-br, ja, zh-cn) so that keys are the English source strings and values are the localized translations. Translations themselves are preserved verbatim; only the keys changed. `l10n/bundle.l10n.json` is now an identity map suitable for `@vscode/l10n-dev` tooling.
  - Removed the dead debug helper `getL10nStatus()` and the now-obsolete "raw translation key" fallback assertions in `src/test/extension.test.ts`.
  - Cleaned up `activationEvents` in `package.json`: removed the auto-generated `onCommand:*` entries (deprecated since VS Code 1.74) and the invalid `onSaveTextDocument`, leaving only `onLanguage:css` and `onLanguage:javascript`.

- **Fix `minifyOnSave` failing silently on the first save after VS Code startup** ([#168](https://github.com/miguelcolmenares/css-js-minifier/issues/168))
  - The pre-1.3.3 `activationEvents` list did not include `onLanguage:css` or `onLanguage:javascript`, and its `onSaveTextDocument` entry was not a valid activation event (VS Code silently ignored it). As a result the extension did not activate when a user opened a CSS or JS file, and the `workspace.onDidSaveTextDocument` listener registered inside `activate()` did not exist by the time the first save fired. The workaround was to run the `Minify` command once from the Command Palette to force activation.
  - Fixed as an incidental result of the `activationEvents` cleanup shipped with #169 — opening a `.css` or `.js` file now correctly activates the extension before the user can save.
  - Added a dedicated regression suite `src/test/activation.test.ts` (`Activation Events (regression guard for #168)`) that fails CI if either `onLanguage:css` or `onLanguage:javascript` is removed from `package.json`, or if the invalid `onSaveTextDocument` / deprecated `onCommand:*` entries are re-added.

### Added

- New i18n key `"Please save the file to disk before using 'Minify and Save as New File'. The new minified file needs an existing location to be created next to."` across all 6 non-English bundles (es, fr, de, pt-br, ja, zh-cn) to cover the untitled-document guard added in #145.
- New **Runtime Localization (`vscode.l10n`)** test suite in `src/test/i18n.test.ts` that guards against issue #169 regressing:
  - Asserts `t()` returns real interpolated text (never a raw translation key) for every known bundle entry.
  - Verifies placeholder interpolation (`{0}`, `{1}`, …) is preserved end-to-end.
  - Compares `vscode.l10n.bundle` against the shipped `bundle.l10n.<locale>.json` when running under a non-English locale.
  - Detects accidental "translation bundle is a copy of English" regressions.
- `.vscode-test.mjs` now honors `VSCODE_LOCALE=<lang>` and forwards it as `--locale` to the test VS Code instance, enabling locale-specific test runs (`VSCODE_LOCALE=es npm test`, `VSCODE_LOCALE=qps-ploc npm test`, …). See [`docs/INTERNATIONALIZATION.md`](docs/INTERNATIONALIZATION.md#testing-under-a-specific-locale).

### Changed

- Rewrote the "Overview", "Runtime Message Bundles", "Runtime Bundle Keys", "Message Interpolation", "Implementation Details", "Translation Pattern", and "Adding a New Language" sections of [`docs/INTERNATIONALIZATION.md`](docs/INTERNATIONALIZATION.md) to describe the canonical `vscode.l10n` flow (English-as-key), replace outdated `import * as l10n from '@vscode/l10n'` examples with the correct `import { t } from '../utils/l10nHelper'` pattern, and add a new "Testing Under a Specific Locale" guide.

### Removed

- Removed the legacy pre-test `sleep 20` step and the `TEST_DELAY_MS` / `MAX_RETRIES` environment variables from every `.github/workflows/test-vscode-*.yml` workflow (`master.yml`, `test-vscode-stable.yml`, `test-vscode-insiders.yml`, `test-vscode-minimum.yml`). These existed to throttle requests against the Toptal minification API, which was removed in v1.3.0 when minification moved fully local via LightningCSS and oxc-minify.
- Removed the corresponding rate-limit legacy constants (`TEST_DELAY_MS`, `MAX_RETRIES`, `SUITE_DELAY_MS`, `CONFIG_TEST_DELAY_MS`) from `RATE_LIMIT_CONFIG` in `src/test/extension.test.ts`, along with the four `afterEach(delayBetweenTests())` hooks and the two 30-second `beforeAll` "avoid API rate limiting" waits in the `CSS nth-child` and `Keybinding` test suites. The remaining entries are legitimate UI, filesystem, and Windows-CI stability waits. Total test-suite runtime dropped by roughly one minute.

### Security

- Applied non-breaking `npm audit fix` to close 6 HIGH-severity Dependabot alerts on transitive **dev-only** dependencies (`fast-uri` → 3.1.3/3.1.4, `linkify-it` → 5.0.2, `brace-expansion` → 1.1.16/2.1.2/5.0.7). Only `package-lock.json` changed; the shipped production bundle (`dist/extension.js` = `lightningcss` + `oxc-minify`) is unaffected. Remaining 3 LOW alerts (`jsdiff` via `mocha` via `@vscode/test-cli`) require a breaking upgrade to `mocha@12` and are deferred to a follow-up PR.

## [1.3.2] - 2026-07-08

### Fixed

- **Fix commands not found when invoked from context menu or explorer** ([#145](https://github.com/miguelcolmenares/css-js-minifier/issues/145))
  - Added `onCommand:extension.minify` and `onCommand:extension.minifyInNewFile` to `activationEvents` in `package.json`
  - Extension now activates correctly when commands are invoked without a prior save event

### Added

- **File explorer context menu support** ([#145](https://github.com/miguelcolmenares/css-js-minifier/issues/145))
  - Commands now accept a `uri` parameter, enabling minification directly from the file explorer
  - New `resolveTargetDocument()` helper resolves the target document from explorer URI or active editor
  - New i18n key `commands.openFile.failed` across all 7 supported languages

### Changed

- **Minimum VS Code version raised to 1.125.0** to match `@types/vscode` dependency
- Updated `test-vscode-minimum` workflow to test against VS Code 1.125.0
- Added `permissions: contents: read` to `test-vscode-minimum` workflow for security hardening

## [1.3.1] - 2026-04-28

### Fixed

- **Fix extension activation failure on VS Code 1.101+** ([#118](https://github.com/miguelcolmenares/css-js-minifier/issues/118))
  - Updated `oxc-minify` from v0.127.0 to v0.128.0 to resolve `PendingMigrationError: navigator is now a global in nodejs`
  - VS Code 1.101 introduced Electron 35 / Node.js 22 which adds `navigator` as a global, breaking extensions that use it for web environment detection

### Added

- **Output Channel for structured logging** ([#118](https://github.com/miguelcolmenares/css-js-minifier/issues/118))
  - Extension now logs activation status to the "CSS & JS Minifier" Output panel
  - Shows detailed error messages and stack traces when activation fails
  - Users can diagnose issues via Output panel instead of silent failures

### Changed

- **Minimum VS Code version raised to 1.116.0** to match `@types/vscode` dependency
- Updated `test-vscode-minimum` workflow to test against VS Code 1.116.0
- Improved activation error handling with user-friendly messages directing to the Output panel

## [1.3.0] - 2026-04-09

### Added

- **Support for `@starting-style` CSS at-rule** ([#104](https://github.com/miguelcolmenares/css-js-minifier/issues/104))
  - CSS entry animations now work correctly after minification
  - Full support for modern CSS features like CSS Nesting, Color Level 5, and more
- New test fixture for `@starting-style` validation
- **Local JavaScript minification using oxc-minify** ([#108](https://github.com/miguelcolmenares/css-js-minifier/issues/108))
  - Replaced remote Toptal API with local oxc-minify library (Rust-based, from Oxc/Voidzero ecosystem)
  - Fully offline JavaScript minification — no network or API dependency required
  - Features: variable mangling, dead code elimination, constant folding, statement joining
  - New translation key `minificationService.error.jsLocal` across all 7 languages

### Changed

- **Migrated CSS minification from clean-css to LightningCSS**
  - ~60x faster CSS minification (Rust-based parser)
  - Better support for modern CSS specifications
  - Smaller output sizes with smarter optimizations
  - Maintained offline minification capability (no network required)
- **Migrated JS minification from Toptal API to oxc-minify**
  - No network required — works completely offline
  - No file size limit or rate limiting
  - Synchronous API via `minifySync()` for fast processing
- Updated tsconfig.json to include Node.js types explicitly

### Fixed

- **`@starting-style` at-rule was being stripped during minification** ([#104](https://github.com/miguelcolmenares/css-js-minifier/issues/104))
  - This was a limitation of clean-css which had the fix merged but never released
  - LightningCSS properly handles all modern CSS at-rules

### Removed

- Removed Toptal API dependency for JavaScript minification
- Removed `toptalApiMinifier.ts` strategy (replaced by `localJsMinifier.ts`)
- Removed `ApiConfig`, `HttpRequestConfig` types (no longer needed)
- Removed `TOPTAL_JS_API`, `HTTP_REQUEST_CONFIG`, `API_TIMEOUT_MS`, `MAX_FILE_SIZE_BYTES` constants

### Technical

- Replaced `clean-css` v5.3.3 with `lightningcss` v1.32.0
- Added `oxc-minify` as a production dependency
- Removed `@types/clean-css` dev dependency
- Removed `CLEAN_CSS_OPTIONS` constant (no longer needed)
- Updated `localCssMinifier.ts` to use LightningCSS `transform()` API
- Created `localJsMinifier.ts` with oxc-minify `minifySync()` API
- `minificationService.ts` is now fully synchronous
- Webpack externals configured for `oxc-minify`
- Bundle size may increase slightly due to native Rust binaries

## [1.2.0] - 2026-02-16

### Added

- **Local CSS Minification**: Replaced remote Toptal CSS API with local clean-css library
  - Uses clean-css v5.3.3 with Level 2 optimizations for aggressive yet safe minification
  - Provides offline CSS minification without requiring network access
  - Built-in statistics support (original size, minified size, efficiency percentage)
  - Includes removal of whitespace/comments, rule merging, shorthand optimization, and color optimization
  - New translation key `minificationService.error.cssLocal` across all 7 languages

### Changed

- **Hybrid Minification Architecture**: CSS uses local minification, JavaScript continues using Toptal API
- Updated README.md with new minification architecture documentation
- Extension description updated to reflect local CSS minification capability
- Bundle size increased from ~48KB to ~514KB (includes clean-css and source-map dependencies)

### Fixed

- Resolved CSS minification failures caused by Toptal API deprecation (502/503 errors, timeouts)

### Technical

- Added `clean-css` v5.3.3 as production dependency
- Added `@types/clean-css` v4.2.11 as development dependency
- New local CSS minifier strategy (`minifyCss()` in `services/strategies/localCssMinifier.ts`) integrated via the `minificationService` facade
- MIT license compatibility maintained

## [1.1.0] - 2025-10-17

### Added

- **Size Reduction Statistics**: Display percentage of size reduction and file sizes after minification
  - Shows original and minified file sizes in human-readable format (KB or B)
  - Calculates and displays percentage of size reduction
  - Handles edge cases (no reduction, same size files)
  - Works with both in-place minification and new file creation
- New configuration option: `showSizeReduction` (default: true)
  - Allows users to toggle size statistics display on/off
  - When disabled, shows traditional success messages
- **Internationalization (i18n) Support**: Full multi-language support for 7 languages
  - 🇺🇸 English (default)
  - 🇪🇸 Spanish
  - 🇫🇷 French
  - 🇩🇪 German
  - 🇧🇷 Portuguese (Brazilian)
  - 🇯🇵 Japanese
  - 🇨🇳 Chinese Simplified
- Runtime message bundles using @vscode/l10n package
- 17 internationalized runtime messages across all user notifications
- 13 internationalized configuration and command labels
- Comprehensive i18n test suite with 20+ tests
- i18n architecture documentation (docs/INTERNATIONALIZATION.md)
- VS Code task for running i18n tests separately
- Custom fallback l10n system with manual JSON loading for reliability
- Parameter substitution support for all translated messages
- Notification system optimization to prevent double notifications
- **Package Size Optimization**: Implemented aggressive optimization reducing package size by 96.8%
  - Extension package size reduced from ~1.46 MB to 47.37 KB
  - Excluded demo/documentation GIFs (~1.4 MB) via .vscodeignore optimization
  - Optimized icon.png with oxipng (41KB → 22KB, 46% reduction) while preserving quality
  - Maintained full functionality and complete 7-language i18n support
  - Added package optimization guidelines to developer documentation

### Changed

- All hardcoded user-facing strings replaced with l10n.t() calls
- Error messages now support parameter interpolation
- Success notifications now properly internationalized
- README updated with language support information
- **Optimized Extension Packaging**: Enhanced .vscodeignore configuration for minimal package size
  - Excluded heavy assets while preserving all user-facing functionality
  - Documented optimization workflow for future maintainers
  - Established package size monitoring practices

### Fixed

- **CSS nth-child Selector Minification**: ✅ **FULLY RESOLVED**
  - nth-child selectors now minify correctly with 41% size reduction
  - Comprehensive test coverage for complex nth-child patterns
  - Mathematical expressions, selector filtering, and complex combinations work perfectly

## [1.0.0] - 2025-10-16

### Added

- Complete modular architecture with separation of concerns
- Comprehensive JSDoc documentation across all modules
- Issue #5 resolution: autoOpenNewFile configuration option
- Issue #1 resolution: Enhanced error handling for CSS nth-child selectors
- Comprehensive test suite for all issues and configuration scenarios
- API timeout handling with Promise.race pattern (5000ms timeout)
- 5MB file size validation to prevent API errors
- Enhanced HTTP error handling with specific status code messages
- i18n documentation and translation maintenance guidelines

### Changed

- **BREAKING REFACTOR**: Restructured codebase into modular architecture
  - `src/commands/`: Command handlers and core business logic
  - `src/services/`: External API integration and file operations
  - `src/utils/`: Validation utilities and helper functions
- Comprehensive JSDoc documentation with practical examples for all functions
- Enhanced error handling with detailed user feedback
- Type safety improvements with interfaces and proper typing
- Reduced main extension file size by 63% (220→81 lines)
- Enhanced minification service with comprehensive error handling
- Improved file service with configuration-aware functionality
- Updated project documentation with modular architecture details

### Fixed

- Issue #5: Minify on save now respects minifyInNewFile configuration
- **CSS nth-child Selector Minification**: Previous architectural improvements resolved underlying API issues
- Timeout issues during API calls with proper Promise.race implementation
- Silent failures now show appropriate user error messages
- File size validation prevents 413 HTTP errors for large files
- Eliminated code duplication between minify commands
- Improved code reusability and maintainability
- Enhanced documentation standards across all modules

### Technical Improvements

- **Robust Timeout Handling**: Added 5000ms timeout for API calls with Promise.race pattern
  - Handles API responses observed up to 1100ms in performance testing
  - Specific error messages for timeout vs connectivity issues
  - Improved user experience with clear, actionable error feedback
  - Graceful degradation when external APIs are slow or unresponsive
- **Enhanced API Error Handling**: Comprehensive error handling based on updated Toptal API documentation
  - **File Size Validation**: Pre-request validation for 5MB maximum file size limit
  - **HTTP Status Code Handling**: Specific user messages for all API error codes (400, 405, 406, 413, 422, 429)
  - **JSON Error Parsing**: Extracts detailed error messages from API JSON responses when available
  - **Rate Limit Awareness**: Clear messaging when hitting 30 requests/minute limit
  - **Syntax Error Details**: Informative feedback for CSS/JavaScript syntax errors with precise error descriptions
- **Fixed Minify on Save**: Resolved issue where minify on save didn't respect `minifyInNewFile` configuration
  - Now properly creates new files when `minifyInNewFile: true` is set
  - Maintains in-place minification when `minifyInNewFile: false` (default behavior)
  - Respects all user configuration settings during auto-minification on save
- **New Configuration Option**: Added `autoOpenNewFile` setting to control file opening behavior
  - When `true` (default): Newly created minified files open automatically in editor
  - When `false`: Files are created silently without opening, reducing editor clutter
  - Addresses user request for less intrusive minification workflow
- Migrate to ESLint v9 flat config for better compatibility
- Optimize GitHub Actions cache strategy across all workflows
- Optimize CodeQL execution to run only on PRs and weekly schedule
- Standardize action versions to checkout@v5
- Enhanced test suite with automatic Sinon spy cleanup
- Updated error message validation in tests for new architecture
- Improve CI/CD efficiency and reduce resource usage
- Fix auto-merge workflow: Remove GitHub Actions approval restrictions

## [0.1.0] - 2024-06-29

### Added

- CSS and JavaScript minification using Toptal API
- Explorer context menu to minify css & js files
- Keyboard shortcuts for minify css & js files
- Prefix options for minified files (.min, -min, .compressed, etc.)
- File extension validation and content length validation before minifying
- Internazionalization support with Spanish translation
- Auto-minification on save (configurable)
- Test cases and comprehensive testing

### Fixed

- Update keybindings configuration to avoid conflicts with macOS default keybindings
- Demo images in README.md

### Changed

- Updated extension icon
- Updated README.md with new features and documentation
