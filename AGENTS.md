# Agent Instructions — CSS & JS Minifier

This file gives AI coding agents (Copilot, Claude, Cursor, etc.) the load-bearing facts they need to operate safely in this repository. It complements the human-oriented [`CONTRIBUTING.md`](CONTRIBUTING.md) and the runbook in [`.github/instructions/publish-update-extension.instructions.md`](.github/instructions/publish-update-extension.instructions.md).

If any instruction here contradicts something you found in the codebase, the code wins — please report the discrepancy so this file can be updated.

---

## Project shape (30-second orientation)

- **What it is:** a VS Code extension that minifies CSS and JavaScript locally (no network).
- **Native modules:** `lightningcss` (CSS) and `oxc-minify` (JS) — both Rust-based, both platform-specific `.node` binaries. Plus `detect-libc` (runtime dependency of `lightningcss` on Linux).
- **Language:** TypeScript, bundled with webpack (`dist/extension.js`).
- **Entry point:** `src/extension.ts` → `src/commands/*` → `src/services/*` → `src/services/strategies/{localCssMinifier,localJsMinifier}.ts`.
- **i18n:** two-layer system (`package.nls.*.json` for static contributions, `l10n/bundle.l10n.*.json` for runtime strings). Seven languages. See [`docs/INTERNATIONALIZATION.md`](docs/INTERNATIONALIZATION.md).
- **Test framework:** VS Code extension test runner (Mocha under the hood). Test suites live under `src/test/`.
- **Package size target:** ~50 KB per `.vsix`. See `.vscodeignore`.

---

## Release flow (the important one)

**Never push a `v*` tag by hand.** The repository's `pre-push` Husky hook will refuse to. Tags come from the release workflow.

### End-to-end pipeline

```
1. PR bumps package.json + CHANGELOG.md            (contributor / maintainer)
2. PR is squash-merged to master                   (maintainer)
3. Optional: gh workflow run verify-marketplace-auth.yml   (maintainer)
4. gh workflow run release.yml -f version=X.Y.Z    (maintainer)
   ├─ preflight       — version match, changelog present, tag unused, VSCE_PAT valid
   ├─ build matrix    — 6 platforms, .vsix per platform, activation smoke test
   ├─ tag-and-release — annotated tag pushed, GitHub Release with .vsix assets
   └─ publish         — vsce publish --packagePath dist/*.vsix
```

### Why this design

Two invariants are enforced by external systems and drive every decision:

