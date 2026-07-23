---
applyTo: '**'
---

# VS Code Extension Publishing Instructions

This document is the runbook for publishing updates to the CSS & JS Minifier extension on the Visual Studio Code Marketplace.

**As of v1.3.3 the entire release flow — build, tag, GitHub Release, Marketplace publish — is orchestrated from a single GitHub Actions workflow (`Build & Release`, `.github/workflows/release.yml`). There is no local `vsce publish` in the primary path anymore. See "Emergency procedures" at the end for the offline fallback.**

## Why this workflow-driven flow

Two hard constraints shape everything below:

1. **Tag immutability.** The repository ruleset on `refs/tags/v*` blocks deletion and force-push. Once a `v1.x.y` tag exists it is permanent, and any release tied to it is permanent too. This is a feature (immutable audit trail), but it means a mistake that pushes a bad tag burns that version number forever.

2. **VSCE_PAT expires.** Azure DevOps PATs have a maximum lifespan of one year. If the PAT expires between two releases and nobody notices, a naïve "push tag → workflow publishes" flow would burn the tag on GitHub while failing to reach the Marketplace, leaving the two out of sync.

The preflight-first workflow solves both: the tag is created **from inside** the workflow, and only **after** `vsce verify-pat` confirms the PAT is still valid and correctly scoped. If the PAT is broken, nothing gets created on GitHub, no version is burned, and the maintainer can rotate the PAT and re-run the workflow with the same version number.

## Prerequisites (one-time setup)

### 1. `VSCE_PAT` repository secret

