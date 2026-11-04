<!-- agents-toolkit:planning-doc issue=262 -->
# Plan: simplify the issue forms (#262)

Temporary planning file. Deleted by `create-github-pr` before the PR reaches master.

## Findings verified (2026-11-04)

- Discussions: `gh repo view --json hasDiscussionsEnabled` returns `false`. `config.yml` and `question.yml` link to `/discussions` (404).
- Labels that exist: `bug`, `enhancement`, `question`, `documentation` (plus others). `needs-triage` does not exist; all 4 forms apply it.
- Private vulnerability reporting: `gh api repos/miguelcolmenares/css-js-minifier/private-vulnerability-reporting` returns `{"enabled":true}`.
- Required fields today: bug 12, feature 8, question 6, documentation 6. All 4 forms assign `miguelcolmenares`.
- References to the files being removed or renamed outside `.github/ISSUE_TEMPLATE/`:
  - `docs/TROUBLESHOOTING.md`: links to `bug_report.yml`, `question.yml`, `feature_request.yml`, `documentation.yml`.
  - `.prettierignore` comment mentions the issue templates documenting `[Bug]: ` prefixes (that was the template README).
  - `CONTRIBUTING.md`: describes bug and feature reporting, no template links.
  - No link to `TEMPLATES_SUMMARY.md` or the template `README.md` from anywhere else.

## Changes

1. `bug_report.yml`: 4 required fields (what happened, steps, versions, OS); settings, sample, log, extra optional.
2. `feature_request.yml`: 2 required fields (problem, idea); alternatives optional.
3. `config.yml`: drop Discussions, docs site + FAQ + troubleshooting, keep security advisory, blank issues on.
4. Delete `question.yml`, `documentation.yml`, `README.md`, `TEMPLATES_SUMMARY.md`.
5. `docs/TROUBLESHOOTING.md`, `CONTRIBUTING.md`, `.prettierignore`: align with the new forms, fix dead links.

## Validation

`yaml.safe_load` plus a structural check against the issue forms schema; `npm run lint:md`, `format:check`, `lint`; `core-review --budget medium`.
GitHub renders forms only from the default branch, so rendering is confirmed after merge.
