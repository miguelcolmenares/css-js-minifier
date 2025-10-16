# VS Code Tasks for CSS & JS Minifier Extension

This directory contains optimized VS Code tasks to streamline development and testing workflows.

## How to Use Tasks

### Via Command Palette (Recommended)
1. Open Command Palette: `Ctrl/Cmd + Shift + P`
2. Type: "Tasks: Run Task"
3. Select the desired task from the list

### Via Keyboard Shortcuts
- `Ctrl/Cmd + Shift + P` → "Tasks: Run Task" → Select task
- `Ctrl/Cmd + Shift + B` → Runs default build task (watch mode)

## Available Tasks

### 🧪 Testing Tasks

#### **Test: Run All Tests** *(Default Test Task)*
- **Purpose**: Complete test suite with full compilation and linting
- **Tests**: All 29 tests across 4 suites
- **Duration**: ~2 minutes
- **Use When**: Before commits, full validation

#### **Test: Configuration Suite Only**
- **Purpose**: Test configuration management features
- **Tests**: 4 tests (autoOpenNewFile, prefixes, etc.)
- **Duration**: ~20 seconds
- **Use When**: Working on settings or configuration features

#### **Test: CSS nth-child Suite Only**
- **Purpose**: Test CSS nth-child selector minification
- **Tests**: 2 tests (in-place and new file)
- **Duration**: ~7 seconds
- **Use When**: Working on CSS encoding or selector issues

#### **Test: Keybinding Suite Only**
- **Purpose**: Test keyboard shortcuts and command palette
- **Tests**: 2 tests
- **Duration**: ~5 seconds
- **Use When**: Working on VS Code integration features

#### **Test: Main Functionality Suite Only**
- **Purpose**: Test core minification features
- **Tests**: 21 tests (prefixes, context menus, basic minification)
- **Duration**: ~1.5 minutes
- **Use When**: Working on core API or file processing features

#### **Test: Specific Test by Name**
- **Purpose**: Run a specific test by entering its name
- **Tests**: 1 test (you choose)
- **Duration**: Variable
- **Use When**: Debugging specific failing tests
- **Note**: You'll be prompted to enter the test name (e.g., "autoOpenNewFile")

### 🔧 Build Tasks

#### **Test: Compile and Build Only**
- **Purpose**: Prepare for testing without running tests
- **Includes**: TypeScript compilation, webpack build, ESLint, fixture copying
- **Duration**: ~10 seconds
- **Use When**: Checking for compilation errors before testing

#### **Test: Quick Compile and Test**
- **Purpose**: Fast TypeScript compilation only
- **Includes**: Only TypeScript compilation
- **Duration**: ~3 seconds
- **Use When**: Quick syntax checking

### 🔄 Watch Tasks

#### **npm: watch** *(Default Build Task)*
- **Purpose**: Webpack watch mode for extension development
- **Monitors**: Source TypeScript files
- **Auto-rebuilds**: On file changes
- **Use When**: Active development

#### **npm: watch-tests**
- **Purpose**: TypeScript watch mode for test files
- **Monitors**: Test TypeScript files
- **Auto-compiles**: On test file changes
- **Use When**: Writing or debugging tests

#### **tasks: watch-tests**
- **Purpose**: Combined watch mode (extension + tests)
- **Includes**: Both webpack watch and test compilation watch
- **Use When**: Full development mode

## Task Dependencies

Some tasks automatically run prerequisite tasks:

```
Test: Configuration Suite Only
├── Test: Compile and Build Only
    ├── npm run compile-tests
    ├── npm run compile
    ├── npm run lint
    └── npm run copy-fixtures
```

## Development Workflows

### 🚀 Feature Development
```
1. Start combined watch: "tasks: watch-tests"
2. Write code and tests
3. Test specific suite: "Test: Configuration Suite Only"
4. Final validation: "Test: Run All Tests"
```

### 🐛 Bug Fixing
```
1. Identify issue: "Test: Run All Tests"
2. Focus on failing suite: "Test: CSS nth-child Suite Only"
3. Target specific test: "Test: Specific Test by Name"
4. Verify fix: "Test: Run All Tests"
```

### ✅ Pre-commit Validation
```
1. Build check: "Test: Compile and Build Only"
2. Full test suite: "Test: Run All Tests"
3. Ensure 29/29 tests passing
```

## Troubleshooting

### Task Not Found
- Ensure you're in the correct workspace
- Reload VS Code window: `Ctrl/Cmd + Shift + P` → "Developer: Reload Window"

### Build Errors
- Run "Test: Compile and Build Only" to see detailed error messages
- Check TypeScript compilation errors
- Verify ESLint configuration

### Test Failures
- Use specific suite tasks to isolate issues
- Check for API rate limiting (add delays if needed)
- Verify fixture files are correctly copied

## Performance Tips

- Use specific suite tasks during development (faster than full suite)
- Keep watch tasks running during active development
- Use "Test: Quick Compile and Test" for syntax checking
- Run full test suite only before commits

## Configuration

Task configurations are in `.vscode/tasks.json`. Key settings:

- **Problem Matchers**: `$tsc`, `$eslint-stylish` for error detection
- **Presentation**: Shared terminal panel for efficiency
- **Dependencies**: Automatic prerequisite task execution
- **Input Variables**: Prompts for test name in specific test task

---

**Last Updated**: October 16, 2025  
**Extension Version**: 1.0.0