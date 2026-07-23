# CSS & JS Minifier Extension - AI Developer Guide

## Project Overview
This is a VS Code extension that minifies CSS and JavaScript files. Both CSS and JavaScript minification are performed locally using Rust-based libraries: CSS uses LightningCSS and JavaScript uses oxc-minify. No network or API dependencies are required. The extension provides commands, context menu options, keyboard shortcuts, and auto-minification on save.

## Architecture & Key Components

### Core Extension Structure (DDD/SRP Architecture)
- **`src/extension.ts`**: Clean entry point (81 lines) - handles activation, command registration, and configuration
- **`src/commands/`**: Command handlers for VS Code integration
  - `minifyCommand.ts`: Unified command logic with processDocument() core function
  - `index.ts`: Command exports with comprehensive documentation
- **`src/services/`**: Business logic and orchestration
  - `minificationService.ts`: Facade/orchestrator that routes to appropriate strategy
  - `fileService.ts`: File system operations and filename utilities
  - `strategies/`: Minification strategy implementations
    - `localCssMinifier.ts`: Local CSS minification using LightningCSS
    - `localJsMinifier.ts`: Local JS minification using oxc-minify
    - `index.ts`: Strategy exports
  - `index.ts`: Service exports with module documentation
- **`src/lib/`**: Shared constants and utilities (DDD infrastructure layer)
  - `constants.ts`: Centralized configuration (file size constants)
  - `helpers.ts`: Utility functions (formatBytes, calculateStats)
  - `index.ts`: Library exports
- **`src/types/`**: Type definitions (DDD domain layer)
  - `minification.ts`: MinificationStats, MinificationResult
  - `index.ts`: Type exports
- **`src/utils/`**: Reusable validation and utility functions
  - `validators.ts`: File type and content validation with user feedback
  - `l10nHelper.ts`: Internationalization helper
  - `index.ts`: Utility exports with module documentation
- **Two primary commands**: `extension.minify` (in-place) and `extension.minifyInNewFile` (creates `.min` files)
- **Local minification**: CSS uses LightningCSS, JavaScript uses oxc-minify (both Rust-based, fully offline)
- **File handling**: Supports both active editor and explorer context actions

### Command Registration Pattern (Modular)
Commands are registered in `activate()` using imported handlers:
```typescript
// Clean registration with imported handlers
const minifyCommandDisposable = vscode.commands.registerCommand("extension.minify", minifyCommand);
const minifyInNewFileCommandDisposable = vscode.commands.registerCommand("extension.minifyInNewFile", minifyInNewFileCommand);

// Command handlers follow this pattern in commands/minifyCommand.ts:
async function processDocument(document: vscode.TextDocument, options: MinifyOptions = {}) {
  // 1. Validate file type and content (utils/validators.ts)
  // 2. Call minification service (services/minificationService.ts)
  // 3. Save result using file service (services/fileService.ts)
}
```

### Modular Architecture Benefits
- **Single Responsibility**: Each module has one clear purpose
- **Separation of Concerns**: Types, constants, strategies are isolated
- **Code Reusability**: No duplicate validation or API logic
- **Enhanced Testability**: Strategies can be mocked independently
- **Improved Maintainability**: 63% reduction in main file size (220→81 lines)
- **Better Documentation**: Comprehensive TSDoc with examples throughout
- **Extensibility**: Easy to add new strategies or swap implementations

### Configuration System
Four settings in `package.json` contribute section:
- `minifyOnSave`: Auto-minify when saving files
- `minifyInNewFile`: Save to new file instead of overwriting
- `minifiedNewFilePrefix`: Customize suffix (`.min`, `-min`, `.compressed`, etc.)
- `autoOpenNewFile`: Automatically open newly created minified files in the editor

### Internationalization (i18n) System
The extension has comprehensive internationalization support across 7 languages using a two-layer translation system:

#### Supported Languages (7 total)
- **English (en)**: Default language - `package.nls.json` + `l10n/bundle.l10n.json`
- **Spanish (es)**: `package.nls.es.json` + `l10n/bundle.l10n.es.json`
- **French (fr)**: `package.nls.fr.json` + `l10n/bundle.l10n.fr.json`
- **German (de)**: `package.nls.de.json` + `l10n/bundle.l10n.de.json`
- **Portuguese (pt-br)**: `package.nls.pt-br.json` + `l10n/bundle.l10n.pt-br.json`
- **Japanese (ja)**: `package.nls.ja.json` + `l10n/bundle.l10n.ja.json`
- **Chinese Simplified (zh-cn)**: `package.nls.zh-cn.json` + `l10n/bundle.l10n.zh-cn.json`

