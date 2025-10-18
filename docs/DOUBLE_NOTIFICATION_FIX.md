# Double Notification Fix - Verification Guide

## Issue Description
The extension was showing two notifications for a single minification event, caused by duplicate API calls in the auto-save minification flow.

## Root Cause
In `src/commands/minifyCommand.ts`, the `onSaveMinify` function had redundant minification logic:

**Before (buggy code):**
```typescript
export async function onSaveMinify(document: vscode.TextDocument): Promise<void> {
  // ... validation code ...
  
  // Line 251: First API call
  const result = await getMinifiedText(text, fileType);
  if (result) {
    const { minifiedText, stats } = result;
    
    if (shouldCreateNewFile) {
      // Line 258: Second API call inside processDocument!
      const options: MinifyOptions = {
        saveAsNewFile: true,
        filePrefix
      };
      await processDocument(document, options);  // ← Calls getMinifiedText AGAIN
    } else {
      // Line 264: Uses the result from first call
      await replaceDocumentContentAndSave(document, minifiedText, stats);
    }
  }
}
```

**Problem**: When `minifyInNewFile` config was true:
1. First call to `getMinifiedText` on line 251 (API call #1, notification #1)
2. Then `processDocument` calls `getMinifiedText` again (API call #2, notification #2)
3. Result: Double API call, double notification, wasted resources

## Solution Applied

**After (fixed code):**
```typescript
export async function onSaveMinify(document: vscode.TextDocument): Promise<void> {
  // ... validation code ...
  
  if (shouldCreateNewFile) {
    // Create new file with minified content
    // Use processDocument to handle the entire workflow (no duplicate API call)
    const options: MinifyOptions = {
      saveAsNewFile: true,
      filePrefix
    };
    await processDocument(document, options);  // ← Single API call
  } else {
    // For in-place minification, minify once and save
    const result = await getMinifiedText(text, fileType);
    if (result) {
      const { minifiedText, stats } = result;
      // Set flag to prevent recursive auto-minify when document.save() is called
      setSkipAutoMinify();
      // Replace the document content with the minified version (in-place) and save
      await replaceDocumentContentAndSave(document, minifiedText, stats);
    }
  }
}
```

**Changes**:
1. Removed redundant `getMinifiedText` call before `processDocument`
2. Let `processDocument` handle the entire minification workflow
3. Added `setSkipAutoMinify()` in in-place mode to prevent recursion

## Manual Verification Steps

### Test 1: Auto-save with "Save as New File" Option
1. Open VS Code with the extension installed
2. Open Settings: `Preferences: Open Settings (JSON)`
3. Set configuration:
   ```json
   {
     "css-js-minifier.minifyOnSave": true,
     "css-js-minifier.minifyInNewFile": true,
     "css-js-minifier.minifiedNewFilePrefix": ".min"
   }
   ```
4. Create a new CSS file: `test.css`
5. Add content:
   ```css
   body {
     margin: 0;
     padding: 0;
     color: red;
   }
   ```
6. Save the file (Ctrl+S / Cmd+S)
7. **Expected**: See ONE notification about minification success
8. **Expected**: `test.min.css` file is created
9. **Bug behavior (before fix)**: Would see TWO identical notifications

### Test 2: Auto-save with In-Place Minification
1. Open VS Code with the extension installed
2. Open Settings: `Preferences: Open Settings (JSON)`
3. Set configuration:
   ```json
   {
     "css-js-minifier.minifyOnSave": true,
     "css-js-minifier.minifyInNewFile": false
   }
   ```
4. Create a new JavaScript file: `test.js`
5. Add content:
   ```javascript
   function hello() {
     console.log("Hello World");
     return true;
   }
   ```
6. Save the file (Ctrl+S / Cmd+S)
7. **Expected**: See ONE notification about minification success
8. **Expected**: File content is minified in-place
9. **Expected**: NO infinite loop or repeated minifications

### Test 3: Manual Command (Regression Test)
1. Open a CSS or JS file
2. Run command: `Ctrl+Shift+P` → "Minify this File"
3. **Expected**: See ONE notification
4. **Expected**: File is minified
5. **Expected**: No duplicate notifications

### Test 4: Verify API Call Count
To verify only one API call is made:
1. Open Browser DevTools or use a network monitoring tool
2. Monitor network traffic to `toptal.com` domains
3. Perform Test 1 or Test 2
4. **Expected**: See only ONE POST request to the minification API
5. **Bug behavior (before fix)**: Would see TWO identical POST requests

## Additional Fix: Linting Error in debug-l10n.ts
Fixed ESLint errors by replacing `console.log` calls with VS Code's Output Channel API.

## Files Changed
1. `src/commands/minifyCommand.ts` - Main fix for double notification
2. `src/debug-l10n.ts` - Fixed linting errors

## Impact
- ✅ Eliminates duplicate API calls (50% reduction in API usage for auto-save)
- ✅ Removes annoying duplicate notifications
- ✅ Improves performance and user experience
- ✅ Reduces risk of hitting API rate limits
- ✅ Maintains all existing functionality
