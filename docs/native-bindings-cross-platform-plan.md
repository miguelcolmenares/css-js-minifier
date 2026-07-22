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

### Change 2 — CI-native release workflow (`release.yml`)

New workflow file: `.github/workflows/release.yml`

Replaces any local multi-target build ritual. GitHub Actions runs a matrix over the six supported VS Code Marketplace targets, each on its own **native** runner (no QEMU, no cross-compile, no `npm install --force` juggling). `npm ci` on each runner materialises the correct `optionalDependencies` pair automatically.

Runner labels (verified July 2026, all free for public repos):

| Target | Runner label | Native arch |
|---|---|---|
| `darwin-x64` | `macos-13` | Intel x64 |
| `darwin-arm64` | `macos-latest` (`macos-14`+) | Apple Silicon |
| `linux-x64` | `ubuntu-latest` | x64 |
| `linux-arm64` | `ubuntu-24.04-arm` | arm64 |
| `win32-x64` | `windows-latest` | x64 |
| `win32-arm64` | `windows-11-arm` | arm64 |

Workflow structure:

```yaml
name: Release

on:
  push:
    tags: ['v*']
  workflow_dispatch:
  pull_request:
    branches: [master]
    paths:
      - 'package.json'
      - 'package-lock.json'
      - 'src/**'
      - '.github/workflows/release.yml'
      - 'scripts/verify-vsix-activation.*'

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - { target: darwin-x64,   os: macos-13 }
          - { target: darwin-arm64, os: macos-latest }
          - { target: linux-x64,    os: ubuntu-latest }
          - { target: linux-arm64,  os: ubuntu-24.04-arm }
          - { target: win32-x64,    os: windows-latest }
          - { target: win32-arm64,  os: windows-11-arm }
    runs-on: ${{ matrix.os }}
    steps:
      - checkout
      - setup-node@20
      - npm ci                              # ← auto-picks the runner's native bindings
      - npm run package                     # webpack production build
      - npx vsce package --target ${{ matrix.target }} --out css-js-minifier-${{ matrix.target }}.vsix
      - node scripts/verify-vsix-activation.mjs css-js-minifier-${{ matrix.target }}.vsix   # smoke test
      - upload-artifact  css-js-minifier-${{ matrix.target }}.vsix  (retention 30d)

  release:
    needs: build
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - download all 6 artifacts
      - gh release upload ${{ github.ref_name }} *.vsix --clobber
```

Key properties:

- **On tag push (`v*`)**: builds 6, smoke-tests each, attaches all 6 to the corresponding GitHub Release.
- **On PR**: builds 6, smoke-tests each, uploads as workflow artifacts (no release). Fails the PR if any binding cannot activate.
- **On `workflow_dispatch`**: same as tag push; useful for re-running against an existing tag.
- **Publishing to Marketplace stays manual for v1.3.3** (per non-goal below). Maintainer downloads the 6 artifacts from the GitHub Release and runs `npx vsce publish --packagePath` locally. Adding automated publish later is ~10 lines.

### Change 3 — Cross-platform activation smoke test (`verify-vsix-activation.mjs`)

New file: `scripts/verify-vsix-activation.mjs`

Node script (Node 20+, ESM) invoked by the CI workflow after packaging. Contract:

```
node scripts/verify-vsix-activation.mjs <path-to-vsix>
```

Steps:

1. Extract the `.vsix` to a temp directory.
2. `require('lightningcss')` and call `transform({...})`.
3. `require('oxc-minify')` and call `minifySync(...)`.
4. Assert both bindings loaded and produced non-empty output.
5. Exit 0 on all pass, non-zero on any failure.

Runs directly on the CI runner (no Docker) because the runner's OS/arch matches the target being tested.

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
  `win32-arm64`), each built on its own native GitHub Actions runner and
  attached to the GitHub Release automatically. No more universal fallback
  build, no more local packaging.
- Added `detect-libc` as a direct runtime dependency so it is bundled into
  every `.vsix` regardless of target.
