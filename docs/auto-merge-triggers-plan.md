<!-- agents-toolkit:planning-doc issue=260 -->

# Plan: Dependabot auto-merge triggers (issue #260)

Temporary planning document. It is deleted before the pull request reaches `master`.

## Problem statement

`.github/workflows/auto-merge-dependabot.yml` merges a Dependabot PR only when `mergeable_state`
is `clean`, and it reads that state once, on a `workflow_run` completion of four workflows. If a
check is still pending at that moment, nothing runs the job again. Of the last 15 merged
Dependabot PRs only 5 were merged by the workflow.

Maintainer decision recorded on the issue (after the first plan): Dependabot major updates are
never auto-merged. They stay open until a human reviews them. Minor and patch updates keep the
current rule: merge only when everything is green, squash.

## Premises checked against facts

### Workflows that run on `pull_request` (exact `name:` values)

| `name:` (this is what `workflow_run.workflows` matches) | File | PR trigger and path filter | Required check? |
| --- | --- | --- | --- |
| `Build - Master` | `master.yml` | every PR to master | Yes: `Test on ubuntu-latest`, `Test on macos-latest`, `Test on windows-latest` (job `Format & Markdown` is not required) |
| `CodeQL` | `codeql.yml` | every PR to master | Yes: `Analyze (javascript-typescript)` |
| `Build & Release` | `release.yml` | `package.json`, `package-lock.json`, `.vscodeignore`, `src/**`, `scripts/verify-vsix-activation.mjs`, `.github/workflows/release.yml`, `webpack.config.cjs` | No (path filter) |
| `Docs` | `docs.yml` | `site/**`, `docs/**`, `examples/**`, `README.md`, `CHANGELOG.md`, `.github/workflows/docs.yml` | No (path filter) |
| `Test VS Code Minimum` | `test-vscode-minimum.yml` | `src/**`, `package.json`, `package-lock.json`, `.vscode-test.mjs`, `webpack.config.cjs`, `tsconfig.json`, `tsdoc.json`, `eslint.config.mjs`, `l10n/**`, `package.nls*.json`, `scripts/**`, own file | No (path filter, #253) |
| `Test VS Code Stable` | `test-vscode-stable.yml` | same as Minimum | No |
| `Test VS Code Insiders` | `test-vscode-insiders.yml` | same as Minimum | No |

`publish-openvsx.yml` (`workflow_call` and `workflow_dispatch`) and `verify-marketplace-auth.yml`
(`workflow_dispatch`) never run on a PR. The current trigger list had 4 of these 7.

### The "5 of 15" claim: confirmed

`gh pr list --state merged --author app/dependabot`: of the 15 most recent (#212 to #237), the
merger was `github-actions` for #237, #227, #219, #217, #212 (5) and the maintainer for the
other 10.

### Evidence for the race

For each Dependabot PR I took the runs at the final head sha and looked at which workflow
finished last (`gh run list --branch ...`):

- The 15 most recent are #212 to #237. #236 is left out (it needed manual fix commits). Of the
  other 9 merged by hand, 8 ended with `Build & Release` as the last workflow to finish (#228,
  #224, #223, #218, #216, #215, #214, #213) and 1 (#225) with the Minimum test, see the next
  section. Extending the window to #204 gives 10 of 12 on `Build & Release`.
- All 5 PRs merged by the workflow (#237, #227, #219, #217, #212) ended on a listed workflow
  (`Test VS Code Stable` or `Build - Master`). In every one the `Build & Release` run had already
  finished, so the listed one happened to be last.
- Log of the six `Auto-merge Dependabot PRs` runs for #236 and #237 on 2026-11-02 (what the job
  printed):
  - #236: `blocked` (06:12:14), `blocked` (06:13:04), `unstable` (06:13:27). No further run, so
    it was never re-evaluated. (Its `Build & Release` also failed, which is a separate, correct
    reason not to merge: the `@types/vscode` floor.)
  - #237: `unstable` (06:14:36), `unstable` (06:15:24), `clean` and "Successfully merged"
    (06:16:35). It worked only because the last workflow to finish, `Test VS Code Stable`
    (06:16:24), happened to be listed. `Build & Release` had finished at 06:15:34 with no
    listener.
  - So the state is `blocked` while required checks are pending, `unstable` while any other check
    is pending or failing, and `clean` only when everything is done. The issue's explanation is
    correct.

### Evidence the issue did not mention: name drift hid the Minimum workflow for months

`workflow_run.workflows` matches the name of the run as it was when the PR ran. Until #248
(2026-11-04) `test-vscode-minimum.yml` was named `Test VS Code Minimum (1.140.0)` (and the list
said `1.109.0`, stale since 2026-02). So `Test VS Code Minimum` never fired for any PR before
that fix (#248). In the 2026-11-02 logs there are only 3 runs per PR (Stable, Insiders,
`Build - Master`), never a 4th for Minimum. #225 and #205 were merged by hand because Minimum was
the last to finish and it was not matched.

Consequence: a PR branch that is behind `master` still carries the old workflow file in its merge
ref, so for some days after a rename the run name differs from the list. A longer list of
workflows makes the job robust to this: any one of seven completions can be the last one.

### Facts about the flow that shape the design

- Each `workflow_run` event is per workflow, not per job, and fires when the whole workflow is
  done. Skipped path-filtered workflows produce no event at all.
- `listPullRequestsAssociatedWithCommit(head_sha)[0]` can return a different PR or a merged one.
  The event has `head_branch`, `head_sha` and `head_repository`, so the PR is matched by head
  branch and the sha must still be the PR head.
- Squash merge by `GITHUB_TOKEN` does not start the `push` workflows on `master`. This is existing
  behaviour and out of scope; noted in the report.

## Update type (major, minor, patch)

### Can `dependabot/fetch-metadata` be used?

No, not directly in this job. I read its source (v3.1.0):

1. It reads the PR from `context.payload.pull_request`. In a `workflow_run` or `workflow_dispatch`
   event that key does not exist, and the action answers "Event payload missing `pull_request`
   key" and fails. Using it would need a second workflow on `pull_request` or
   `pull_request_target` that hands the result over (label or artifact), and a new workflow with
   write permissions that calls a third-party action. More moving parts and more attack surface
   for no gain.
2. It reads the message of the PR **head** commit. #227 and #236 and others carry maintainer
   commits on top of Dependabot's (a type fix, the `engines.vscode` raise), so the head commit has
   no metadata and the action fails with "PR does not contain metadata".

### How it classifies, and what this job reproduces

Dependabot writes a YAML block in its commit message:

```text
---
updated-dependencies:
- dependency-name: webpack
  dependency-version: 5.112.1
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: development-dependencies
...
```

For a grouped PR the block has one entry per dependency, each with its own `update-type`.
fetch-metadata's `update-type` output is the highest across the entries
(`major > minor > patch`), so one major makes the whole PR major. This job applies the same rule
but stricter: the PR is auto-mergeable only if **every** entry is minor or patch.

Findings in this repository's history that the parser must handle:

- Security updates of indirect dependencies (#219 markdown-it, #218, #211, #206) have **no**
  `update-type` line. fetch-metadata falls back to comparing the versions in the message (`Bumps ...
  from A to B.` or `Updates \`name\` from A to B`). The job does the same and, when it still cannot
  tell, treats the PR as "needs a human" (fail closed). Without the fallback these four security
  PRs would no longer be merged.
- GitHub Actions majors are plain `version-update:semver-major` with `dependency-version: '8'`
  (#189, #188). `dependency-type` is irrelevant: the update type decides.
- `dependabot.yml` groups only `minor` and `patch`, so a major normally arrives as its own PR
  (`mocha 12.0.0` was #205). The group rule is still implemented because it costs nothing and the
  grouping config can change.
- Only commits authored by `dependabot[bot]` **and** with a verified signature are trusted as a
  source of metadata (the same checks fetch-metadata does). Maintainer commits on top are not
  parsed and do not change the decision.

Fail-closed rule: auto-merge only when the PR has at least one trusted metadata entry and every
entry resolves to `version-update:semver-minor` or `version-update:semver-patch`. Everything else
logs "major update, waiting for human review" (or "could not determine the update type, waiting
for human review") and exits successfully.

### Dependencies at 0.x (for the maintainer to decide, not implemented)

Dependabot says `semver-minor` for `0.155.0 to 0.156.0`, although under semver a 0.x minor may
break. Current direct dependencies below 1.0: `oxc-minify` 0.156.0 (the runtime JS minifier),
`@vscode/l10n-dev` 0.0.35, `@vscode/test-cli` 0.0.15, `eslint-plugin-tsdoc` 0.5.4 and
`markdownlint-cli2` 0.24.0. For `0.0.x` packages even a patch bump may break. A policy would
treat an entry as major when its `dependency-version` starts with `0.` unless it is a patch bump
within `0.y.z` with `y > 0`. It is a few lines in the same function.

## Proposed changes

1. `auto-merge-dependabot.yml`, rewritten:
   - `workflow_run` on the seven workflows above, `types: [completed]`.
   - `workflow_dispatch` with `pr_number` and `dry_run` (default `true`).
   - Job `if`: dispatch, or a successful `pull_request` run on a `dependabot/` branch (noise
     filter only; the author check is the real guard).
   - `concurrency` per PR (head branch, or `dispatch-<pr_number>`). Runs that will be skipped get a
     unique group so they cannot replace a pending real run.
   - Minimal permissions: `contents: write` (merge), `pull-requests: write` (merge and read
     commits), `checks: read` (to tell failed from pending). No checkout.
   - One `actions/github-script` step with the decision flow below. Only `PR_NUMBER` and `DRY_RUN`
     are passed, through `env:`.
2. `.github/dependabot.yml`: fix the `.ym` typo and say majors are left for review.
3. `AGENTS.md`, `CONTRIBUTING.md`, `CHANGELOG.md`: describe the new behaviour.

## Decision flow

1. Resolve the PR: dispatch uses `pr_number`; `workflow_run` lists open PRs for
   `owner:head_branch`, same base as the default branch, and requires `head.sha ==
   workflow_run.head_sha` (a stale event is ignored quietly).
2. Safety: open, not draft, author `dependabot[bot]` of type `Bot`, head in this repository, base is
   the default branch. Otherwise leave it untouched.
3. Update type from the Dependabot commits. Not minor or patch for every dependency: log and stop.
4. Up to 6 attempts, 10 s apart:
   - `mergeable_state` `unknown`: wait.
   - `clean`: squash merge with `sha: head.sha` (or report in dry run).
   - `dirty`, `behind`, `draft`: stop with the reason.
   - otherwise read the check runs: a failed one: stop, name it, never merge; one still running:
     exit quietly, the next completion fires the job again; all green yet not `clean`: wait (lazy
     state) and finally report the state.
5. Merge errors 405 and 409 (already merged, head moved) are logged, not failed.

## Testing strategy

- `actionlint` on the workflow; `npm run lint:md`, `npm run format:check`, `npm run lint`.
- The decision logic is run as plain Node: the `script:` text is extracted from the YAML and run
  against fake `github`, `context` and `core` objects. Cases: patch, minor, major, group with one
  major, GitHub Actions major, indirect security update without `update-type`, unverified or
  non-Dependabot commit, other author, failed check, pending check, `unknown` then `clean`, dry run,
  stale sha, merge 409.
- Only the next real Dependabot PR proves the `workflow_run` wiring (it runs from `master`).

## Phases

- [x] Phase 1: verify premises, write this plan
- [ ] Phase 2: rewrite the workflow, fix the typo
- [ ] Phase 3: local decision-logic tests, validations
- [ ] Phase 4: docs, changelog, review, push
