<!-- agents-toolkit:planning-doc issue=261 -->

# Plan: split the Docs concurrency group (#261)

## Problem

`docs.yml` declares `concurrency: { group: pages, cancel-in-progress: false }` at workflow level, so
every `Build docs` run (pull request, push, dispatch) competes with deploys for one group. A group
holds one running and one pending run, and a newer pending run cancels the older pending one even
with `cancel-in-progress: false`.

## Evidence (premise confirmed)

- Run 41905052487 (PR #256, branch `docs/254-user-guide-site`), attempt 1: created 20:16:37Z,
  `cancelled` at 20:17:07Z, before any job started. Attempt 2 (manual re-run) passed.
- Run 41904946309 (push to `master`, 20:15:57Z, finished 20:17:19Z) held the `pages` group.
- Run 41905126589 (PR `feature/252-ci-path-filters`, created 20:17:05Z) queued behind it and replaced
  the pending #256 run two seconds later. So the canceller was a pull request on an unrelated branch
  and the holder was a master push, not the #251 and #253 merges named in the issue (same mechanism).
- GitHub docs, "Using concurrency": at most one running and one pending run per group, and an
  existing pending run is canceled and replaced by the new one.

## Proposed change

`docs.yml` only:

1. Remove the workflow-level `concurrency`.
2. `build`: group `${{ github.workflow }}-${{ pull_request ? github.ref : github.run_id }}`,
   `cancel-in-progress` only for pull requests (same form as #253).
3. `deploy`: `group: pages`, `cancel-in-progress: false`.

Names (`Docs`, `Build docs`, `Deploy to GitHub Pages`), pinned SHAs and the docs-sitekit version stay.

## release.yml

Its `deploy-docs` job deploys to the same `github-pages` environment with no concurrency. Report the
overlap analysis; decide whether a one-line group is clearly safe.

## Testing

`actionlint`, `npm run lint:md`, `npm run format:check`, `npm run lint`. Real runs are the only proof
of the cancellation behaviour.
