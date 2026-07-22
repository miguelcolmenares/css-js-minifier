# Native Bindings Cross-Platform Fix — Implementation Plan

**Issue:** [#176](https://github.com/miguelcolmenares/css-js-minifier/issues/176)
**Branch:** `fix/176-native-bindings-cross-platform`
**Target version:** `1.3.3`
**Regression window:** `v1.3.0`, `v1.3.1`, `v1.3.2` (Marketplace) — introduced when Toptal HTTP API was replaced with native `lightningcss` + `oxc-minify`.

---

## Problem Statement

The `.vsix` published to the VS Code Marketplace since **v1.3.0** is **broken for every platform other than `darwin-arm64`**.

Two independent bugs combine to produce the failure:

- **Bug A — Missing native bindings.** `vsce package` (without `--target`) bundles only the `optionalDependencies` materialised by `npm install` on the packaging host. Building on `darwin-arm64` produces a `.vsix` containing only `lightningcss-darwin-arm64` and `@oxc-minify/binding-darwin-arm64`.
- **Bug B — `detect-libc` not bundled.** `lightningcss@1.33.0` declares `detect-libc` as a regular `dependencies` entry, but `vsce` does not walk transitive dependencies of externalised runtime packages. On Linux the dispatcher `require('detect-libc')` at `node_modules/lightningcss/node/index.js:3` throws.

Symptoms match [#118](https://github.com/miguelcolmenares/css-js-minifier/issues/118) exactly (silent activation failure → every command reports "command not found"). Confirmed in a `linux/amd64` Docker container against the current `css-js-minifier-1.3.3.vsix` (universal build).

---

## Current Architecture

### Import chain (eager, top-level)

```
src/extension.ts
  → src/commands/minifyCommand.ts
    → src/services/minificationService.ts
      → src/services/strategies/localCssMinifier.ts:15   import { transform } from 'lightningcss'
      → src/services/strategies/localJsMinifier.ts:22-23 const oxcMinify = require('oxc-minify')
```

Both native libraries load synchronously during `activate()`. Any failure aborts activation before `registerCommand` runs → user sees "command not found" for every command.

### Current packaging flow (manual)

1. `npm run package` — webpack production build (`dist/extension.js`, 14.6 KiB).
2. `npx vsce package` — produces universal `.vsix` (4.5 MB, includes only current-host bindings).
3. Manual upload to Marketplace portal.

No CI job produces or validates the `.vsix`. No cross-platform activation smoke test exists.

### package.json dependencies (current)

```json
"dependencies": {
  "lightningcss": "^1.33.0",
  "oxc-minify": "^0.140.0"
}
```

---

## Proposed Changes

### Change 1 — Add `detect-libc` as a direct dependency

`detect-libc` must appear in the extension's own `dependencies` so `vsce` includes it in every `.vsix`, regardless of target.

```json
"dependencies": {
  "detect-libc": "^2.0.4",
  "lightningcss": "^1.33.0",
  "oxc-minify": "^0.140.0"
}
```

**Rationale:** Even a correctly targeted `--target linux-x64` `.vsix` fails without this. Verified in Docker: adding `detect-libc` alone to a linux-targeted `.vsix` moved results from 2/3 to 4/4 passing.

### Change 2 — Multi-target build script

New file: `scripts/build-vsix.sh`

Iterates over the six supported VS Code marketplace targets. For each target it:

1. Removes any previously-installed platform-specific `lightningcss-*` and `@oxc-minify/binding-*` packages from `node_modules` (npm accumulates them otherwise).
2. Force-installs the target's specific pair via `npm install --no-save --force`.
3. Runs `npx vsce package --target <target> --out dist/css-js-minifier-<version>-<target>.vsix`.
4. Verifies (via `unzip -l`) that the resulting `.vsix` contains only the expected bindings.

Targets:

| Target | lightningcss binding | oxc-minify binding |
|---|---|---|
| `darwin-x64` | `lightningcss-darwin-x64` | `@oxc-minify/binding-darwin-x64` |
| `darwin-arm64` | `lightningcss-darwin-arm64` | `@oxc-minify/binding-darwin-arm64` |
| `linux-x64` | `lightningcss-linux-x64-gnu` | `@oxc-minify/binding-linux-x64-gnu` |
| `linux-arm64` | `lightningcss-linux-arm64-gnu` | `@oxc-minify/binding-linux-arm64-gnu` |
| `win32-x64` | `lightningcss-win32-x64-msvc` | `@oxc-minify/binding-win32-x64-msvc` |
| `win32-arm64` | `lightningcss-win32-arm64-msvc` | `@oxc-minify/binding-win32-arm64-msvc` |

Script must also restore the host's own binding pair at the end so local dev is not broken.

### Change 3 — Cross-platform activation smoke test

New file: `scripts/verify-vsix-activation.sh`

Given a `.vsix` path and a Docker image, extracts the archive and runs a Node script that reproduces extension activation:

```js
require('lightningcss').transform({filename:'t.css',code:Buffer.from('a{color:red}'),minify:true});
require('oxc-minify').minifySync('t.js','const x=1;');
```

Exits non-zero on any failure. Callable both locally and from CI.

### Change 4 — CI workflow: `verify-vsix.yml`

New workflow file: `.github/workflows/verify-vsix.yml`

Triggers on `pull_request` to `master` and on manual `workflow_dispatch`. Steps:

1. Checkout, setup Node 20, install deps.
2. Run `scripts/build-vsix.sh` (produces six `.vsix` files).
3. Matrix job over targets that Docker/Actions runners can validate natively:
   - `linux-x64` — `node:22-slim` container
   - `linux-arm64` — `node:22-slim` with `--platform linux/arm64` via QEMU
   - `darwin-x64`, `darwin-arm64` — `macos-latest` / `macos-13` runners (no Docker needed; run the smoke script directly against the extracted `.vsix`).
   - `win32-x64` — `windows-latest` runner (run smoke script directly).
   - `win32-arm64` — no public CI runner; validate manifest presence only (bindings existence in `.vsix`).
4. Upload all six `.vsix` files as workflow artifacts for the maintainer to download and manually upload to Marketplace.

### Change 5 — Update CHANGELOG.md

Extend the existing `[1.3.3] - 2026-07-22` entry with:

```markdown
### Fixed
- **CRITICAL:** Extension activation on Linux, Windows, and Intel Mac (#176).
  Since v1.3.0 the published `.vsix` only bundled `darwin-arm64` native
  bindings for lightningcss and oxc-minify, plus never bundled the
  `detect-libc` runtime dependency of lightningcss. Every non-Apple-Silicon
  user got a silent activation failure and "command not found" from every
  command. Also root-causes #118 (previously attributed to `navigator`
  PendingMigrationError — that was a Copilot-generated hypothesis, not the
  real cause).

### Changed
- Release process now produces six platform-specific `.vsix` files
  (`darwin-x64`, `darwin-arm64`, `linux-x64`, `linux-arm64`, `win32-x64`,
  `win32-arm64`). No more universal fallback build.
- Added `detect-libc` as a direct runtime dependency so it is bundled into
  every `.vsix` regardless of target.
```

### Change 6 — Update publishing instructions

Update `.copilot/instructions/publish-update-extension.instructions.md` (in the user's global copilot config) — or, if not permissible, add a new `docs/PUBLISHING.md` in this repo — describing the multi-target build + publish flow.

---

## Phase Breakdown

### Phase 1 — Bundle `detect-libc` and prove fix in Docker

- [ ] Add `detect-libc: ^2.0.4` to `package.json` `dependencies` and refresh `package-lock.json`.
- [ ] Run local `npm test` (regression check on darwin-arm64).
- [ ] Package a temporary `.vsix` and confirm `unzip -l` shows `node_modules/detect-libc/`.
- [ ] Run the Docker `linux/amd64` smoke test against the packaged `.vsix` targeting `--target linux-x64` — expect 4/4 pass.
- [ ] Commit: `fix: Bundle detect-libc runtime dependency for lightningcss (#176)`

### Phase 2 — Multi-target build script

- [ ] Create `scripts/build-vsix.sh` (bash, `set -euo pipefail`, portable enough for macOS + Ubuntu CI).
- [ ] Add npm script alias: `"build:vsix": "bash scripts/build-vsix.sh"`.
- [ ] Locally build all six `.vsix` files, inspect each with `unzip -l`, confirm each contains only its target's bindings + shared `detect-libc`.
- [ ] Commit: `build: Add multi-target vsix build script (#176)`

### Phase 3 — Cross-platform activation smoke test

- [ ] Create `scripts/verify-vsix-activation.sh` (accepts `--vsix PATH --docker-image IMAGE` or `--vsix PATH --native` for host-native validation).
- [ ] Include the reusable Node smoke script (extracted from PR discussion).
- [ ] Commit: `test: Add cross-platform vsix activation smoke test (#176)`

### Phase 4 — CI workflow

- [ ] Create `.github/workflows/verify-vsix.yml` (pin actions to SHA per repo convention).
- [ ] Matrix over 5 validatable targets (linux-x64, linux-arm64 via QEMU, darwin-x64, darwin-arm64, win32-x64). `win32-arm64` verified only by manifest presence.
- [ ] Upload all six `.vsix` as artifacts.
- [ ] Commit: `ci: Add cross-platform vsix activation matrix (#176)`

### Phase 5 — CHANGELOG + docs + prepare v1.3.3 re-tag

- [ ] Update `CHANGELOG.md` `[1.3.3]` entry.
- [ ] Update `docs/ARCHITECTURE.md` "Distribution" section (if present) with the multi-target model.
- [ ] Commit: `docs: Document multi-target packaging for v1.3.3 (#176)`

### Phase 6 — Release execution (post-merge)

Executed by maintainer after PR merge to `master`:

1. Force-update the existing `v1.3.3` tag to the merge commit (the current tag points to a commit whose `.vsix` was never published to Marketplace, so the tag has no downstream consumers — force-updating it is safe):
   ```bash
   git tag -f v1.3.3 <merge-commit-sha>
   git push -f origin v1.3.3
   ```
2. Trigger `verify-vsix.yml` workflow_dispatch on the tag.
3. Download the six `.vsix` artifacts from the workflow run.
4. Publish each one:
   ```bash
   for f in css-js-minifier-1.3.3-*.vsix; do
     npx vsce publish --packagePath "$f"
   done
   ```
5. Edit GH release `v1.3.3` notes to reflect the new artifacts and link back to #176 / #118.

---

## Testing Strategy

### Local regression (Phase 1)

Every phase must keep `npm test` (52-test VS Code extension suite) passing on darwin-arm64.

### Docker matrix (Phase 3 script)

For each platform we can spin up in Docker:

| Platform | Docker image | Expected result |
|---|---|---|
| `linux-x64` (glibc) | `node:22-slim` `--platform linux/amd64` | 4/4 pass with `.vsix` for `linux-x64` target |
| `linux-arm64` (glibc) | `node:22-slim` `--platform linux/arm64` | 4/4 pass with `.vsix` for `linux-arm64` target |

Note: musl (Alpine) is not currently a published target; documenting this gap in the plan but not addressing it in v1.3.3.

### CI matrix (Phase 4 workflow)

Runs on every PR. Fails the build if any `.vsix` cannot activate on its declared target.

### Manual pre-publish validation (Phase 6)

Before the maintainer runs `vsce publish`, they must:

1. Download all six workflow artifacts.
2. Run `scripts/verify-vsix-activation.sh` locally against each artifact.
3. Only proceed to publish if all six pass.

---

## Non-Goals for v1.3.3

- **Alpine/musl support.** `lightningcss` and `oxc-minify` both ship `-musl` bindings but VS Code Marketplace does not have a `linux-x64-musl` target distinct from `linux-x64`. Alpine users are historically unsupported; leaving as-is.
- **Automated `vsce publish` from CI.** Requires storing a Marketplace PAT as an org/repo secret. Out of scope for the fix; can be a follow-up issue.
- **Lazy loading of native modules.** Moving the `require('lightningcss')` and `require('oxc-minify')` calls into the command handlers would make failures visible via `showErrorMessage` instead of silent activation failure. Worth considering as a defence-in-depth follow-up but not required to fix the immediate bug.

---

## Risks

- **Force-updating tag `v1.3.3`.** Tag was pushed but no artifact was ever published to Marketplace, so no user has consumed it. Repository maintainers should still be notified before the force-push.
- **Package size.** Each per-target `.vsix` will be ~4-10 MB (vs the current single 4.5 MB). Marketplace supports this fine; six artifacts is well within normal for extensions using native modules.
- **CI runner cost.** New workflow adds ~5-8 min of runner time per PR. Acceptable given the severity of the bug it prevents.
