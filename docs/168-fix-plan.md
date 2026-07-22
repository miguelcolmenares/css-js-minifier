# Fix Plan — Issue #168: `minifyOnSave` does not trigger on first save

**Status**: fix already present in `master` as an incidental result of #169. Only regression coverage + CHANGELOG note remain.

**Target release**: v1.3.3 (bundled with #145 and #169).

---

## Problem

Reporter (`Plusers-Yamada`, v1.3.2) observes that with `css-js-minifier.minifyOnSave = true`, the first `Cmd+S` on a `.css` file after a VS Code restart silently produces nothing. Running the `Minify` command once from the Command Palette then "wakes up" the extension and every subsequent save works as expected.

## Root Cause

`activationEvents` in v1.3.2 was:

```json
[
  "onCommand:extension.minify",
  "onCommand:extension.minifyInNewFile",
  "onSaveTextDocument"
]
```

Two independent problems:

1. **`onSaveTextDocument` is not a valid activation event.** VS Code silently ignores it — it never activates the extension on save.
2. **No `onLanguage:*` entry**, so opening a `.css` / `.js` file does not activate the extension either.

Net effect: the extension only activated when the user invoked one of its commands. `workspace.onDidSaveTextDocument(onSaveMinify)` is registered inside `activate()`, so until the extension is activated the listener does not exist and no save event is ever handled.

## Fix Already Landed

Commit [3063288](https://github.com/miguelcolmenares/css-js-minifier/commit/3063288) (PR #170, issue #169) rewrote `activationEvents` to:

```json
["onLanguage:css", "onLanguage:javascript"]
```

Effect on the #168 scenario:

1. User restarts VS Code.
2. User opens a `.css` file → VS Code fires `onLanguage:css`.
3. Extension `activate()` runs synchronously (already refactored in v1.3.3 for issue #145 to register commands and the `onDidSaveTextDocument` listener synchronously — commit [7d7ea80](https://github.com/miguelcolmenares/css-js-minifier/commit/7d7ea80)).
4. Save fires → the listener registered in step 3 handles it → minified file is written.

The command-palette workaround is no longer required.

## Remaining Work

| Task | File | Purpose |
| --- | --- | --- |
| Regression test | `src/test/activation.test.ts` (new) | Fail CI if either `onLanguage:css` or `onLanguage:javascript` is removed from `package.json`. |
| CHANGELOG note | `CHANGELOG.md` under `[1.3.3] > ### Fixed` | Credit reporter, cross-reference #169. |

Nothing in `src/` needs changing.

## Testing Strategy

Automated:

- New Mocha suite `Activation Events (regression guard for #168)` reads `package.json` and asserts both `onLanguage:css` and `onLanguage:javascript` are present. Also asserts the two known-broken entries from v1.3.2 (`onSaveTextDocument`, `onCommand:extension.minify*`) are **not** present, since re-adding them signals a regression to a superseded activation model.
- Full existing suite (61 tests) must still pass.

Manual smoke (post-release):

1. `code --disable-extensions` to isolate.
2. Install the packaged `.vsix` for v1.3.3.
3. Enable `minifyOnSave` + `minifyInNewFile`.
4. Fully quit VS Code (`Cmd+Q`).
5. Reopen; open a `.css` file; save immediately.
6. Confirm `.min.css` is generated without any prior manual command invocation.
7. Repeat with a `.js` file.
8. Repeat under Japanese display language (`code --locale=ja`, reporter's environment) to confirm localized success notification.

## Rollout

- Branch: `fix/168-minifyonsave-first-save`.
- Single PR titled `fix: Regression guard for minifyOnSave first-save activation (#168)`.
- After merge, this planning document is deleted (per `finalize-pr` step 6).
