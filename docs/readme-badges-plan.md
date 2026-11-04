<!-- agents-toolkit:planning-doc issue=245 -->

# Plan: reduce README badges to the ones that carry signal (#245)

## Problem statement

The README carries six badges (license, CI, CodeQL, minimum VS Code, Stable, Insiders). Some duplicate what GitHub and the Marketplace already show (license), one alarms users without informing them (Insiders), and none says which platforms the six `.vsix` targets cover.

## Current architecture

- Badge block at the top of `README.md` (license, CI for `master.yml`, CodeQL).
- "VS Code Compatibility Testing" section with three workflow badges and a bullet list.
- `test-vscode-{minimum,stable,insiders}.yml` each run on Ubuntu, macOS and Windows on push and PR to `master`. Insiders uses `fail-fast: false` and is not a required check.
- `CONTRIBUTING.md` explains the CI matrix under "Cross-platform validation".
- Linux packages are glibc only (`linux-x64`, `linux-arm64`); Alpine/musl is tracked in #244.

## Proposed changes

1. `README.md`: drop the license and Insiders badges, link the CI badge to its workflow, add a static platform badge (`img.shields.io/badge/...`) linking to the Distribution section of `docs/ARCHITECTURE.md`, with an accurate label (Linux glibc only). Update the compatibility bullets to match the badges that remain and stop claiming "all platforms".
2. `CONTRIBUTING.md`: one short paragraph describing the three VS Code version workflows and why Insiders is not badged.
3. `CHANGELOG.md`: one `### Changed` bullet under `## [Unreleased]`, since the README is shown on the Marketplace and its text changes meaning.
4. Leave `test-vscode-insiders.yml` and its references in `auto-merge-dependabot.yml` and the issue templates untouched.

Out of scope: Open VSX badge (#240), coverage badge (#241), a `badges` array in `package.json`.

## Phases

1. Edit README badge block and compatibility section.
2. Describe Insiders in CONTRIBUTING.md; grep for leftovers.
3. Verify every badge and link URL over HTTPS (`curl -sIL`), approved hosts only.
4. `npm run lint:md`, `npm run format:check`, `npm run lint`, then `core-review --budget medium`.

## Testing strategy

Docs-only change, no code tests. Validation is the three lint commands plus a status check of every URL, and a grep for `test-vscode-insiders` and the old badge URLs in `README.md`, `docs/`, `AGENTS.md`, `CONTRIBUTING.md` and `.github`.
