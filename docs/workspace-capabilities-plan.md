<!-- agents-toolkit:planning-doc issue=243 -->
# Plan: workspace capabilities and file URI handling (issue #243)

## Problem statement

`package.json` declares no `capabilities`, and `Minify and Save as New File` builds its output
location with `vscode.Uri.file(...)`, which always means the local `file:` scheme. Two decisions
were never made explicitly (virtual workspaces, untrusted workspaces) and one of them has a
concrete bug behind it.

## Verified facts (VS Code docs, checked while planning)

- [Virtual workspaces guide](https://code.visualstudio.com/api/extension-guides/virtual-workspaces):
  an extension that declares nothing defaults to `virtualWorkspaces: true`. `Uri.fsPath` "can only be
  used when the URI scheme is `file`", and `vscode.workspace.fs` is the portable way to touch files.
  The object form (`{ supported: false | "limited", description }`) is for no or partial support.
- [Workspace Trust guide](https://code.visualstudio.com/api/extension-guides/workspace-trust):
  an extension that declares nothing is "treated as not supporting Workspace Trust" and is disabled
  in Restricted Mode. The issue's premise that the missing declaration means "supports untrusted
  workspaces" is therefore wrong for untrusted workspaces (right for virtual ones). Forms:
  `true`, `false` or `"limited"`. `description` is required for `false` and `"limited"` and should
  live in `package.nls.json`. `restrictedConfigurations` lists settings whose workspace-defined
  values are withheld in Restricted Mode.

## Current architecture: who assumes `file:`

| Location | What it does | Assumes `file:`? |
|---|---|---|
| `src/services/fileService.ts` `saveAsNewFile` | `vscode.Uri.file(newFileName)`, then `workspace.fs.writeFile` and `showTextDocument` | **Yes**, the bug |
| `src/commands/minifyCommand.ts` `processDocument` | `createMinifiedFileName(document.fileName, prefix)`: `fileName` is the `fsPath`, which drops scheme and authority | **Yes**, feeds the line above |
| `src/services/fileService.ts` `replaceDocumentContent` | `WorkspaceEdit` on `document.uri`, `document.save()`; `document.fileName` only for the basename in the notification | No |
| `src/services/fileService.ts` `saveDocumentSilently` | `document.save()` | No |
| `src/commands/minifyCommand.ts` `resolveTargetDocument` | `openTextDocument(uri)` with the URI VS Code passes in | No |
| `src/commands/minifyCommand.ts` `minifyCommand`, `onSaveMinify` | key `processingDocuments` by `document.uri.toString()`, delegate to the above | No |
| `src/extension.ts` | registers commands and the save listener, builds no URIs | No |
| `package.json` menus and keybindings | `resourceLangId`, `editorTextFocus`: scheme-agnostic | No |

No source file imports Node's `fs` or reads `workspaceFolders`. Minification itself works on the
document text in memory (`getMinifiedText`), so it does not depend on the file system.

## Proposed changes

### 1. Virtual workspaces: fix the code, declare `virtualWorkspaces: true`

- Add `createMinifiedUri(source: Uri, prefix)` in `fileService.ts`: `source.with({ path:
  createMinifiedFileName(source.path, prefix), query: '', fragment: '' })`. Scheme and authority are
  kept, so the new file lands on the same file system as the source. Query and fragment are dropped
  because they describe a view of the source (for example a revision), not a place to write, and
  `Uri.file` never produced them either.
- `saveAsNewFile` takes the target `Uri` instead of a path string. The success message uses
  `path.posix.basename(uri.path)` (URI paths always use `/`).
- `processDocument` calls `createMinifiedUri(document.uri, prefix)`.
- Local workspaces: for `file:` URIs `source.with({ path })` equals `Uri.file(fsPath)` of the same
  path, so behaviour does not change. The existing 58-plus tests cover it.
- Why `true` and not `"limited"` or `false`: after the fix nothing in the extension needs a local
  disk. A read-only provider fails the write with its own error, which is the correct signal.
  The extension has no `browser` entry point (native Rust bindings), so a virtual workspace only
  occurs in a desktop or remote extension host where it loads.

### 2. Untrusted workspaces: `"limited"` with three restricted settings

Reviewed what a workspace can influence. Workspace settings (`.vscode/settings.json`) can set all
five settings of the extension. The extension runs no workspace code, spawns no process and uses
no network. But `minifiedNewFilePrefix` is read with `settings.get(...)` and inserted into the
target path **without any runtime check**: the `enum` in the schema only validates the editor UI,
not values read from a file. `createMinifiedFileName('/a/b/style.css', '/../../x')` yields
`/a/b/style/../../x.css`, which resolves to `/a/x.css`. A repository could therefore make a
save (with `minifyOnSave` and `minifyInNewFile` set by the workspace) or a manual `Minify and Save
as New File` write minified, attacker-controlled content to a `.css` or `.js` file outside the
workspace folder. Confirmed with a throwaway test in the extension host: a prefix of
`/../escaped` wrote `escaped.css` one level up from the document's own directory in the same
way (the exact `..` count only changes how far up it goes).

Options considered:

- `true`: least restrictive, but leaves the above open in Restricted Mode. Rejected.
- `false`: safe, but disables a tool that needs no trust for its main job (minifying the open
  document). Without any declaration the extension is already disabled in Restricted Mode today, so
  this would change nothing, and it is more restrictive than needed.
- `"limited"` with `restrictedConfigurations`: keeps the commands working and removes the vector.
  **Chosen.**

Restricted settings: `css-js-minifier.minifiedNewFilePrefix` (the traversal vector, affects the
manual command too), `css-js-minifier.minifyOnSave` and `css-js-minifier.minifyInNewFile` (a
workspace should not be able to turn on silent rewrites or new-file writes on save). Left
unrestricted: `autoOpenNewFile` and `showSizeReduction`, which only affect UI.

Not done on purpose: validating the prefix at runtime. In a trusted workspace or in user settings
the value is the user's own decision, and a runtime guard would need a new user-facing error
string in the seven l10n bundles. Reported as a follow-up observation instead.

`description` is a user-visible string, so it goes into `package.nls.json` as
`capabilities.untrustedWorkspaces.description` and into all six translated files (15 keys total).
`virtualWorkspaces: true` needs no description.

## Phase breakdown

1. Plan commit (this file).
2. `fileService.ts` and `minifyCommand.ts`: `createMinifiedUri`, `saveAsNewFile(Uri)`.
3. `package.json` capabilities, seven `package.nls*.json` files, `i18n.test.ts` expected keys.
4. Tests: `src/test/workspaceCapabilities.test.ts`.
5. Docs (`ARCHITECTURE.md`, `TESTING-GUIDE.md`, `INTERNATIONALIZATION.md`, `AGENTS.md` key count) and
   one `CHANGELOG.md` bullet under `## [Unreleased]`.
6. Validation, `core-review --budget medium`, push.

## Testing strategy

- The extension tests load `dist/extension.js`, so tests drive the real commands. A new suite
  registers an in-memory `FileSystemProvider` under a non-`file` scheme and asserts that
  `Minify and Save as New File` writes the sibling through it (same scheme and authority, no local
  file, query and fragment dropped, correct prefix handling, correct message), and that in-place
  minification persists through it. These fail on the old code (verified red then green).
- A capabilities suite asserts the manifest declaration, including that every restricted setting is
  a declared setting.
- The i18n suite gets the new expected key and a check that the `%key%` in the capability
  description exists and is non-empty in every language.
- Local workspace behaviour is covered by the unchanged existing suites.
- Validation: `npm run lint`, `npx tsc --noEmit`, `npm run lint:md`, `npm run format:check`,
  `npm test`.
