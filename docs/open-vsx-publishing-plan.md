<!-- agents-toolkit:planning-doc issue=238 -->

# Plan: publish the extension to Open VSX (#238)

## Problem statement

The extension is published only to the Visual Studio Code Marketplace. VSCodium, Eclipse Theia, Gitpod and other VS Code forks read from [Open VSX](https://open-vsx.org), where `miguel-colmenares.css-js-minifier` does not exist yet.

## Current architecture

`release.yml` (dispatch only) runs `preflight`, a 6-platform `build` matrix, `tag-and-release`, `publish` (Marketplace, `vsce publish --packagePath dist/*.vsix`), then `docs` and `deploy-docs`. The six platform `.vsix` files are attached to the GitHub Release `v<version>`.

## Proposed changes

1. New `.github/workflows/publish-openvsx.yml`, triggered by `workflow_call` (from `release.yml`) and `workflow_dispatch` (backfill and retry, takes a `version`).
   - Downloads the `.vsix` files from the GitHub Release instead of rebuilding.
   - Runs `ovsx publish <file>` once per file (one file per call), pinned to `ovsx@1.3.0`, on Node 22.
   - Skips targets already on Open VSX, fails at the end listing the failed targets, so re-runs are safe.
   - Reads the token from `OVSX_PAT` and fails fast when it is missing.
2. `release.yml`: add a `publish-openvsx` job after `tag-and-release`, in parallel with `publish`, so neither registry blocks the other.
3. Docs: runbook prerequisites, release steps and recovery; `AGENTS.md`, `CONTRIBUTING.md`, `docs/ARCHITECTURE.md`, `.github/copilot-instructions.md`; `CHANGELOG.md` Unreleased entry.

## Phases

1. Prerequisites (done): Eclipse account, Publisher Agreement, namespace `miguel-colmenares`, `OVSX_PAT` secret.
2. Workflow and release wiring (done, in this branch).
3. Docs and changelog (done, in this branch).
4. After merge: `gh workflow run publish-openvsx.yml -f version=1.3.4` to backfill.
5. Follow-ups: verified namespace ownership, README install note, optional OIDC trusted publishing.

## Testing strategy

- `actionlint` on both workflows (the only finding is the existing `ubuntu-26.04` label), `npm run lint:md`.
- The first real run is the test: confirm the six targets appear on Open VSX and that `ovsx publish <file>` takes the platform target from the `.vsix` manifest. If it does not, derive `--target` from the file name.
- Re-run the same dispatch to confirm the skip path (all targets reported as already published).
