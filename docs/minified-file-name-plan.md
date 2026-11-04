<!-- agents-toolkit:planning-doc issue=255 -->

# Plan: Minify and Save as New File must never overwrite the original (#255)

## Problem statement

`createMinifiedFileName` builds the new name with `originalFileName.replace(/(\.css|\.js)$/, `${prefix}$1`)`. When the regex does not match (`.mjs`, `.cjs`, `.JS`, `.CSS`, no extension) the name comes back unchanged, and `saveAsNewFile` writes the minified text to the same URI as the source. The original is replaced and no new file exists. This is data loss.

VS Code opens `.mjs` and `.cjs` as JavaScript, so the command is available for them.

## Current architecture and every caller

| Where | What it does |
| --- | --- |
| `src/services/fileService.ts` `createMinifiedFileName` | Pure string mapping, the bug. |
| `src/services/fileService.ts` `saveAsNewFile` | Builds `Uri.file(newFileName)`, writes, opens, notifies. No check against the source. |
| `src/commands/minifyCommand.ts` `processDocument` | The only caller of both. Calls `createMinifiedFileName(document.fileName, prefix)` then `saveAsNewFile(text, name, stats)`. |
| `minifyInNewFileCommand` (command palette, editor menu, explorer menu, `Alt+Ctrl+N`) | Calls `processDocument` with `saveAsNewFile: true`. |
| `onSaveMinify` with `minifyOnSave` and `minifyInNewFile` on | Calls `processDocument` with `saveAsNewFile: true`. Same path. |

There are no other callers in `src/`. Tests that touch the mapping: `src/test/extension.test.ts` (the `.min` and custom prefix tests rebuild the name with their own regex).

## Proposed changes

### Fix 1, the name

Insert the prefix before the last extension of the last path segment, for any extension and any case. Rules:

- Both `/` and `\` separate path segments, so a dot in a folder name is never an extension, and Windows paths work on every platform.
- The extension keeps its case: `a.JS` becomes `a.min.JS`.
- No extension, or only a leading dot (`Makefile`, `.eslintrc`): the prefix is appended at the end (`Makefile.min`, `.eslintrc.min`). Predictable, and different from the original.
- Already prefixed (`a.min.js`): no special case, it becomes `a.min.min.js`. It never equals the original, so it cannot collide with it.
- A trailing dot (`a.`) becomes `a.min.`.

### Fix 2, the guard

`saveAsNewFile` takes the source URI as a required fourth argument and, before writing, compares `Uri.file(newFileName).toString()` with `sourceUri.toString()` (scheme, authority, path, query). On equality it shows an error and returns without writing. Required, so no future caller can forget it.

New user-facing string, through `t()` and added with real translations to all seven `l10n/bundle.l10n*.json` files:

`Cannot create the minified file: its name would be the same as the original ({0}) and would overwrite it. The original file was not changed.`

`fileService.ts` imports `t` with a relative path instead of the `@/` alias so the test host (which loads the `tsc` output, where `@/` is not resolved) can import it.

### Docs

`docs/FAQ.md` (remove the workaround), `docs/CONFIGURATION.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/INTERNATIONALIZATION.md` and `AGENTS.md` (key counts 12 to 13), `docs/TESTING-GUIDE.md` and `CONTRIBUTING.md` (test totals), `CHANGELOG.md` (one bullet under `### Fixed`).

## Phases

1. Plan and issue comment.
2. Fix the name and add the guard and the l10n string.
3. Tests in a new `src/test/fileService.test.ts`.
4. Docs and changelog.
5. Validation (`lint`, `tsc`, `lint:md`, `format:check`, full suite), `core-review`, push.

## Testing strategy

- Unit tests for `createMinifiedFileName`: css, js, mjs, cjs, uppercase, Windows paths, no extension, leading dot, already prefixed, dotted folders, every prefix option read from `package.json`, and a "never equals the original" property.
- Extension-host tests: the command run on `.mjs`, `.cjs`, `.JS` and `.CSS` temp files leaves the original byte for byte and creates the new file; `saveAsNewFile` refuses when the target URI equals the source URI and shows the error; a different scheme with the same path is not refused; a different target is written.
- Prove they fail on the old code (revert the two source files temporarily) and pass with the fix.

## Interaction with PR #250

PR #250 (not merged) changes `saveAsNewFile` to take a `Uri` and adds `createMinifiedUri`. Keep this change small so the conflict is trivial: the signature of `saveAsNewFile` and the call in `processDocument`.
