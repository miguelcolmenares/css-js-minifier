# Double Notification Fix - Flow Diagrams

## Before Fix (Buggy Behavior)

### Scenario 1: Auto-save with "Save as New File" (minifyInNewFile = true)

```
User saves file (Ctrl+S)
         ↓
onDidSaveTextDocument event fires
         ↓
onSaveMinify() called
         ↓
┌────────────────────────────────────────┐
│ Line 251: getMinifiedText(text, type) │ ← API Call #1
│   - Makes HTTP POST to Toptal API     │
│   - Shows notification #1              │
│   - Returns { minifiedText, stats }    │
└────────────────────────────────────────┘
         ↓
    result exists?
         ↓ YES
┌────────────────────────────────────────┐
│ Line 258: processDocument(doc, opts)  │
│   ↓                                    │
│   Line 87: getMinifiedText(text, type)│ ← API Call #2 (DUPLICATE!)
│   - Makes HTTP POST to Toptal API     │
│   - Shows notification #2 (DUPLICATE!) │
│   - Returns same result again          │
└────────────────────────────────────────┘
         ↓
   saveAsNewFile() called
         ↓
   File created and saved

RESULT: 2 API calls, 2 notifications ❌
```

### Scenario 2: Auto-save with In-place (minifyInNewFile = false)

```
User saves file (Ctrl+S)
         ↓
onDidSaveTextDocument event fires
         ↓
onSaveMinify() called
         ↓
┌────────────────────────────────────────┐
│ Line 251: getMinifiedText(text, type) │ ← API Call #1
│   - Makes HTTP POST to Toptal API     │
│   - Returns { minifiedText, stats }    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ replaceDocumentContentAndSave()        │
│   ↓                                    │
│   replaceDocumentContent()             │
│   - Shows notification #1              │
│   ↓                                    │
│   document.save()                      │
│   - Triggers onDidSaveTextDocument!    │
│   - Could cause infinite loop          │
│   - But minified content won't change  │
└────────────────────────────────────────┘

RESULT: 1 API call, 1 notification
        But risk of recursion ⚠️
```

## After Fix (Correct Behavior)

### Scenario 1: Auto-save with "Save as New File" (minifyInNewFile = true)

```
User saves file (Ctrl+S)
         ↓
onDidSaveTextDocument event fires
         ↓
onSaveMinify() called
         ↓
    shouldCreateNewFile = true
         ↓
┌────────────────────────────────────────┐
│ Line 258: processDocument(doc, opts)  │
│   ↓                                    │
│   validateFileType() ✓                 │
│   validateContentLength() ✓            │
│   ↓                                    │
│   Line 87: getMinifiedText(text, type)│ ← API Call #1 (ONLY ONE!)
│   - Makes HTTP POST to Toptal API     │
│   - Returns { minifiedText, stats }    │
│   ↓                                    │
│   saveAsNewFile(minified, name, stats) │
│   - Creates new file                   │
│   - Shows notification #1 (ONLY ONE!)  │
└────────────────────────────────────────┘

RESULT: 1 API call, 1 notification ✅
```

### Scenario 2: Auto-save with In-place (minifyInNewFile = false)

```
User saves file (Ctrl+S)
         ↓
onDidSaveTextDocument event fires
         ↓
onSaveMinify() called
         ↓
    shouldCreateNewFile = false
         ↓
┌────────────────────────────────────────┐
│ Line 261: getMinifiedText(text, type) │ ← API Call #1 (ONLY ONE!)
│   - Makes HTTP POST to Toptal API     │
│   - Returns { minifiedText, stats }    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ Line 265: setSkipAutoMinify()          │
│   - Sets skipNextAutoMinify = true     │
│   - Starts 3-second timeout            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ replaceDocumentContentAndSave()        │
│   ↓                                    │
│   replaceDocumentContent()             │
│   - Shows notification #1 (ONLY ONE!)  │
│   ↓                                    │
│   document.save()                      │
│   - Triggers onDidSaveTextDocument     │
└────────────────────────────────────────┘
         ↓
onSaveMinify() called AGAIN
         ↓
┌────────────────────────────────────────┐
│ Check: skipNextAutoMinify = true?      │
│   ↓ YES                                │
│ Reset flag and RETURN early            │
│ - No minification performed            │
│ - Recursion prevented ✓                │
└────────────────────────────────────────┘

RESULT: 1 API call, 1 notification ✅
        No recursion ✅
```

## Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| API calls (new file mode) | 2 calls | 1 call ✅ |
| Notifications (new file mode) | 2 messages | 1 message ✅ |
| Recursion protection (in-place) | None | setSkipAutoMinify() ✅ |
| Performance | Wasted API quota | Efficient ✅ |
| User experience | Annoying duplicates | Clean single message ✅ |

## Code Changes

### src/commands/minifyCommand.ts

**Removed (lines 250-267 old code):**
```typescript
// Minify the content using the minification service
const result = await getMinifiedText(text, fileType);  // ← Redundant call
if (result) {
    const { minifiedText, stats } = result;
    
    if (shouldCreateNewFile) {
        const options: MinifyOptions = {
            saveAsNewFile: true,
            filePrefix
        };
        await processDocument(document, options);  // ← Duplicate call inside
    } else {
        await replaceDocumentContentAndSave(document, minifiedText, stats);
    }
}
```

**Added (lines 251-269 new code):**
```typescript
if (shouldCreateNewFile) {
    // Create new file with minified content
    // Use processDocument to handle the entire workflow (no duplicate API call)
    const options: MinifyOptions = {
        saveAsNewFile: true,
        filePrefix
    };
    await processDocument(document, options);  // ← Single call, handles everything
} else {
    // For in-place minification, minify once and save
    const result = await getMinifiedText(text, fileType);
    if (result) {
        const { minifiedText, stats } = result;
        // Set flag to prevent recursive auto-minify when document.save() is called
        setSkipAutoMinify();  // ← NEW: Prevent recursion
        // Replace the document content with the minified version (in-place) and save
        await replaceDocumentContentAndSave(document, minifiedText, stats);
    }
}
```

## Performance Impact

### Before Fix
- API calls per auto-save (new file mode): **2 calls**
- Notification spam: **2 messages**
- API quota usage: **2x normal**
- Time to complete: **~2-3 seconds** (2 sequential API calls)

### After Fix
- API calls per auto-save: **1 call** (50% reduction ✅)
- Notification spam: **1 message** (clean UX ✅)
- API quota usage: **1x normal** (efficient ✅)
- Time to complete: **~1-1.5 seconds** (single API call ✅)
