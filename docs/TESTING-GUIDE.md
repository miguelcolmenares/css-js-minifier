# Testing Guide

## Test Strategy Overview

The CSS & JS Minifier extension uses a comprehensive testing approach with VS Code's extension testing framework and Mocha. The test suite includes 29 tests covering all functionality with robust rate limiting and file management strategies.

## Test Structure

### Test Suites

1. **Main Functionality Tests (21 tests)**
   - Basic CSS/JS minification (in-place and new file)
   - File prefix configurations (`.min`, `-min`, `.compressed`, etc.)
   - Explorer context menu actions
   - Empty file and unsupported file type validation

2. **CSS nth-child Test Suite (2 tests)**
   - CSS nth-child selectors minification (in-place)
   - CSS nth-child selectors with new file creation
   - Validates URL encoding fixes for `+` characters

3. **Keybinding Test Suite (2 tests)**
   - Keyboard shortcut functionality
   - Command palette integration

4. **Configuration Test Suite (4 tests)**
   - `autoOpenNewFile` setting validation (enabled/disabled)
   - `minifiedNewFilePrefix` custom prefix configuration
   - `minifyInNewFile` vs in-place minification behavior
   - Complex configuration state management

## Rate Limiting Solutions

### Toptal API Constraints
- **Rate Limit**: 30 requests per minute
- **Impact**: Test suites with 29 tests trigger rate limiting without delays
- **Symptoms**: Tests fail with 429 HTTP status code or timeout errors

### Implemented Solutions

#### Strategic Test Delays
```typescript
/**
 * Rate limiting configuration for Toptal API tests
 */
const RATE_LIMIT_CONFIG = {
	// Delay between tests in milliseconds (3 seconds)
	TEST_DELAY_MS: 3000,
	// Maximum retries for failed requests
	MAX_RETRIES: 3,
	// Timeout for individual tests (5 seconds)
	TEST_TIMEOUT_MS: 5000
};

/**
 * Adds delay between tests to respect Toptal API rate limits
 */
async function delayBetweenTests(ms: number = RATE_LIMIT_CONFIG.TEST_DELAY_MS): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}
```

#### Enhanced Configuration Test Timing
```typescript
// Configuration tests require additional delays for VS Code setting updates
await config.update("autoOpenNewFile", true, true);
await delayBetweenTests(1000); // Wait for configuration to take effect

// File creation operations need processing time
await vscode.commands.executeCommand("extension.minifyInNewFile");
await delayBetweenTests(1000); // Wait for file creation
```

#### Extended Timeouts
```typescript
// All test suites use extended timeouts
suite("Test Suite Name", function () {
	this.timeout(RATE_LIMIT_CONFIG.TEST_TIMEOUT_MS); // 5 seconds per test
	
	this.afterEach(async function () {
		await delayBetweenTests(); // 3 seconds between tests
	});
});
```

## File Management & Test Isolation

### Temporary File Strategy
Configuration tests use temporary files to avoid modifying source fixtures:

```typescript
// Copy source file to avoid modification issues
const sourceFile = path.join(__dirname, "..", "..", "src", "test", "fixtures", "test.css");
const testFile = path.join(__dirname, "fixtures", "temp-test.css");
fs.copyFileSync(sourceFile, testFile);

// Use temporary file for testing
const cssUri = vscode.Uri.file(testFile);
const cssDocument = await vscode.workspace.openTextDocument(cssUri);

// Clean up both generated and temporary files
if (fs.existsSync(newFileUri.fsPath)) {
	fs.unlinkSync(newFileUri.fsPath);
}
if (fs.existsSync(testFile)) {
	fs.unlinkSync(testFile);
}
```

### Comprehensive Cleanup Strategy
Configuration test suite includes sophisticated cleanup:

```typescript
this.beforeAll(async function () {
	// Reset all configurations to defaults first
	const config = vscode.workspace.getConfiguration("css-js-minifier");
	await config.update("minifyInNewFile", true, true);
	await config.update("autoOpenNewFile", true, true);
	await config.update("minifiedNewFilePrefix", ".min", true);
	
	// Clean up any generated minified files
	const fixturesDir = path.join(__dirname, "fixtures");
	if (fs.existsSync(fixturesDir)) {
		const files = fs.readdirSync(fixturesDir);
		for (const file of files) {
			if (file.includes("min") || file.includes("compressed")) {
				const filePath = path.join(fixturesDir, file);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			}
		}
	}
	
	// Restore original fixture files from source
	const fixturesToRestore = ["test.css", "test.js", "nth-child-test.css"];
	for (const fixture of fixturesToRestore) {
		const srcPath = path.join(srcFixturesDir, fixture);
		const outPath = path.join(outFixturesDir, fixture);
		if (fs.existsSync(srcPath)) {
			const originalContent = fs.readFileSync(srcPath, 'utf8');
			fs.writeFileSync(outPath, originalContent);
		}
	}
});
```