```

### Change 6 — Update publishing instructions

Update `.copilot/instructions/publish-update-extension.instructions.md` (in the user's global copilot config) — or, if not permissible, add a new `docs/PUBLISHING.md` in this repo — describing the new flow:

1. Land the release commit on `master`.
2. `git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z` — this alone triggers CI to build 6 `.vsix` and attach them to the auto-created GitHub Release.
3. Download the 6 `.vsix` from the Release page.
4. Run `npx vsce publish --packagePath <file>` for each (or configure `VSCE_PAT` secret to automate).

---

## Phase Breakdown

### Phase 1 — Bundle `detect-libc` and prove fix in Docker

- [ ] Add `detect-libc: ^2.0.4` to `package.json` `dependencies` and refresh `package-lock.json`.
- [ ] Run local `npm test` (regression check on darwin-arm64).
- [ ] Package a temporary `.vsix` and confirm `unzip -l` shows `node_modules/detect-libc/`.
- [ ] Run the Docker `linux/amd64` smoke test against the packaged `.vsix` targeting `--target linux-x64` — expect 4/4 pass.
- [ ] Commit: `fix: Bundle detect-libc runtime dependency for lightningcss (#176)`

### Phase 2 — Activation smoke test script

- [ ] Create `scripts/verify-vsix-activation.mjs` (Node 20+ ESM). Accepts a `.vsix` path, extracts to temp dir, requires + calls lightningcss + oxc-minify, exits non-zero on any failure.
- [ ] Verify locally on darwin-arm64 against a `.vsix` built with `npx vsce package --target darwin-arm64`.
- [ ] Commit: `test: Add vsix activation smoke test (#176)`

### Phase 3 — CI-native release workflow

- [ ] Create `.github/workflows/release.yml`:
  - Triggers: tag push `v*`, `workflow_dispatch`, and PR paths-filtered (packaging-relevant files only).
  - Build matrix over 6 runners × targets. Each runner: `npm ci` → `npm run package` → `vsce package --target <t>` → smoke test → upload artifact.
  - Release job (only on tag): download 6 artifacts, `gh release upload <tag> *.vsix --clobber`.
  - Pin all actions to full SHA per repo convention.
- [ ] Trigger workflow via `workflow_dispatch` on the fix branch to verify all 6 targets build + smoke-test cleanly.
- [ ] Commit: `ci: Add cross-platform release workflow (#176)`

### Phase 4 — CHANGELOG + docs

- [ ] Update `CHANGELOG.md` `[1.3.3]` entry with Fixed/Changed sections above.
- [ ] Update `docs/ARCHITECTURE.md` "Distribution" section (if present) with the new per-platform model.
- [ ] Commit: `docs: Document multi-target packaging for v1.3.3 (#176)`

### Phase 5 — Release execution (post-merge)

Executed by maintainer after PR merge to `master`:

1. Force-update the existing `v1.3.3` tag to the merge commit (the current tag points to a commit whose `.vsix` was never published to Marketplace, so the tag has no downstream consumers — force-updating it is safe):
   ```bash
   git tag -f v1.3.3 <merge-commit-sha>
   git push -f origin v1.3.3
   ```
2. `release.yml` runs automatically — builds 6 `.vsix`, smoke-tests each, attaches all 6 to the existing `v1.3.3` GitHub Release.
3. Download the 6 `.vsix` from the Release page (or via `gh release download v1.3.3`).
4. Publish each one:
   ```bash
   for f in css-js-minifier-*.vsix; do
     npx vsce publish --packagePath "$f"
   done
   ```
5. Edit GH release `v1.3.3` notes to reflect the new artifacts and link back to #176 / #118.

---

## Testing Strategy

### Local regression (Phase 1)

Every phase must keep `npm test` (52-test VS Code extension suite) passing on darwin-arm64.

### Local smoke test (Phase 2)

`scripts/verify-vsix-activation.mjs` runs against a locally-built `.vsix` targeting the host platform. Used to validate the script itself before wiring into CI.

### CI matrix (Phase 3 workflow)

Every PR (and every tag) runs the 6-target build matrix. The smoke test executes on each target's native runner. Any failure blocks the PR / release.

### Pre-publish validation (Phase 5)

Before running `vsce publish`, the maintainer should:

1. Confirm the CI matrix passed on the tag build.
2. Download the 6 `.vsix` from the GitHub Release page.
3. Optionally: install one locally via `code --install-extension <file>` on the host platform's target to sanity-check the UX.

---

## Non-Goals for v1.3.3

- **Alpine/musl support.** `lightningcss` and `oxc-minify` both ship `-musl` bindings but VS Code Marketplace does not have a `linux-x64-musl` target distinct from `linux-x64`. Alpine users are historically unsupported; leaving as-is.
- **Automated `vsce publish` from CI.** Requires storing a Marketplace PAT as `VSCE_PAT` repo secret. Out of scope for the fix; can be a follow-up issue. The `release.yml` workflow is structured so that adding a publish job later is trivial (~10 lines).
- **Lazy loading of native modules.** Moving the `require('lightningcss')` and `require('oxc-minify')` calls into the command handlers would make failures visible via `showErrorMessage` instead of silent activation failure. Worth considering as a defence-in-depth follow-up but not required to fix the immediate bug.

---

## Risks

- **Force-updating tag `v1.3.3`.** Tag was pushed but no artifact was ever published to Marketplace, so no user has consumed it. The force-push retriggers `release.yml`, which will attach 6 `.vsix` to the existing GH Release.
- **Package size.** Each per-target `.vsix` will be ~4-10 MB (vs the current single 4.5 MB). Marketplace supports this fine; six artifacts is well within normal for extensions using native modules.
- **CI runner cost.** New workflow adds ~5-10 min of runner time per PR. Acceptable given the severity of the bug it prevents; free for public repos across all six matrix runners.
- **`ubuntu-24.04-arm` and `windows-11-arm` availability.** Both are generally available for public repos as of 2025. If either is retired or renamed, the workflow needs updating — pinned matrix makes this obvious in CI logs.