> **⚠️ Hard deadline: 2026-12-01.** Microsoft is retiring global PATs on this date — see [Retirement of Global Personal Access Tokens in Azure DevOps](https://devblogs.microsoft.com/devops/retirement-of-global-personal-access-tokens-in-azure-devops/). The PAT rotation instructions below still work today (2026-07-22), but on 2026-12-01 the token stops working regardless of its own expiration. Migration to Microsoft Entra ID federated auth (`azure/login@v2` + `vsce publish --azure-credential`) is tracked in issue [#180](https://github.com/miguelcolmenares/css-js-minifier/issues/180). Once that lands, this section is replaced with the Entra setup steps and `VSCE_PAT` is deleted from the repository secrets.

> **🔥 CRITICAL: If the migration in [#180](https://github.com/miguelcolmenares/css-js-minifier/issues/180) is not merged before 2026-12-01, do not attempt a release.** The publish step will fail after the tag is created, placing the release in the same broken state described in "Publish fails after tag was created". Complete the Entra migration first.

The workflow reads the PAT from `secrets.VSCE_PAT`. To create or rotate it:

1. Sign in at <https://dev.azure.com> with the account that owns the `miguel-colmenares` Marketplace publisher.
2. User Settings → Personal Access Tokens → **New Token**.
3. Configure:
   - **Name**: `VS Code Marketplace — miguel-colmenares (GitHub Actions)`
   - **Organization**: **All accessible organizations** (do NOT scope to a single org — Marketplace lookups fail otherwise; this is precisely the setting Microsoft is retiring, hence the deadline above).
   - **Scopes**: Custom defined → **Marketplace (Manage)**.
   - **Expiration**: 1 year (the maximum allowed).
4. Copy the token immediately (it is shown only once).
5. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
   - **Name**: `VSCE_PAT`
   - **Secret**: paste the PAT verbatim, no wrapping quotes.

### 2. Local tooling (only if you plan to run the emergency fallback)

```bash
npm install -g @vscode/vsce
```

## Verifying `VSCE_PAT` any time (without publishing)

Before every release, and any time you rotate the PAT, run the standalone verification workflow. It uses `vsce verify-pat`, which authenticates against the Marketplace API without publishing:

```bash
# From your local checkout, on any branch (workflow file must exist on master).
gh workflow run verify-marketplace-auth.yml

# Poll the latest run:
RUN_ID=$(gh run list --workflow=verify-marketplace-auth.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID" --exit-status
```

A green run confirms the PAT is present, unexpired, correctly scoped and matches the `miguel-colmenares` publisher. **No version is burned; the Marketplace state is untouched.**

The release workflow (`Build & Release`) also runs this check in its preflight step, so even if you skip the standalone verification the release is still safe. Running it manually is a fast smoke test after rotating the PAT.

## The release runbook

### Step 1 — Prepare the release commit (on a feature branch → PR)

1. Bump the version in `package.json` following SemVer:
   - **PATCH** (1.3.**4**): bug fixes only, no user-visible feature changes.
   - **MINOR** (1.**4**.0): new features, backwards compatible.
   - **MAJOR** (**2**.0.0): breaking changes.
2. If `@types/vscode` was updated, keep `engines.vscode` in sync with it (`^1.X.Y` on both) and update the matching entry in `.github/workflows/test-vscode-minimum.yml` and `.vscode-test.mjs`.
3. Add a new entry at the top of `CHANGELOG.md` following the existing style: `## [X.Y.Z] - YYYY-MM-DD` with `### Added` / `### Fixed` / `### Changed` sections describing user-visible impact. **The release workflow verifies this entry exists before creating the tag** — a missing entry aborts the release.
4. Run the full local check:
   ```bash
   npm test
   npm run lint
   ```
5. Commit:
   ```bash
   git checkout -b chore/release-X.Y.Z
   git add package.json CHANGELOG.md
   git commit -m "chore: Release version X.Y.Z"
   git push -u origin chore/release-X.Y.Z
   gh pr create --title "chore: Release X.Y.Z" --base master | cat
   ```
6. Merge the PR (squash). The 6-platform build matrix runs automatically on the PR because `package.json` is in the workflow's path filter.

### Step 2 — Verify `VSCE_PAT` is healthy

```bash
gh workflow run verify-marketplace-auth.yml
```

Wait for the run to complete green. If it fails, rotate the PAT (see [Prerequisites](#1-vsce_pat-repository-secret)) before continuing.

### Step 3 — Trigger the release workflow

The release is dispatched manually with the version number as input. The version **must** match `package.json` on `master` exactly.

**Via the GitHub UI:**

1. Repository → **Actions** → **Build & Release** → **Run workflow**.
2. Branch: `master`.
3. `version`: the exact version from `package.json` (e.g. `1.3.4`), without the leading `v`.
4. **Run workflow**.

**Via the CLI:**

```bash
gh workflow run release.yml -f version=X.Y.Z
```

### Step 4 — Wait for the workflow to finish

The workflow runs four jobs in order:

1. **Preflight** (~1 min). Validates:
   - The `version` input matches `package.json` on `master`.
   - `CHANGELOG.md` has a `## [X.Y.Z]` entry.
   - The tag `vX.Y.Z` does not already exist on `origin`.
   - `VSCE_PAT` is present.
   - `vsce verify-pat miguel-colmenares` succeeds.
2. **Build matrix** (~10–15 min). Packages one `.vsix` per platform (`darwin-x64`, `darwin-arm64`, `linux-x64`, `linux-arm64`, `win32-x64`, `win32-arm64`) and runs `scripts/verify-vsix-activation.mjs` against each.
3. **Tag and release** (~1 min). Re-verifies `master`'s `package.json` hasn't drifted, then creates the annotated tag `vX.Y.Z`, pushes it, and creates the GitHub Release with all six `.vsix` files attached and auto-generated release notes.
4. **Publish** (~2 min). Uploads all six `.vsix` files to the Marketplace via `vsce publish --packagePath dist/*.vsix`.

If any step in preflight, build or tag-and-release fails, the workflow stops **before** the tag is created. The version number remains available and you can fix the issue and re-run.

If publish fails (e.g. Marketplace outage, PAT revoked mid-run), the tag and GitHub Release stay in place, and users can install manually from the release assets via `code --install-extension` while the maintainer investigates. Re-running just the publish job is not currently supported — a manual `vsce publish` from the maintainer's machine using the already-attached `.vsix` files is the recovery path (see [Emergency procedures](#emergency-procedures) below).

> **Note:** If the `.vsix` files are missing from the GitHub Release, rebuild them locally with `vsce package --target <platform>` for each of the six platforms before running the emergency publish steps.

### Step 5 — Verify publication

1. Wait 5–10 minutes for the Marketplace CDN to update.
2. Confirm the new version is live: <https://marketplace.visualstudio.com/items?itemName=miguel-colmenares.css-js-minifier>.
3. Install and smoke-test:
   ```bash
   code --install-extension miguel-colmenares.css-js-minifier
   ```
4. If any GitHub issues were fixed in this release, close them referencing the release tag.

## Local safety nets (Husky hooks)

The repository ships with Husky-managed Git hooks that catch common mistakes locally, before they turn into CI failures or burned tag versions. See [`AGENTS.md`](../../AGENTS.md#git-hooks-husky) for the full list, including the reasoning behind the "no `pre-tag`" design choice. The ones relevant to publishing:

- **`pre-push`** — refuses to push any `refs/tags/v*` from a local machine. Tags belong to the release workflow. If you need to release, dispatch `release.yml` instead.
- **`pre-commit`** — runs `npm run lint` on the whole `src/` tree, and if the commit changes `package.json` version, requires `CHANGELOG.md` to be staged in the same commit with a matching `## [X.Y.Z]` heading. This mirrors the workflow's preflight check exactly, so a bump commit that passes locally is guaranteed to pass in CI.
- **`commit-msg`** — enforces Conventional Commit format on the subject line.

## Troubleshooting

### Preflight fails on "Input version does not match package.json"

You dispatched the workflow with a version that doesn't match what's on `master`. Either you forgot to merge the bump PR, or you typed the wrong number. Confirm with `git show master:package.json | jq -r .version` and dispatch again with the matching value.

### Preflight fails on "CHANGELOG.md is missing an entry"

Open a follow-up PR that adds `## [X.Y.Z] - YYYY-MM-DD` at the top of `CHANGELOG.md`, merge, and re-dispatch.

### Preflight fails on "Tag vX.Y.Z already exists"

The tag was created by a previous run and cannot be reused (immutability policy). Bump `package.json` to the next available version on a new PR, merge, and dispatch with the new number.

### Preflight fails on `vsce verify-pat`

The PAT is expired, has the wrong scope, or does not belong to the `miguel-colmenares` publisher. Rotate the PAT (see [Prerequisites](#1-vsce_pat-repository-secret)) and re-dispatch. **No tag was created**, so nothing is burned.

### Build matrix fails on a specific platform

Look at the failing job's log. Common causes:

- Native binding regression: `scripts/verify-vsix-activation.mjs` will report exactly which `require()` failed. Usually points at a missing entry in `optionalDependencies` or `.vscodeignore`.
- Test flake: retry the job. If it fails twice, treat it as a real failure.

### Publish fails after tag was created

The tag and GitHub Release are in place; the Marketplace is missing the version. Recovery:

1. Investigate the failure (`vsce publish` output is in the job log). If it's a transient Marketplace error, wait and re-run manually (see [Emergency procedures](#emergency-procedures)).
2. If the PAT was revoked mid-run, rotate it, then run the emergency manual publish using the `.vsix` files from the GitHub Release.
3. Do **not** try to re-cut the release under a different tag — the tag/release pair is immutable and users may already have installed from the GitHub assets.

## Emergency procedures

### Manual publish from a local machine

Use this only when the workflow's publish step failed and you cannot re-run it (e.g. GitHub Actions outage, or Marketplace requires interactive confirmation). It assumes the tag and GitHub Release already exist.

```bash
# 1. Authenticate vsce locally with a fresh PAT.
export VSCE_PAT=<your-pat>

# 2. Download all six .vsix files from the GitHub Release.
mkdir -p /tmp/release-X.Y.Z
gh release download vX.Y.Z --repo miguelcolmenares/css-js-minifier --dir /tmp/release-X.Y.Z --pattern '*.vsix'

# 3. Publish them all in one shot.
cd /tmp/release-X.Y.Z
npx @vscode/vsce publish --packagePath *.vsix
```

### Rotating a compromised PAT

1. Revoke the PAT at <https://dev.azure.com> immediately.
2. Create a fresh PAT (see [Prerequisites](#1-vsce_pat-repository-secret)).
3. Update the `VSCE_PAT` secret in the repository.
4. Run `gh workflow run verify-marketplace-auth.yml` to confirm the new PAT works.

### Unpublishing (extreme caution)

Unpublishing breaks every existing installation of the affected version. Use only for security-critical bugs.

```bash
# Unpublish a specific version.
npx @vscode/vsce unpublish miguel-colmenares.css-js-minifier@X.Y.Z

# Unpublish the entire extension (last resort).
npx @vscode/vsce unpublish miguel-colmenares.css-js-minifier
```

The tag and GitHub Release remain untouched by unpublishing — they must be dealt with separately if the intent is to fully erase a version, but the immutability ruleset blocks tag deletion.

## Reference

- [`.github/workflows/release.yml`](../workflows/release.yml) — the release workflow.
- [`.github/workflows/verify-marketplace-auth.yml`](../workflows/verify-marketplace-auth.yml) — the standalone PAT check.
- [`AGENTS.md`](../../AGENTS.md) — agent-oriented summary of the release flow and Husky hooks.
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — contributor onboarding and CI matrix explanation.
- [VS Code Extension Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce CLI documentation](https://github.com/microsoft/vscode-vsce)
- [Azure DevOps PAT management](https://dev.azure.com)
- [Marketplace Publisher Portal](https://marketplace.visualstudio.com/manage)
- [Semantic Versioning](https://semver.org/)

---

**Last Updated**: 2026-07-22 (v1.3.3 introduced the workflow-driven release flow).