### Sinon Spy Management
```typescript
// Clean up sinon spies after each test to prevent conflicts
this.afterEach(function () {
	sinon.restore();
});
```

## Running Tests

### VS Code Tasks (Recommended)

The project includes optimized VS Code tasks for efficient test execution. Access via `Ctrl/Cmd + Shift + P` → "Tasks: Run Task":

#### Main Test Tasks
- **"Test: Run All Tests"** - Complete test suite (29 tests) with full compilation and linting
- **"Test: Compile and Build Only"** - Prepare tests without running (TypeScript + webpack + lint + fixtures)

#### Individual Test Suites
- **"Test: Configuration Suite Only"** - Run only Configuration Test Suite (4 tests)
- **"Test: CSS nth-child Suite Only"** - Run only CSS nth-child Test Suite (2 tests)  
- **"Test: Keybinding Suite Only"** - Run only Keybinding Test Suite (2 tests)
- **"Test: Main Functionality Suite Only"** - Run only Main Functionality Test Suite (21 tests)

#### Advanced Testing
- **"Test: Specific Test by Name"** - Run specific test with prompt input (e.g., "autoOpenNewFile")
- **"Test: Quick Compile and Test"** - Fast TypeScript compilation without webpack/linting

#### Build & Watch Tasks
- **"npm: watch"** - Webpack watch mode for development
- **"npm: watch-tests"** - TypeScript watch mode for test files
- **"tasks: watch-tests"** - Combined build and test watching

### Command Line (Alternative)

```bash
# Complete test suite
npm test

# Individual suite execution
npx vscode-test --grep "Configuration Test Suite"
npx vscode-test --grep "CSS nth-child Test Suite"
npx vscode-test --grep "Keybinding Test Suite"

# Specific test execution
npx vscode-test --grep "autoOpenNewFile setting - enabled"

# Build only
npm run pretest
npm run compile-tests
npm run copy-fixtures
```

### Development Workflow

**For Feature Development:**
1. Start watch mode: `Ctrl/Cmd + Shift + P` → "Tasks: Run Task" → "tasks: watch-tests"
2. Run specific tests: "Test: Configuration Suite Only" (for configuration features)
3. Run full suite before commit: "Test: Run All Tests"

**For Bug Fixing:**
1. Identify failing suite: "Test: Run All Tests" 
2. Focus on specific suite: "Test: CSS nth-child Suite Only" (for CSS issues)
3. Target specific test: "Test: Specific Test by Name" → enter test name

**For CI/CD Validation:**
1. Full build verification: "Test: Compile and Build Only"
2. Complete test validation: "Test: Run All Tests"

### CI/CD Considerations
- GitHub Actions runs tests on multiple OS (macOS, Ubuntu, Windows)
- Each OS instance makes independent API requests
- Extended timeouts (10 minutes) to handle rate limiting
- Automatic retry logic implemented for network failures

## Test File Organization

```
src/test/
├── extension.test.ts          # Main test suite (29 tests)
├── fixtures/                  # Test data files
│   ├── test.css              # Basic CSS test file (22 chars)
│   ├── test.js               # Basic JS test file (176 chars)
│   ├── nth-child-test.css    # CSS nth-child test case (477 chars)
│   ├── empty.css             # Empty file test case
│   ├── empty.js              # Empty file test case
│   └── test.txt              # Unsupported file type
└── (auto-generated during pretest)
    └── out/test/fixtures/     # Copied fixtures with temporary files
```

## API Integration & URL Encoding

### CSS nth-child Selector Fix
Special handling for `+` characters in CSS selectors:

```typescript
// Manual encoding to preserve JavaScript syntax
const manuallyEncoded = 'input=' + encodeURIComponent(text);

// Prevents URLSearchParams from corrupting + characters
// OLD: URLSearchParams would convert "2n + 1" to "2n   1"
// NEW: Manual encoding preserves "2n + 1" correctly
```

### Toptal API Endpoints
- **CSS**: `https://www.toptal.com/developers/cssminifier/api/raw`
- **JavaScript**: `https://www.toptal.com/developers/javascript-minifier/api/raw`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Method**: POST with form-encoded data

## Test Data Management

### Expected Minification Results
```typescript
// CSS minification expectations
const cssMinifiedContent = "p{color:red}";

// JavaScript minification expectations  
const jsMinifiedContent = 'function test(){for(var r="Hello, World!",o="",e=0;e<r.length;e++)o+=String.fromCharCode(r.charCodeAt(e)+1);return o}';

// CSS nth-child expected result
const expectedMinified = ".container:nth-child(odd){background-color:#fff;margin:10px}div:nth-child(odd){color:#00f;padding:5px}.item:nth-child(3nof.special){font-weight:700;border:1px solid red}p:nth-child(2n){text-align:center;font-size:14px}.menu-item:nth-child(2n+1of.active){display:block;opacity:.8}";
```

