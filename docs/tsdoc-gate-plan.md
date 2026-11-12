<!-- agents-toolkit:planning-doc issue=283 -->
# TSDoc completeness gate in CI (issue #283)

## Problem

CI checks the syntax of doc comments (`eslint-plugin-tsdoc`), but nothing checks that every export has a comment or that legacy JSDoc is gone. The other repositories of the organization run the `miguelcolmenares/jsdoc-to-tsdoc` Action for this.

## Current state

- `.github/workflows/master.yml` holds the quality checks in the `quality` job (`Format & Markdown`), and the `test` matrix.
- The file pins `actions/checkout@v7` by tag, not by SHA. The issue assumed a SHA pin, so the new job follows the file.
- A local run on Node 24 with `--exclude "**/components/ui/**"` scans 98 files with 0 problems.

## Changes

1. `master.yml`: a `tsdoc` job named `TSDoc`, next to `quality`. It runs the Action pinned to `78f159f0774ab8d1532c8b14437676dd34d36f6c` (tag `v1.0.0`), with `node-version: "24"` and the generated shadcn files excluded.
2. `CONTRIBUTING.md`: the TSDoc line of the pull request checklist names the gate and the exclusion.
3. `AGENTS.md`: the TSDoc section says what CI checks and why `components/ui` is left out.
4. `CHANGELOG.md`: one entry under `Unreleased`, Changed.

## Testing

- Run `npx --yes jsdoc-to-tsdoc@1.0.0 check --exclude "**/components/ui/**"` on Node 24 and expect exit 0.
- Parse `master.yml` as YAML.
- Run `npm run lint:md` for the changed Markdown files.

## Lifecycle

Single PR. The plan file is removed in the last commit.
