# CSS & JS Minifier Extension - AI Developer Guide

## Project Overview
This is a VS Code extension that minifies CSS and JavaScript files using the Toptal API. The extension provides commands, context menu options, keyboard shortcuts, and auto-minification on save.

## Architecture & Key Components

### Core Extension Structure (Modular Architecture)
- **`src/extension.ts`**: Clean entry point (81 lines) - handles activation, command registration, and configuration
- **`src/commands/`**: Command handlers for VS Code integration
  - `minifyCommand.ts`: Unified command logic with processDocument() core function
  - `index.ts`: Command exports with comprehensive documentation
- **`src/services/`**: Business logic and external integrations
  - `minificationService.ts`: Toptal API communication with error handling
  - `fileService.ts`: File system operations and filename utilities
  - `index.ts`: Service exports with module documentation
- **`src/utils/`**: Reusable validation and utility functions
  - `validators.ts`: File type and content validation with user feedback
  - `index.ts`: Utility exports with module documentation
- **Two primary commands**: `extension.minify` (in-place) and `extension.minifyInNewFile` (creates `.min` files)
- **External API dependency**: Uses Toptal's CSS/JS minification APIs via HTTP POST requests
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
- **Separation of Concerns**: Each module has a single responsibility
- **Code Reusability**: No duplicate validation or API logic
- **Enhanced Testability**: Pure functions easier to unit test
- **Improved Maintainability**: 63% reduction in main file size (220→81 lines)
- **Better Documentation**: Comprehensive JSDoc with examples throughout
- **Scalability**: Easy to add new features without touching core logic

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

### Build & Watch
- **Development**: `npm run watch` (webpack watch mode)
- **Testing**: `npm run watch-tests` (TypeScript compilation watch)
- **Production**: `npm run package` (optimized webpack build)
- **Combined**: Use VS Code task `tasks: watch-tests` for both

### VS Code Tasks (Recommended Development Workflow)
The project includes optimized VS Code tasks for efficient development. Access via `Ctrl/Cmd + Shift + P` → "Tasks: Run Task":

#### Testing Tasks
- **"Test: Run All Tests"** - Complete 29-test suite with compilation and linting (~2 min)
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
2. Full validation: "Test: Run All Tests" (ensure 29/29 passing)

### Pre-Commit Testing
- **CRITICAL**: Always run "Test: Run All Tests" before committing/pushing changes
- **Validates**: TypeScript compilation, webpack build, ESLint rules, and all extension functionality
- **Test Suite**: 29 comprehensive tests covering all minification scenarios and edge cases
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

### API Integration Pattern
HTTP requests to Toptal APIs with form-encoded data:
- CSS: `https://www.toptal.com/developers/cssminifier/api/raw`
- JS: `https://www.toptal.com/developers/javascript-minifier/api/raw`
- Uses `URLSearchParams` for proper form encoding

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
- **`src/commands/minifyCommand.ts`**: Main command handlers with processDocument() core logic
- **`src/services/minificationService.ts`**: Toptal API integration with comprehensive error handling
- **`src/services/fileService.ts`**: File operations (save, replace content, filename generation)
- **`src/utils/validators.ts`**: File type and content validation with user feedback
- **`src/*/index.ts`**: Module exports with documentation for each layer

### Documentation Standards
- **Comprehensive JSDoc**: Every function has detailed documentation with examples
- **Type Safety**: Interfaces and types for all major data structures
- **Error Handling**: Documented side effects and error conditions
- **Usage Examples**: Practical code examples in documentation

## Testing & Debugging
- Test files expect specific minified output (hardcoded in test file)
- **Recommended**: Use VS Code tasks for efficient testing workflows
- **Quick testing**: Use "Test: Configuration Suite Only" or specific suite tasks
- **Full validation**: Use "Test: Run All Tests" before commits
- Use `npm run pretest` to compile, lint, and copy fixtures before testing
- Extension activates on `onSaveTextDocument` event for auto-minification feature
- Error handling shows user-friendly messages via `vscode.window.showErrorMessage`

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