#### Two-Layer Translation System

**Layer 1: Package Translations (`package.nls.*.json`)**
- Used for static contributions in `package.json`
- Command titles, configuration settings, enum descriptions
- Referenced using `%key%` syntax in package.json
- 13 keys total across all languages

```json
// In package.json
"title": "%commands.extension.minify.title%"

// In package.nls.json (English)
"commands.extension.minify.title": "Minify this File"
```

**Layer 2: Runtime Messages (`l10n/bundle.l10n.*.json`)**
- Used for dynamic messages in TypeScript code
- Error messages, success notifications, validation messages
- Accessed via `@vscode/l10n` package
- 17 keys total with parameter interpolation support

```typescript
// In TypeScript
import * as l10n from '@vscode/l10n';
vscode.window.showErrorMessage(
  l10n.t('validators.fileType.unsupported', fileType)
);

// In l10n/bundle.l10n.json (English)
"validators.fileType.unsupported": "File type '{0}' is not supported..."
```

#### Internationalized Components
- All error messages (validators, API errors, network errors)
- All success notifications (file operations)
- All configuration labels and descriptions
- All command titles and menu items
- Parameter interpolation using {0}, {1}, {2} placeholders

#### Translation Testing
- Comprehensive i18n test suite in `src/test/i18n.test.ts`
- 20+ tests covering file existence, JSON validity, key consistency
- Placeholder preservation verification
- Translation quality checks
- VS Code task: "Test: Internationalization (i18n) Suite Only"

#### Language Detection
VS Code automatically selects the appropriate translation based on:
- User's VS Code display language setting
- System locale
- Falls back to `package.nls.json` (English) if locale not supported

#### Adding New Languages
To add support for a new language:
1. Create `package.nls.{locale}.json` with 13 configuration keys
2. Create `l10n/bundle.l10n.{locale}.json` with 17 runtime message keys
3. Update test constants in `src/test/i18n.test.ts`
4. Verify all tests pass
5. See `docs/INTERNATIONALIZATION.md` for detailed guide

#### Translation Maintenance
- **Critical**: Keep all `.nls` files synchronized with identical keys
- **New Features**: Always add translation keys to all supported language files
- **Testing**: Verify translations by running i18n test suite
- **Documentation**: See `docs/INTERNATIONALIZATION.md` for complete guide

## Development Workflows

### Release Flow (workflow-driven — do NOT push tags manually)

**As of v1.3.3 releases are cut from the `Build & Release` workflow (`.github/workflows/release.yml`) via `workflow_dispatch`. There is no `push: tags: v*` trigger and the local `pre-push` Husky hook refuses to push any `v*` tag from your machine. See [`AGENTS.md`](../AGENTS.md) for the full agent-oriented reference and [`.github/instructions/publish-update-extension.instructions.md`](instructions/publish-update-extension.instructions.md) for the human runbook.**

**Why:** two invariants — (1) the repository ruleset makes `refs/tags/v*` immutable (blocks `deletion` + `non_fast_forward`), and (2) the `VSCE_PAT` expires after at most 1 year. A naïve tag push could burn a version number on GitHub if the token expired without anyone noticing. The workflow validates the PAT via `vsce verify-pat` **before** creating the tag, so if the token is broken, nothing is created anywhere.

**Pipeline:**

```
gh workflow run release.yml -f version=X.Y.Z
  ├─ preflight       — version match, changelog entry, tag unused, vsce verify-pat
  ├─ build (× 6)     — matrix packages one .vsix per platform + activation smoke test
  ├─ tag-and-release — creates annotated tag, pushes it, creates GitHub Release
  └─ publish         — vsce publish --packagePath dist/*.vsix
```

**Before dispatching:**