1. **Tag immutability.** The repository ruleset on `refs/tags/v*` blocks `deletion` and `non_fast_forward`. A pushed `v1.x.y` cannot be moved, deleted, or overwritten — ever.
2. **`VSCE_PAT` expires.** Azure DevOps PATs live at most one year. If the token expires between releases, we must catch it **before** creating a tag on GitHub, otherwise the tag becomes an orphan (exists on GitHub, missing on Marketplace, and unfixable because of #1).

The preflight-first release workflow gives us: if the PAT is broken, nothing gets created anywhere; if the PAT is fine, the tag is created and immediately published, in one atomic-ish sequence.

> **⚠️ Hard deadline: 2026-12-01 — Global PATs are being retired by Microsoft.** Our `VSCE_PAT` is scoped as *All accessible organizations* (required for Marketplace lookups), which makes it a global PAT. Per [Retirement of Global Personal Access Tokens in Azure DevOps](https://devblogs.microsoft.com/devops/retirement-of-global-personal-access-tokens-in-azure-devops/), **every global PAT stops working on 2026-12-01** regardless of its own expiration date. Migration to Microsoft Entra ID federated authentication (`azure/login@v2` + `vsce publish --azure-credential`) is tracked in issue [#180](https://github.com/miguelcolmenares/css-js-minifier/issues/180). Until that ships, the preflight guard is what protects us: on 2026-12-01 the `vsce verify-pat` step will start failing and the workflow will refuse to create any tag — no orphan releases, but also no publishing until we finish the Entra migration.

### What to check before dispatching a release

- `package.json` on `master` has the intended version.
- `CHANGELOG.md` has a heading matching `^## \[X.Y.Z\]`.
- The tag `vX.Y.Z` does not already exist on `origin` (workflow will refuse otherwise).
- `VSCE_PAT` is configured as a repository secret with `Marketplace (Manage)` scope for publisher `miguel-colmenares`.

The workflow re-checks all four in its `preflight` job, so you can't accidentally skip them.

### Explicit anti-patterns

- ❌ Do **not** run `vsce publish` locally except in the emergency-fallback scenario documented in `publish-update-extension.instructions.md` (workflow publish step failed AND cannot be re-run).
- ❌ Do **not** push tags manually. `pre-push` will block you.
- ❌ Do **not** try to delete or re-tag a `v*` — the ruleset blocks it and the fix is always "bump to the next version".
- ❌ Do **not** add a `push: tags: v*` trigger back to `release.yml`. It defeats the purpose of preflight-gated tag creation.
- ❌ Do **not** use `git commit --amend --no-edit` on a tagged commit — the tag now points to an old sha.
- ❌ Do **not** attempt to push directly to `master`. A repository ruleset (`Protect master`, id `19564892`) blocks it — every change must arrive via pull request, even for the owner. See [Branch protection](#branch-protection-master).

---

## Branch protection (`master`)

Enforced by repository ruleset **`Protect master`** (id `19564892`, target = default branch, `bypass_actors = []` → no one bypasses, not even the owner):

| Rule | Effect |
| --- | --- |
| `deletion` | `master` cannot be deleted. |
| `non_fast_forward` | Force-pushes to `master` are rejected. |
| `pull_request` (approvals = 0) | Every change must arrive via PR. Direct `git push origin master` is refused. Zero approvals required — the maintainer can self-merge — but the PR object must exist so checks can run and the history is auditable. |
| `required_status_checks` | The PR cannot be merged until all four of these checks pass: `Test on ubuntu-latest`, `Test on macos-latest`, `Test on windows-latest` (from `Build - Master`), and `Analyze (javascript-typescript)` (from CodeQL). These four run on **every** PR to `master` regardless of what files it touches, so they never cause "waiting for a check that never runs" deadlocks. |

**Not required (deliberate):** the six `Build & Release` matrix jobs are gated by a path filter (only run when `src/**`, `package.json`, `package-lock.json`, `.vscodeignore`, `webpack.config.cjs`, `scripts/verify-vsix-activation.mjs`, or `.github/workflows/release.yml` change), so requiring them would block docs-only PRs that never trigger them. They still run — and their failure is still visible — on every relevant PR.

**Rules companion:** the tag ruleset **`Immutable release tags (v*)`** (id `19533762`) blocks `deletion` and `non_fast_forward` on `refs/tags/v*`, making every published version permanent.

---

## Repository conventions

### Language

All technical content (code, comments, commits, PR titles, PR descriptions, issues, workflows, scripts, docs) is in **English**. User-facing UI strings live in the `l10n/` and `package.nls.*` bundles.

### Commit messages (Conventional Commits)

Enforced by Husky (`commit-msg` hook). Format:

```
<type>[optional scope][optional !]: <description>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Examples:

- `feat: Add support for Turkish translation`
- `fix(activation): Handle missing detect-libc on Linux`
- `chore!: Drop Node 18 support`

Merge commits (`Merge …`), reverts (`Revert …`), and fixup/squash commits (`fixup! …`, `squash! …`) bypass the check automatically.

### Branch naming

- `feature/<description>` for new features
- `fix/<description>` for bug fixes
- `chore/<description>` for maintenance
- `docs/<description>` for documentation-only changes
- `refactor/<description>` for internal refactors

### Documentation (TSDoc)

All TypeScript doc comments follow the [TSDoc](https://tsdoc.org/) specification, enforced at lint time by `eslint-plugin-tsdoc` (`tsdoc/syntax: "error"`).

**Key rules:**

- No `{type}` annotations in `@param` or `@returns` — TypeScript provides the types.
- No redundant tags: `@function`, `@async`, `@interface`, `@enum`, `@module` are not used.
- File-level docs use `@packageDocumentation` (not `@fileoverview`).
- Extended descriptions go in `@remarks` blocks (separate from the summary).
- Side effects are documented under `@remarks`, not a custom `@sideEffects` tag.
- Custom block tags `@since`, `@version`, `@author` are defined in `tsdoc.json`.

**Canonical function comment:**

```typescript
/**
 * Brief summary (one sentence, no tag).
 *
 * @remarks
 * Extended description, implementation details, side effects.
 *
 * @param name - Description without type braces
 * @returns Description without type braces
 *
 * @throws When something goes wrong
 *
 * @example
 * ```typescript
 * const result = doSomething('input');
 * ```
 */
```

**File header (entry points only):**

```typescript
/**
 * @packageDocumentation
 * One-line module summary.
 *
 * Extended description of what this module provides.
 *
 * @author Miguel Colmenares
 * @version X.Y.Z
 * @since X.Y.Z
 */
```

See [`.github/instructions/tsdoc-standards.instructions.md`](.github/instructions/tsdoc-standards.instructions.md) for the full reference.

### PR conventions

- Title uses the same format as commit messages (`type: description`).
- Description includes what changed, why, and how to test.
- PRs that touch `src/**`, `package.json`, `package-lock.json`, `.vscodeignore`, `scripts/verify-vsix-activation.mjs`, `webpack.config.cjs`, or `.github/workflows/release.yml` automatically trigger the 6-platform build matrix.
- Reviewer waits for all 6 matrix jobs to be green before merging.

---

## Git hooks (Husky)

Installed via `npm ci` (the `prepare` script runs `husky`). Located in `.husky/`.

| Hook | Purpose | Bypass |
| --- | --- | --- |
| `pre-commit` | Runs `npm run lint` on the whole `src/` tree (~2–5 s), and — when `package.json` version is bumped in the staged diff — requires `CHANGELOG.md` to be staged in the same commit with a matching `## [X.Y.Z]` heading (same regex the release workflow uses) | `git commit --no-verify` |
| `commit-msg` | Enforces Conventional Commit format on the subject line | `git commit --no-verify` |
| `pre-push` | Refuses to push any `refs/tags/v*` (release tags must come from the workflow) | `git push --no-verify` — use only when explicitly recovering from an outage |

If you need to disable Husky entirely for a single command (e.g. inside a container that doesn't have Node), prepend `HUSKY=0`:

```bash
HUSKY=0 git commit -m "chore: emergency commit"
```

### Why there is no `pre-tag` or `pre-release` hook

Git does not expose any hook that fires on `git tag`, and Husky can only wrap hooks that Git actually dispatches. The closest equivalents we use instead:

- **`pre-push` intercepts tag push.** A tag that only exists locally has no impact on the release pipeline, so blocking its creation is unnecessary; blocking the push is what matters. Our `pre-push` rejects any ref update whose remote name starts with `refs/tags/v`.
- **`pre-commit` intercepts the bump commit.** The moment before a release is committed (version bump + changelog) is our practical "pre-release" moment. Failing there keeps a mismatched bump/changelog from ever landing on master, which in turn keeps the release workflow's preflight from ever needing to reject it.

There is a Git hook called `reference-transaction` (introduced in Git 2.28) that can intercept local tag creation. We deliberately do not use it: it would also block `git tag` for local experimentation, and it adds no protection over `pre-push` because an un-pushed tag cannot burn a version.

---

## Cross-platform CI matrix

The `Build & Release` workflow runs a 6-platform matrix on every relevant PR and every release dispatch:

| Runner | Target | Binary validated |
| --- | --- | --- |
| `macos-15-intel` | `darwin-x64` | Intel Mac |
| `macos-latest` | `darwin-arm64` | Apple Silicon |
| `ubuntu-latest` | `linux-x64` | 64-bit Linux (glibc) |
| `ubuntu-24.04-arm` | `linux-arm64` | ARM Linux (glibc) |
| `windows-latest` | `win32-x64` | 64-bit Windows |
| `windows-11-arm` | `win32-arm64` | ARM Windows |

Each runner:

1. `npm ci` — installs the native optional dependencies for its platform.
2. `npm run package` — webpack production bundle.
3. `npx vsce package --target <t>` — produces a platform-tagged `.vsix`.
4. `node scripts/verify-vsix-activation.mjs <vsix>` — extracts the archive, `require()`s `lightningcss` and `oxc-minify`, and calls each once to make sure the binary loads on that platform.

`verify-vsix-activation.mjs` exit codes:

- `0` — binaries load and execute.
- `1` — binding regression (missing / wrong architecture / undefined export).
- `2` — infrastructure failure (extraction failed, missing files, unexpected `.vsix` layout).

If you add a new native dependency, update both `.vscodeignore` (to whitelist the extra `.node` files) and the smoke script so it exercises the new module.

---

## Testing

**Local — VS Code tasks** (`Cmd/Ctrl + Shift + P` → **Tasks: Run Task**):

- `Test: Run All Tests` — full suite (~2 min).
- `Test: Configuration Suite Only` — 4 tests (~20 s).
- `Test: Main Functionality Suite Only` — 21 tests (~1.5 min).
- `Test: Internationalization (i18n) Suite Only` — translation consistency.

**Local — CLI:**

```bash
npm test            # full suite
npm run pretest     # compile + lint + copy fixtures (no test run)
npm run lint        # just ESLint
npm run format      # write prettier formatting
npm run format:check # check without writing
```

**Important:** `run_task` in VS Code returns "success" when the task **starts**, not when it finishes. Long-running tasks (like `Test: Run All Tests`) need to be awaited via `get_task_output` or `terminal_last_command`. Do not assume success from the launch response alone.

---

## Common operations cheat sheet

### Add a new translation language

1. Create `package.nls.<locale>.json` (14 keys — copy from `package.nls.json`, translate values). These stay as dotted symbolic keys because VS Code's `%placeholder%` mechanism for `package.json` contributions has no English-as-key equivalent.
2. Create `l10n/bundle.l10n.<locale>.json` (12 keys — the keys are the English source strings themselves, per the v1.3.3 `vscode.l10n` migration; copy from `l10n/bundle.l10n.json` and translate the values).
3. Add the locale to the arrays in `src/test/i18n.test.ts`.
4. Run `Test: Internationalization (i18n) Suite Only` to verify key parity.
5. See [`docs/INTERNATIONALIZATION.md`](docs/INTERNATIONALIZATION.md) for details.

### Add a new native dependency

1. `npm install <package>` — will add to `dependencies` or `optionalDependencies`.
2. Whitelist the `.node` binaries in `.vscodeignore`.
3. Extend `scripts/verify-vsix-activation.mjs` to `require()` the new module and call a small function.
4. Open PR; the 6-platform matrix will validate on every runner.

### Add / modify a Husky hook

1. Create or edit the script in `.husky/<hook-name>`.
2. `chmod +x .husky/<hook-name>`.
3. Test locally with a fake commit / push scenario before pushing.
4. Update the "Git hooks" table in this file.

### Cut a new release

Follow [`.github/instructions/publish-update-extension.instructions.md`](.github/instructions/publish-update-extension.instructions.md) — the runbook is authoritative.

Short version:

```bash
# 1. Bump + changelog PR, get merged.
# 2. (Optional) Verify PAT.
gh workflow run verify-marketplace-auth.yml
# 3. Dispatch release.
gh workflow run release.yml -f version=X.Y.Z
```

---

## Files an agent should read before large changes

- [`README.md`](README.md) — user-facing overview.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contributor workflow.
- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — extended developer notes (architecture, testing, i18n details, package size optimization).
- [`.github/instructions/publish-update-extension.instructions.md`](.github/instructions/publish-update-extension.instructions.md) — release runbook.
- [`.github/instructions/github-cli-usage.instructions.md`](.github/instructions/github-cli-usage.instructions.md) — how to use `gh` in this repo (always pipe to `cat` / set `GH_PAGER=cat`).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — module boundaries.
- [`docs/INTERNATIONALIZATION.md`](docs/INTERNATIONALIZATION.md) — i18n architecture.

---

## When in doubt

- **Never guess at a version number.** Read `package.json`.
- **Never guess at a translation key.** Read the corresponding `.json` bundle.
- **Never introduce a shortcut that bypasses the release preflight.** The preflight exists because tag immutability + PAT expiration are a real footgun combination.
- **Never commit / push secrets.** `VSCE_PAT` lives only in GitHub Secrets and (temporarily) in the maintainer's password manager.

---

**Last updated:** 2026-07-22 (v1.3.3 introduced Husky hooks and workflow-driven releases).
