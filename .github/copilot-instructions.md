# CSS & JS Minifier Extension - AI Developer Guide

## Project Overview
This is a VS Code extension that minifies CSS and JavaScript files using the Toptal API. The extension provides commands, context menu options, keyboard shortcuts, and auto-minification on save.

## Architecture & Key Components

### Core Extension Structure
- **`src/extension.ts`**: Main extension entry point with activation/deactivation lifecycle
- **Two primary commands**: `extension.minify` (in-place) and `extension.minifyInNewFile` (creates `.min` files)
- **External API dependency**: Uses Toptal's CSS/JS minification APIs via HTTP POST requests
- **File handling**: Supports both active editor and explorer context actions

### Command Registration Pattern
Commands are registered in `activate()` and follow this pattern:
```typescript
const command = vscode.commands.registerCommand("extension.commandName", async () => {
  // Get active editor OR explorer selection
  // Validate file type (css/javascript only)
  // Call Toptal API for minification
  // Apply changes via WorkspaceEdit or create new file
});
```

### Configuration System
Three settings in `package.json` contribute section:
- `minifyOnSave`: Auto-minify when saving files
- `minifyInNewFile`: Save to new file instead of overwriting
- `minifiedNewFilePrefix`: Customize suffix (`.min`, `-min`, `.compressed`, etc.)

## Development Workflows

### Build & Watch
- **Development**: `npm run watch` (webpack watch mode)
- **Testing**: `npm run watch-tests` (TypeScript compilation watch)
- **Production**: `npm run package` (optimized webpack build)
- **Combined**: Use VS Code task `tasks: watch-tests` for both

### Pre-Commit Testing
- **CRITICAL**: Always run `npm test` before committing/pushing changes
- **Validates**: TypeScript compilation, webpack build, ESLint rules, and all extension functionality
- **Test Suite**: 23 comprehensive tests covering all minification scenarios and edge cases
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

## Key Files for Extension Development
- **`package.json`**: Command definitions, menus, keybindings, and configuration schema
- **`src/extension.ts`**: All core functionality and API integration
- **`webpack.config.js`**: Node.js target for VS Code extension bundling
- **`src/test/extension.test.ts`**: Comprehensive test suite with fixture-based testing

## Testing & Debugging
- Test files expect specific minified output (hardcoded in test file)
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