<!-- agents-toolkit:planning-doc issue=259 -->
# Plan for #259: validate `minifiedNewFilePrefix`

Temporary planning document. It is deleted before the pull request is opened, because docs-sitekit publishes every Markdown file in `docs/`.

## Problem

`css-js-minifier.minifiedNewFilePrefix` has an `enum` in `package.json`, but VS Code only uses it for the Settings UI. A value written by hand in `settings.json` reaches the extension unchanged (`settings.get('minifiedNewFilePrefix') as string`, read in two places in `src/commands/minifyCommand.ts`) and `createMinifiedFileName` inserts it into the path without any check.

## Reproduction on current master (5ef0a87, before any change)

A throwaway extension-host test (not committed) set the prefix, ran `extension.minifyInNewFile` on `<tmp>/a/b/src/style.css` in the OS temp folder, and listed everything created under `<tmp>`. VS Code 1.144.0, macOS. Observed:

| Prefix | Result |
| --- | --- |
| `.min` (control) | `src/style.min.css`, as expected |
| `/../escaped` | `src/escaped.css`. Same folder, but the name has nothing to do with the source: `..` is resolved lexically. |
| `/../../escaped` | **`a/b/escaped.css`: one folder above the source folder.** The issue is confirmed. |
| `../../../escaped` | **`a/b/escaped.css`**, also outside the source folder. |
| `a/b` | A new folder is created: `src/stylea/b.css`. The file service creates missing parent folders. |
| `/abs/olute` | Two new folders: `src/style/abs/olute.css`. |
| `..\escaped`, `..\..\escaped` | On macOS a backslash is an ordinary file name character, so the result is a single odd name, `src/style..\escaped.css`. On Windows a backslash is a separator, so these would be path traversal there. **Not verified: there is no Windows host here.** |
| `` (empty string) | **Nothing is written as a new file and the original is minified in place** (`p{color:red}`). `processDocument` tests `options.saveAsNewFile && options.filePrefix`, an empty string is falsy, so it falls through to `replaceDocumentContent`. The overwrite guard from #258 in `saveAsNewFile` is never reached. This is a case the issue did not list. |
| `x` + NUL + `y` | Nothing is written. Node rejects the path and the command fails with the raw `TypeError [ERR_INVALID_ARG_VALUE] ... must be a string ... without null bytes` as an unhandled `FileSystemError`, with no notification that names the setting. |

The original file is never overwritten by the path-bearing values; the empty string is the only one that changes it.

## Design

### What to accept

Any string of 1 to 32 characters made only of ASCII letters, digits, `.`, `-` and `_`, and not containing `..`. Not only the six `enum` values.

Why not the `enum` only:

- The setting is documented as "the text added before the extension". Today a user can have `.mini`, `_min` or `.opt` in `settings.json` and it works; the issue's third acceptance criterion is that valid values "keep behaving exactly as today". An enum-only check would break those users for no safety gain.
- The character set already rules out every path syntax: no `/`, `\`, `:`, NUL, space, or control character. The `..` ban and the length limit are belts and braces (a result of `.` or `..` as a whole name, absurdly long names).
- The `enum` in `package.json` stays as it is: it drives the Settings UI and the translated descriptions.

ASCII only is deliberate: it is a suffix for a technical file name, and the narrow character class is easy to state in the docs and the message.

### Where

`src/utils/validators.ts` already holds the shared validators and is imported by `minifyCommand.ts`, so both entry points use the same code:

- `isValidFilePrefix(value: unknown): value is string`, pure and unit tested.
- `reportInvalidFilePrefix(value, notifyOnce)`, shows the error. For the command path it shows every time. For minify on save it shows once per session per offending value, tracked in a module-level `Set` keyed by the JSON form of the value. A reload of the window starts a new session. `resetInvalidFilePrefixNotifications()` clears the set for tests.
- `getValidFilePrefix(options)`, reads the setting, validates, reports, and returns the prefix or `undefined`.

### Behaviour on an invalid value

- Nothing is written and nothing is minified, in either path. No fallback to the default, so the user notices.
- An error names the setting and the offending value (shown as JSON so an empty string or a NUL are visible, truncated if long).
- `processDocument` also refuses to continue when asked to save as a new file without a valid prefix, so the empty-string fall-through to in-place minification cannot come back.

### Imports

The test host runs the `tsc` output in `out/`, where the `@/` alias does not resolve. To test `onSaveMinify` directly (the real listener is only registered at activation when `minifyOnSave` is on, so the host cannot trigger it) the runtime `@/` imports in `minifyCommand.ts`, `minificationService.ts` and the two strategies become relative imports, as `fileService.ts` already does. Webpack resolves both forms.

## Phases

1. Reproduce on master (done, above).
2. Implement the validators, wire both entry points, fix the empty-string fall-through.
3. l10n: one new runtime string, seven bundles, key counts in the docs.
4. Tests: unit tests for `isValidFilePrefix` and the reporting; extension-host tests for the command path and for `onSaveMinify`. Prove they fail on the old code.
5. Docs: `docs/CONFIGURATION.md`, `docs/ARCHITECTURE.md` (the Workspace Trust paragraph says the prefix is inserted unchecked), `CHANGELOG.md`, test totals.
6. Validate (lint, tsc, markdownlint, prettier, full suite), `core-review` until clean, push.

## Testing strategy

- Unit: every `enum` value, a custom valid prefix, and invalid ones: `/../x`, `..\x`, `a/b`, empty, NUL, overlong, `..`, non-string.
- Command path (`extension.minifyInNewFile`): invalid prefix writes nothing, leaves the source untouched, shows the error each time; valid prefixes still work.
- On-save path (`onSaveMinify` imported from `out/`): invalid prefix writes nothing and shows the error once per value; a different bad value shows it again; valid still works.
- Cannot be covered: the real `onDidSaveTextDocument` registration (decided at activation), and Windows backslash separators.