### Fixture File Management
- **Original Location**: `src/test/fixtures/` (version controlled)
- **Test Location**: `out/test/fixtures/` (copied during pretest)
- **Temporary Files**: Created with unique names to avoid conflicts
- **Cleanup**: Automatic removal of generated and temporary files

## Debugging Test Failures

### Common Issues & Solutions

1. **Rate Limiting (429 Error)**
   - **Symptom**: Tests pass individually but fail in suite
   - **Solution**: Increase `TEST_DELAY_MS` to 4000ms or add individual test delays
   - **Detection**: Tests return original content unchanged

2. **Configuration Test Failures**
   - **Symptom**: `autoOpenNewFile` tests fail with "file not created"
   - **Solution**: Use temporary files and increase file creation delays
   - **Root Cause**: VS Code configuration updates are asynchronous

3. **File Path Issues**
   - **Symptom**: Fixture files not found
   - **Solution**: Ensure `npm run copy-fixtures` executed properly
   - **Debug**: Check `out/test/fixtures/` directory exists

4. **In-Place Modification Conflicts**
   - **Symptom**: Tests interfere with each other
   - **Solution**: Use unique temporary file names per test
   - **Prevention**: Comprehensive cleanup in `beforeAll` hooks

### Debug Strategies

1. **API Direct Testing**

```bash
# Test CSS minification directly
curl -X POST https://www.toptal.com/developers/cssminifier/api/raw \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "input=.container:nth-child(2n + 1) { color: red; }"
```

2. **Individual Test Execution**

```bash
# Run specific test by name
npx vscode-test --grep "autoOpenNewFile setting - enabled"

# Run only configuration tests
npx vscode-test --grep "Configuration Test Suite"
```

3. **Enhanced Debug Logging**

```typescript
// Add temporary debugging in tests
console.log('Original content length:', originalContent.length);
console.log('Minified content length:', minifiedContent.length);
console.log('File exists:', fs.existsSync(newFileUri.fsPath));
```

## Performance Considerations

### Test Execution Times

- **Full Suite**: ~2 minutes locally (with 3s delays)
- **CI Environment**: ~5-8 minutes (includes setup + rate limiting)
- **Configuration Tests**: ~20 seconds (4 tests with file operations)
- **nth-child Tests**: ~10 seconds (2 tests with API calls)

### Memory Usage

- **Extension Host**: Automatically managed by VS Code
- **Fixture Files**: Total ~1KB across all test files
- **Temporary Files**: Created/cleaned per test, minimal footprint
- **API Responses**: Small payloads, no memory concerns

### Optimization Strategies

1. **Parallel Execution**: Not recommended due to API rate limits
2. **Test Ordering**: Group API-intensive tests with longer delays
3. **Fixture Caching**: Source files remain unchanged, copied as needed
4. **Cleanup Batching**: Use `beforeAll` for bulk operations

## Best Practices

### Test Writing Guidelines

1. **Descriptive Names**: Remove "Issue #" prefixes, use clear functionality descriptions
2. **Setup/Cleanup**: Include comprehensive cleanup in each test suite
3. **Async Handling**: Always await API calls and file operations
4. **Error Messages**: Provide detailed assertions with file paths and expected values

### API Testing Standards

1. **Rate Limit Respect**: Minimum 3-second delays between API calls
2. **Realistic Data**: Test with actual CSS/JS that users would minify
3. **Error Handling**: Validate both success and failure scenarios
4. **Content Verification**: Assert specific minified output, not just "changed"

### CI/CD Integration

1. **Extended Timeouts**: 10-minute workflow timeouts for rate limiting
2. **Environment Variables**: No secrets required for Toptal API
3. **Artifact Collection**: Test results and coverage reports
4. **Retry Logic**: Built into test framework, not needed externally

### File Management

1. **Source Protection**: Never modify files in `src/test/fixtures/`
2. **Temporary Naming**: Use unique prefixes (`temp-test.css`, `temp-custom-test.css`)
3. **Complete Cleanup**: Remove both generated and temporary files
4. **Fixture Restoration**: Copy fresh content from source when needed

## Architecture Insights

### Test Suite Evolution

The test suite evolved through several iterations to achieve 100% reliability:

1. **Initial**: Basic API tests without rate limiting (frequent failures)
2. **v2**: Added delays but insufficient for configuration tests
3. **v3**: Implemented temporary file strategy for test isolation
4. **v4**: Comprehensive cleanup and configuration management
5. **Current**: 29/29 tests passing consistently with robust error handling

### Key Learnings

1. **Configuration Tests**: VS Code settings updates require explicit delays
2. **File Creation**: Asynchronous operations need additional wait time
3. **Test Isolation**: In-place modifications require temporary file strategy
4. **API Encoding**: Manual `encodeURIComponent` needed for CSS `+` characters
5. **Spy Management**: Sinon spies must be restored to prevent test interference

---

**Last Updated**: October 16, 2025  
**Extension Version**: 1.0.0  
**Test Suite**: 29 tests, 100% passing rate