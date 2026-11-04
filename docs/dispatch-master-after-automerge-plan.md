<!-- agents-toolkit:planning-doc issue=267 -->

# Plan: run the master workflows after a Dependabot PR is auto-merged (#267)

## Problem

`auto-merge-dependabot.yml` merges with `GITHUB_TOKEN`. Events caused by that token start no workflow, except `workflow_dispatch` and `repository_dispatch`, so the push to `master` starts nothing and `master` is not tested at its new tip.

## Decisions

- Dispatch `master.yml`, `test-vscode-minimum.yml` and `test-vscode-stable.yml` on the default branch after every real merge. Skip `test-vscode-insiders.yml` (a daily schedule already covers it and a red Insiders run is not evidence of a regression). Skip `release.yml` and CodeQL (no `push` trigger in the issue table).
- Dispatch `docs.yml` only when the merged PR changed `site/**`, `docs/**`, `examples/**`, `README.md`, `CHANGELOG.md` or `.github/workflows/docs.yml` (the paths of its own `push` filter).
- Concurrency: keep the runs of `master` uncancelled. Before dispatching, read the tip of the default branch and skip the dispatch when it is no longer the merge commit: whoever pushed the newer tip either started the workflows by push (human) or dispatches them itself (another auto-merge). A dispatch runs the tip at dispatch time, so a skipped one loses nothing.
- A failed dispatch (or a failed lookup) only logs a warning; the job stays green.
- Dispatch only on the default branch, with no inputs.
- Job permissions: add `actions: write` to the job, nothing at workflow level.

## Phases

1. Add `workflow_dispatch` to `master.yml`, `test-vscode-minimum.yml`, `test-vscode-stable.yml` (no job renames).
2. Add the dispatch step to the script and `actions: write` to the job.
3. Offline fake-object cases: merge ok then dispatch, merge refused, dispatch fails.
4. Update `AGENTS.md`, `CHANGELOG.md`, `.github/copilot-instructions.md` mention if needed.

## Testing

Offline harness against the real `script:` with fake `github`, `context`, `core`. Then `npm run lint:md`, `npm run format:check`, parse the YAML. After merge, check with a real Dependabot PR that the workflows appear on the new `master` tip.