1. Bump `package.json` version (+ `src/extension.ts` `@version` header — see [Version Management](#version-management--documentation-standards) below).
2. Add `## [X.Y.Z] - YYYY-MM-DD` heading to `CHANGELOG.md`.
3. Commit both in the same commit — the `pre-commit` Husky hook enforces this pairing and rejects a version bump without a matching changelog entry. Convention: `chore: Release version X.Y.Z`.
4. Open PR → get the 6-platform matrix green → squash-merge.
5. (Optional) `gh workflow run verify-marketplace-auth.yml` to confirm the `VSCE_PAT` is healthy without publishing anything.
6. `gh workflow run release.yml -f version=X.Y.Z` and watch the run.

**Never:** run `vsce publish` locally (except the emergency-fallback scenario documented in the publishing instructions), push a `v*` tag by hand, or delete/re-tag an existing `v*` (the ruleset blocks it and the fix is always "bump to the next version").

### Version Management & Documentation Standards
**CRITICAL Version Update Requirements:**
- **When changing version numbers:** Always update BOTH `package.json` AND `src/extension.ts`
- **In `src/extension.ts`:** Update the `@version` line in the file header TSDoc comment
- **For new functionality files:** Add `@since` comment ONLY in the file header TSDoc (not in individual functions)
- **Example version update:**
  ```typescript
  /**
   * @fileoverview Main entry point for the CSS & JS Minifier VS Code extension.
   * @author Miguel Colmenares
   * @version 1.3.0  // ← UPDATE THIS when version changes
   * @since 0.1.0
   */
  ```

**New File Documentation Standards:**
- **Header TSDoc:** Include `@since` with the version when the file was created
- **Function TSDoc:** Do NOT include `@since` in individual function documentation
- **Module exports:** Include comprehensive documentation with examples

### Task Execution Behavior (IMPORTANT)
**CRITICAL Understanding for Copilot:**
- **Task Success ≠ Completion:** When executing VS Code tasks via `run_task`, a "success" message indicates the task STARTED successfully, NOT that it completed
- **Test Execution Time:** 
  - "Test: Run All Tests" takes 3-4 minutes to complete (52 comprehensive tests)
  - Other test suites take 20s-1.5 minutes depending on scope
- **Status Interpretation:**
  - ✅ "Task succeeded with no problems" = Task started successfully
  - ❌ "Task failed" = Task failed to start or crashed
  - 📊 To verify completion: Use `get_task_output` or wait for completion indicators
- **Best Practice:** After running tests, wait for actual completion before assuming results

### Build & Watch
- **Development**: `npm run watch` (webpack watch mode)
- **Testing**: `npm run watch-tests` (TypeScript compilation watch)
- **Production**: `npm run package` (optimized webpack build)
- **Combined**: Use VS Code task `tasks: watch-tests` for both

### VS Code Tasks (Recommended Development Workflow)
The project includes optimized VS Code tasks for efficient development. Access via `Ctrl/Cmd + Shift + P` → "Tasks: Run Task":

#### Testing Tasks
- **"Test: Run All Tests"** - Complete 52-test suite with compilation and linting (~2 min)
- **"Test: Configuration Suite Only"** - Configuration tests only (4 tests, ~20s)
- **"Test: CSS nth-child Suite Only"** - CSS encoding tests only (2 tests, ~7s)  
- **"Test: Keybinding Suite Only"** - Keyboard shortcut tests (2 tests, ~5s)
- **"Test: Main Functionality Suite Only"** - Core minification tests (21 tests, ~1.5min)
- **"Test: Specific Test by Name"** - Run individual test with prompt input
- **"Test: Compile and Build Only"** - Preparation without testing (~10s)
- **"Test: Quick Compile and Test"** - Fast TypeScript compilation (~3s)

#### Build & Watch Tasks  
- **"npm: watch"** - Webpack watch mode (default build task)
- **"npm: watch-tests"** - TypeScript watch for test files
- **"tasks: watch-tests"** - Combined extension + test watch mode

#### Development Workflows
**Feature Development:**
1. Start: "tasks: watch-tests" (combined watch mode)
2. Test specific features: "Test: Configuration Suite Only" 
3. Final validation: "Test: Run All Tests"

**Bug Fixing:**
1. Identify: "Test: Run All Tests"
2. Focus: "Test: CSS nth-child Suite Only" (for CSS issues)  
3. Target: "Test: Specific Test by Name" → enter test name
4. Verify: "Test: Run All Tests"

**Pre-commit:**
1. Build check: "Test: Compile and Build Only"
2. Full validation: "Test: Run All Tests" (ensure 52/52 passing)

### Pre-Commit Testing
- **CRITICAL**: Always run "Test: Run All Tests" before committing/pushing changes
- **Validates**: TypeScript compilation, webpack build, ESLint rules, and all extension functionality
- **Test Suite**: 52 comprehensive tests covering all minification scenarios and edge cases
- **Never commit**: Code that fails tests, has compilation errors, or doesn't pass linting

### Testing Strategy
Tests use VS Code's extension testing framework with Mocha:
- **Fixtures**: `src/test/fixtures/` contains test CSS/JS files
- **Test pattern**: Load fixture → execute command → assert minified output matches expected
- **Cleanup**: Automatically removes generated `.min` files after tests
- **Multiple prefixes**: Tests all supported minification prefixes

### File Validation Logic
Two-step validation before minification:
1. **File type**: Must be `css` or `javascript` language ID
2. **Content**: Must not be empty (shows appropriate error messages)

## Extension-Specific Patterns

### Dual Context Support
Commands work from both active editor AND file explorer:
```typescript
const editor = vscode.window.activeTextEditor;
const explorer = vscode.window.activeTextEditor?.document.uri;
// Handle both contexts with similar logic
```

### Minification Architecture

**CSS Minification (Local - v1.3.0+):**
- Uses `lightningcss` library v1.32.0 (Rust-based, ~60x faster)
- Offline minification without network dependency
- Full support for modern CSS: `@starting-style`, CSS Nesting, Color Level 5, etc.
- Features: whitespace/comment removal, rule merging, shorthand optimization, color optimization
- Strategy: `services/strategies/localCssMinifier.ts` → `minifyCss()`

**JavaScript Minification (Local - v1.3.0+):**
- Uses `oxc-minify` library (Rust-based, from the Oxc/Voidzero ecosystem)
- Offline minification without network dependency
- Features: variable mangling, dead code elimination, constant folding, statement joining
- Synchronous API via `minifySync()` for fast processing
- Strategy: `services/strategies/localJsMinifier.ts` → `minifyJs()`

### File Manipulation Approach
- **In-place**: Uses `WorkspaceEdit` to replace entire document content
- **New file**: Uses `vscode.workspace.fs.writeFile` with regex-based filename transformation
- **Auto-save**: Listens to `onDidSaveTextDocument` when `minifyOnSave` is enabled

### Key Files for Extension Development

### Core Files
- **`package.json`**: Command definitions, menus, keybindings, and configuration schema
- **`package.nls.json`**: Default English translations for all user-facing strings
- **`package.nls.es.json`**: Spanish translations with complete key coverage
- **`src/extension.ts`**: Clean entry point with command registration and lifecycle management
- **`webpack.config.cjs`**: Node.js target for VS Code extension bundling
- **`src/test/extension.test.ts`**: Comprehensive test suite with fixture-based testing
- **`.vscode/tasks.json`**: Optimized VS Code tasks for development and testing workflows
- **`.vscode/README.md`**: Complete guide for VS Code tasks usage and development workflows

### Modular Structure
- **`src/lib/constants.ts`**: Centralized configuration (file size constants)
- **`src/lib/helpers.ts`**: Utility functions (formatBytes, calculateStats)
- **`src/types/minification.ts`**: Type definitions (MinificationResult, MinificationStats)
- **`src/services/strategies/localCssMinifier.ts`**: Local CSS minification with LightningCSS
- **`src/services/strategies/localJsMinifier.ts`**: Local JS minification with oxc-minify
- **`src/services/minificationService.ts`**: Facade that routes to appropriate strategy
- **`src/services/fileService.ts`**: File operations (save, replace content, filename generation)
- **`src/commands/minifyCommand.ts`**: Main command handlers with processDocument() core logic
- **`src/utils/validators.ts`**: File type and content validation with user feedback
- **`src/*/index.ts`**: Module exports with documentation for each layer

### Documentation Standards
- **TSDoc Standard**: All documentation comments follow the [TSDoc](https://tsdoc.org/) specification, enforced by `eslint-plugin-tsdoc`
- **Comprehensive TSDoc**: Every function has detailed documentation with examples
- **Type Safety**: Interfaces and types for all major data structures
- **Error Handling**: Documented side effects and error conditions
- **Usage Examples**: Practical code examples in documentation
- **Custom Tags**: `@since`, `@version`, `@author` configured in `tsdoc.json`

## Testing & Debugging
- Test files expect specific minified output (hardcoded in test file)
- **Recommended**: Use VS Code tasks for efficient testing workflows
- **Quick testing**: Use "Test: Configuration Suite Only" or specific suite tasks
- **Full validation**: Use "Test: Run All Tests" before commits
- Use `npm run pretest` to compile, lint, and copy fixtures before testing
- Extension activates on `onSaveTextDocument` event for auto-minification feature
- Error handling shows user-friendly messages via `vscode.window.showErrorMessage`

## Package Size Optimization

### Current Optimized State
- **Package Size**: 47.37 KB (24 files) - **96.8% reduction** from original ~1.46 MB
- **Key Optimizations Applied**: GIF exclusion + PNG compression with oxipng
- **Maintained**: Full functionality, 7-language i18n support, complete documentation

### Optimization Strategy (.vscodeignore)
**CRITICAL for Package Size Management:**
- **Exclude heavy assets**: `images/*.gif` saves ~1.4 MB (demos/documentation GIFs)
- **Include essentials only**: Icon, README, CHANGELOG, LICENSE, i18n files
- **Result**: Extremely efficient package while preserving all user-facing functionality

### Icon Optimization Workflow
**PNG Compression Process:**
```bash
# Install oxipng for maximum PNG optimization
brew install oxipng

# Optimize with maximum compression while preserving transparency
oxipng -o 6 --strip all --out images/icon-optimized.png images/icon.png

# Verify quality maintained (600x600, RGBA format)
file images/icon-optimized.png

# Replace original if significant savings achieved
mv images/icon-optimized.png images/icon.png
```

### Package Content Strategy
**Included (24 files, 47.37 KB):**
- ✅ `dist/extension.js` (12.04 KB) - Webpack optimized bundle
- ✅ `images/icon.png` (22.22 KB) - Oxipng compressed, 46% reduction
- ✅ i18n files (16.79 KB) - Complete 7-language support
- ✅ Documentation (17.32 KB) - User-essential files only

**Excluded via .vscodeignore:**
- ❌ `images/*.gif` - Demo/documentation assets (~1.4 MB)
- ❌ `src/` - TypeScript source code
- ❌ `node_modules/` - Development dependencies
- ❌ Test files and development configuration

### Future Optimization Considerations
**IMPORTANT for Maintainers:**
1. **Monitor New Assets**: Ensure new images don't inflate package size
2. **Automate PNG Optimization**: Consider adding oxipng to build process
3. **Regular Package Audits**: Check `vsce package` output for size creep
4. **Quality vs Size Balance**: Always verify icon quality after optimization
5. **Documentation Strategy**: Keep essential docs, move extensive guides to repo only

### Optimization Validation
```bash
# Generate package and check size
npm run package && npx vsce package
ls -lh *.vsix

# Should show ~47 KB for optimized package
# If significantly larger, investigate new heavy files
```

## GitHub CLI Commands
- **CRITICAL**: Always use `PAGER=cat` or pipe to `| cat` with GitHub CLI commands
- **Examples**: 
  - `PAGER=cat gh pr list` or `gh pr list | cat`
  - `PAGER=cat gh run view <id>` or `gh run view <id> | cat`
  - `PAGER=cat gh workflow list` or `gh workflow list | cat`
- **Reason**: Prevents pager issues and ensures complete output in terminal tools

## Security & Code Quality
- **CodeQL**: Automated security scanning runs on push, PRs, and weekly schedule
- **Dependabot**: Monitors for security vulnerabilities in dependencies
- **Auto-merge**: Dependabot PRs automatically merge when all CI checks pass
- **Workflow Integration**: Auto-merge triggered after Build-Master and all VS Code version tests succeed
- **Critical**: Monitor auto-merged PRs and manual intervention available if needed

## Local Git Hooks (Husky)

Installed automatically on `npm ci` via the `prepare` script. Located in `.husky/`.

| Hook | Purpose | Runs |
| --- | --- | --- |
| `pre-commit` | ESLint on `src/**` + release-bump consistency check (if `package.json` `version` field changes, `CHANGELOG.md` must be staged with matching `## [X.Y.Z]` heading) | Every `git commit` |
| `commit-msg` | Enforces Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.) on the subject line | Every `git commit` |
| `pre-push` | Rejects any push whose remote ref matches `refs/tags/v*` (release tags must originate from the release workflow) | Every `git push` |

**Escape hatches:**
- `git commit --no-verify` skips `pre-commit` + `commit-msg`.
- `git push --no-verify` skips `pre-push`.
- `HUSKY=0` in the env disables all hooks (use only in containers/CI).

**Why no `pre-tag` / `pre-release` hook:** Git does not expose one, and Husky can only wrap Git-dispatched hooks. The `pre-commit` bump check + `pre-push` tag rejection cover the same ground: a bad bump can't be committed, and a stray tag can't be pushed. See [`AGENTS.md`](../AGENTS.md#why-there-is-no-pre-tag-or-pre-release-hook) for the design reasoning.