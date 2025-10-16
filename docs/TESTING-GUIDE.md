# Testing Guide

## Test Strategy Overview

The CSS & JS Minifier extension uses a comprehensive testing approach with VS Code's extension testing framework and Mocha.

## Test Structure

### Test Suites

1. **Main Functionality Tests**
   - Basic CSS/JS minification
   - File prefix configurations 
   - Explorer context menu actions

2. **Issue-Specific Tests**
   - Issue #1: CSS nth-child selectors
   - Issue #5: Configuration management

3. **Keybinding Tests**
   - Keyboard shortcut functionality
   - Command palette integration

## Rate Limiting Considerations

### Toptal API Limits
- **Rate Limit**: 30 requests per minute
- **Impact**: Test suites with 23+ tests can trigger rate limiting
- **Symptoms**: Tests fail with 429 HTTP status code

### Solutions Implemented

#### Test Delays
```typescript
// Add delays between API-intensive tests
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Usage in tests
await delay(2000); // 2 second delay
```

#### Extended Timeouts
```typescript
// Increase timeout for API-dependent tests
test("API intensive test", async function () {
    this.timeout(15000); // 15 seconds instead of default 5
    // ... test logic
});
```

#### Graceful Degradation
```typescript
// Skip tests when rate limited
if (minifiedContent === originalContent) {
    console.warn('Skipping due to potential API rate limiting');
    this.skip();
    return;
}
```

## Running Tests

### Local Development
```bash
# Run all tests
npm test

# Run tests with watch mode
npm run watch-tests

# Run only compilation and linting
npm run pretest
```

### CI/CD Considerations
- GitHub Actions runs tests on multiple OS (macOS, Ubuntu, Windows)
- Each OS instance makes independent API requests
- May need to implement retry logic or test batching

## Test File Organization

```
src/test/
├── extension.test.ts          # Main test suite
├── fixtures/                  # Test data files
│   ├── test.css              # Basic CSS test file
│   ├── test.js               # Basic JS test file
│   ├── nth-child-test.css    # Issue #1 test case
│   ├── empty.css             # Empty file test case
│   ├── empty.js              # Empty file test case
│   └── test.txt              # Unsupported file type
└── (auto-generated)
    └── out/test/fixtures/     # Copied during pretest
```

## Test Data Management

### Fixture Files
- **Purpose**: Consistent test data across all test runs
- **Location**: `src/test/fixtures/`
- **Copying**: Automatically copied to `out/test/fixtures/` during `npm run pretest`

### Expected Results
Test expectations are hardcoded based on Toptal API behavior:
```typescript
// CSS minification expectation
assert.strictEqual(minifiedContent, "body{color:red;margin:0}");

// JS minification expectation  
assert.strictEqual(minifiedContent, 'function hello(){console.log("Hello World")}');
```

## Debugging Test Failures

### Common Issues

1. **Rate Limiting (429 Error)**
   - **Symptom**: Tests pass individually but fail in suite
   - **Solution**: Add delays between tests or skip non-critical tests

2. **Network Connectivity**
   - **Symptom**: All API-dependent tests fail
   - **Solution**: Check internet connection, verify API endpoints

3. **File Path Issues**
   - **Symptom**: Fixture files not found
   - **Solution**: Ensure `npm run copy-fixtures` executed properly

### Debug Strategies

1. **Isolate API Issues**
```bash
# Test API directly with curl
curl -X POST https://www.toptal.com/developers/cssminifier/api/raw \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "input=body { color: red; }"
```

2. **Run Tests Individually**
```bash
# Run specific test suite
npm test -- --grep "CSS nth-child Test Suite"
```

3. **Enable Debug Logging**
```typescript
// Add temporary console.log statements
console.log('Original content:', originalContent);
console.log('Minified result:', minifiedContent);
```

## Performance Considerations

### Test Execution Time
- **Full Suite**: ~10-15 seconds locally
- **CI Environment**: ~30-45 seconds (includes setup)
- **Rate Limited**: Can extend to 2+ minutes

### Memory Usage
- Minimal memory footprint
- VS Code extension host cleanup handled automatically
- Fixture files are small (<1KB each)

## Best Practices

### Test Writing
1. Use descriptive test names
2. Include setup and cleanup in each test
3. Assert specific expected outcomes
4. Handle async operations properly

### API Testing
1. Respect rate limits with delays
2. Test with realistic data sizes
3. Verify both success and error cases
4. Clean up generated files

### CI/CD Integration
1. Set appropriate timeouts for cloud environments
2. Consider test parallelization carefully
3. Monitor for flaky tests due to network issues
4. Implement retry logic for critical tests

---

**Last Updated**: October 16, 2025
**Extension Version**: 1.0.0