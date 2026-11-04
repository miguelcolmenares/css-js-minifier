<!-- agents-toolkit:planning-doc issue=252 -->
# CI path filters, nightly Insiders and PR concurrency (issue #252)

## Problem

A Markdown-only pull request (#246) started six workflows and about sixteen jobs. The three VS Code version workflows (`test-vscode-minimum.yml`, `test-vscode-stable.yml`, `test-vscode-insiders.yml`) each ran a 3-OS test matrix that cannot be affected by a docs change. Nothing cancels the runs of a previous push, so several open PRs compete for the macOS concurrency pool.

## Constraints

- The four required checks (`Test on ubuntu-latest`, `Test on macos-latest`, `Test on windows-latest` from `master.yml`, and `Analyze (javascript-typescript)` from `codeql.yml`) must keep triggering on every PR to `master`, with unchanged job names. `master.yml` and `codeql.yml` triggers are not touched.
- `release.yml` and the `Protect master` ruleset are not touched.
- Path filters are applied to the `pull_request` trigger only. The `push` trigger to `master` stays unfiltered, so `master` is always tested.
- `branches: [ master ]` stays on `pull_request`, since `paths` and `branches` are combined.

## Proposed changes

1. **Path filters** on `pull_request` in the three version workflows. The list is everything `npm test` reads or compiles, plus the workflow file itself:
   - `src/**`, `package.json`, `package-lock.json`, `.vscode-test.mjs`, `webpack.config.cjs`, `tsconfig.json`, `eslint.config.mjs`, `tsdoc.json`, `l10n/**`, `package.nls*.json`, `scripts/**`, and the workflow's own file.
   - `tsdoc.json` is not in the issue list. ESLint loads it through `eslint-plugin-tsdoc`, so a change to it changes the `pretest` lint result. It is added on purpose.
   - Fixtures are under `src/test/fixtures/`, so they are covered by `src/**`.
2. **Insiders** gets `schedule` (daily, `17 4 * * *` UTC, off the top of the hour) and `workflow_dispatch`. Its `push` to `master` and its filtered `pull_request` trigger stay.
3. **Concurrency** in `master.yml` and the three version workflows: `group: ${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`. Runs on `master` (push, schedule, dispatch) are never cancelled. Only the `concurrency` block is added to `master.yml`, job names are unchanged.
4. **Documentation**: `AGENTS.md` (CI section), `CONTRIBUTING.md` (cross-platform validation), `CHANGELOG.md` (one bullet under `## [Unreleased]` / `### Changed`).

## Dependabot auto-merge analysis (item 4)

`auto-merge-dependabot.yml` listens to `workflow_run` (`completed`) for four workflow names. Its job runs only when the run concluded `success` and its event was `pull_request`. It then finds the PR by head SHA and merges it (squash) if the author is `dependabot[bot]` and `mergeable_state` is `clean`.

Cases after the change:

- **npm bump** (edits `package.json` and/or `package-lock.json`). Matches the filter, so the three version workflows run as before. Each completion re-runs the check, as today.
- **GitHub Actions bump** that edits only workflow files other than the three version workflows (for example `codeql.yml`, `docs.yml`, `publish-openvsx.yml`). The version workflows do not start. `Build - Master` always starts, so it emits a `workflow_run` completion with conclusion `success` and event `pull_request`. The auto-merge job then runs as long as `mergeable_state` is `clean` at that moment. The auto-merge trigger does not list `CodeQL`, so if CodeQL is still running when `Build - Master` completes, the check sees a non-clean state, skips the merge, and nothing re-triggers it. This race predates this change (CodeQL was never in the list), but the change makes `Build - Master` the only trigger for this class of PR. In practice `Build - Master` runs three OS test jobs, so it usually finishes after CodeQL. This must be confirmed with a real Dependabot run.
- **GitHub Actions bump that edits one of the three version workflows** (for example `actions/checkout` in `test-vscode-stable.yml`). That workflow matches its own filter and runs, so it behaves as the npm case.
- **Scheduled or dispatched Insiders run**. Its `workflow_run` event is `schedule` or `workflow_dispatch`, so the `event == 'pull_request'` guard skips the auto-merge job. A nightly Insiders failure never merges or blocks anything.
- **Cancelled run** (new push to the PR, concurrency). Conclusion `cancelled` is not `success`, so no merge is attempted. The replacement run emits its own completion and the check runs again.
- **Pre-existing defect, not fixed here**: the list names `Test VS Code Minimum (1.109.0)`, but the workflow is named `Test VS Code Minimum (1.144.0)`. The minimum workflow never triggers the auto-merge. PR #248 renames both to `Test VS Code Minimum`. This branch does not touch that line, so the two PRs do not conflict.

Conclusion: no change to `auto-merge-dependabot.yml` is needed for this issue. The CodeQL race and the stale name are reported as follow-ups.

## Testing strategy

- Local: `npm run lint`, `npx tsc --noEmit`, `npm run lint:md`, `npm run format:check`, `actionlint` on every touched workflow (filter on the known `ubuntu-26.04` label finding only, which is present on `main` too).
- YAML parse check of each touched workflow, and a check that the `on:` triggers and `concurrency` blocks are as designed.
- Not verifiable locally: whether `paths` filters match on a real PR, whether `schedule` fires, whether concurrency cancels a PR run. These need real runs on GitHub after the PR is open and must be checked there (a Markdown-only PR, a `src/**` PR, a second push to a PR branch, and a Dependabot PR).

## Phases

- [ ] Phase 1: path filters and nightly Insiders trigger
- [ ] Phase 2: concurrency blocks
- [ ] Phase 3: documentation and CHANGELOG
- [ ] Phase 4: validation, core-review, push
