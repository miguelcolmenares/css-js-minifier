# Contributing to CSS & JS Minifier

Thanks for wanting to contribute! This document covers the essentials: local setup, how the CI matrix validates your work across platforms, and what to include in a pull request.

## Prerequisites

- **Node.js 20+** (matches the version used in CI).
- **npm 10+** (bundled with Node 20).
- **VS Code 1.144.0 or newer** (matches `engines.vscode` in `package.json`).
- **Git** with `core.autocrlf` set to `false` if you're on Windows (the CI enforces this to keep test fixtures byte-identical across platforms).

## Local setup

```bash
git clone https://github.com/miguelcolmenares/css-js-minifier.git
cd css-js-minifier
npm ci
```

`npm ci` installs the native bindings (`lightningcss`, `oxc-minify`, `detect-libc`) that match **your** OS and architecture only — that's normal. The CI matrix handles the other five platforms for you (see [Cross-platform validation](#cross-platform-validation) below).

## Development workflow

- **Watch mode (extension bundle):** `npm run watch` — webpack rebuilds on save.
- **Watch mode (tests):** `npm run watch-tests` — TypeScript recompiles test files on save.
- **Combined:** run the VS Code task `tasks: watch-tests` (starts both watchers).
- **Debug the extension:** press `F5` in VS Code to launch an Extension Development Host.

## Running tests locally

The fastest way is via the VS Code tasks (`Cmd/Ctrl + Shift + P` → **Tasks: Run Task**):

| Task | Scope | Duration |
| --- | --- | --- |
| `Test: Run All Tests` | Full suite (171 tests) | ~2 min |
| `Test: Main Functionality Suite Only` | Core minification (25 tests) | ~1.5 min |
| `Test: Configuration Suite Only` | Configuration (12 tests) | ~20 s |
| `Test: Internationalization (i18n) Suite Only` | Translations across 7 languages | ~30 s |

Or from the CLI: `npm test` (runs pretest + full suite).

### Test coverage

```bash
npm run test:coverage
```

This rebuilds the bundle for coverage, runs the full suite once, prints a per-file summary for `src/**` (lines, functions and branches), and writes an `lcov` report to `coverage/lcov.info`. The `coverage/` folder is git-ignored and excluded from the `.vsix`. It adds no dependency (it uses the `c8` that `@vscode/test-cli` already ships) and leaves `npm test` untouched.

Coverage is for orientation only: there is no minimum threshold, and the native code in `lightningcss` and `oxc-minify` cannot be measured. In CI, the Ubuntu job of `test-vscode-stable.yml` publishes the same table in its job summary; it never fails the job. How it works, and why the bundle needs a special source-map path, is in [docs/TESTING-GUIDE.md](docs/TESTING-GUIDE.md#test-coverage).

## Cross-platform validation

**You do not need to test on multiple operating systems locally.** The `Build & Release` workflow (`.github/workflows/release.yml`) automatically runs an 8-target build matrix on every pull request that touches:

- `src/**`
- `package.json` or `package-lock.json`
- `.vscodeignore`
- `scripts/verify-vsix-activation.mjs`
- `webpack.config.cjs`
- `.github/workflows/release.yml`

The matrix:

| Runner | Target | Native binding validated |
| --- | --- | --- |
| `macos-15-intel` | `darwin-x64` | Intel Mac |
| `macos-latest` | `darwin-arm64` | Apple Silicon |
| `ubuntu-26.04` | `linux-x64` | 64-bit Linux (glibc) |
| `ubuntu-24.04-arm` | `linux-arm64` | ARM Linux (glibc) |
| `windows-latest` | `win32-x64` | 64-bit Windows |
| `windows-11-arm` | `win32-arm64` | ARM Windows |
| `ubuntu-26.04` | `alpine-x64` | 64-bit Alpine Linux (musl, smoke-tested in an Alpine container) |
| `ubuntu-24.04-arm` | `alpine-arm64` | ARM Alpine Linux (musl, smoke-tested in an Alpine container) |

For each target, the workflow packages a platform-tagged `.vsix` and runs `scripts/verify-vsix-activation.mjs`, which extracts the archive and confirms that both `require('lightningcss').transform(...)` and `require('oxc-minify').minifySync(...)` execute without errors. If any of the eight fails, the PR is not mergeable.

If your change **doesn't** touch any of the paths above, the matrix is skipped (the `Test on …` checks of `master.yml` still run). The three VS Code version workflows (`test-vscode-minimum.yml`, `test-vscode-stable.yml`, `test-vscode-insiders.yml`) are also skipped unless your change touches code or test inputs; see [AGENTS.md → Cross-platform CI matrix](AGENTS.md#cross-platform-ci-matrix). This keeps CI cost proportional to risk.

The test suite also runs against three VS Code builds: the minimum supported version (`test-vscode-minimum.yml`), the current Stable (`test-vscode-stable.yml`) and VS Code Insiders (`test-vscode-insiders.yml`), each on Ubuntu, macOS and Windows. Minimum and Stable are the ones the README badges report. Insiders is deliberately not badged: it is an early warning for maintainers, not a support promise, and a red badge there would alarm users without telling them anything about the released extension. It is not a required check, so a failure on an Insiders build is not a blocker for your PR. If it is red, check whether the same failure also appears on Stable before assuming your change caused it.

## Pull request checklist

Before opening a PR, please make sure:

- [ ] Code is formatted and lints clean: `npm run lint` (includes TSDoc validation) and `npm run format:check`
- [ ] Markdown lints clean: `npm run lint:md`. Prettier does not format `*.md` — `markdownlint-cli2` owns it, and its `--fix` is deliberately not part of any script because several of its rewrites change what a document says
- [ ] All tests pass locally on your platform: `npm test`
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `perf:`)
- [ ] Branch name follows `<type>/<short-description>` (e.g. `feat/new-language-support`, `fix/windows-path-encoding`)
- [ ] `CHANGELOG.md` has a new entry under `## [Unreleased]` describing the user-facing impact of your change
- [ ] Doc comments on new/modified functions follow [TSDoc](https://tsdoc.org/) syntax (enforced by `eslint-plugin-tsdoc`)
- [ ] Documentation in `README.md` or `docs/` is updated if you added or changed user-visible behavior
- [ ] If you added a new user-visible string, all seven `l10n/bundle.l10n.*.json` files have the corresponding key (see [docs/INTERNATIONALIZATION.md](docs/INTERNATIONALIZATION.md))

### Why you must open a PR (branch protection)

`master` is protected by the `Protect master` repository ruleset. Direct pushes are rejected — every change, including maintainer changes, must arrive via pull request. The ruleset requires four checks to pass before a PR can be merged: three cross-platform tests (`Test on ubuntu-latest`, `Test on macos-latest`, `Test on windows-latest`) and CodeQL (`Analyze (javascript-typescript)`). These run automatically on every PR to `master`, so you don't need to trigger anything manually. See [AGENTS.md → Branch protection](AGENTS.md#branch-protection-master) for the full ruleset breakdown.

## Release process (maintainer only)

Releases are gated behind three safeguards that contributors don't need to worry about but should be aware of:

1. **Marketplace auth preflight** — before a tag or GitHub Release is created, the release workflow verifies that the Microsoft Entra identity used for publishing is still valid via `vsce verify-pat --azure-credential`. If the identity cannot publish for the publisher, the workflow exits before creating anything on GitHub or the Marketplace — no versions are burned.
2. **Independent registries** — the Marketplace and [Open VSX](https://open-vsx.org) publish jobs both start after the tag and GitHub Release exist, and neither blocks the other. Open VSX publishes with trusted publishing (OIDC), so there is no token to expire, and it can be retried alone with `publish-openvsx.yml`.
3. **Immutable tags and releases** — once a `v*` tag is pushed, the repository ruleset blocks deletion and force-push. A given `v1.x.y` tag → release → `.vsix` set is stable forever. If a release ever needs to be re-cut, it must go under a fresh version number.

The release itself is triggered from GitHub Actions (`workflow_dispatch` on `Build & Release`) with the version number as input. See [`.github/instructions/publish-update-extension.instructions.md`](.github/instructions/publish-update-extension.instructions.md) for the full runbook.

## Reporting bugs and requesting features

- **Bugs:** use the [bug report form](https://github.com/miguelcolmenares/css-js-minifier/issues/new?template=bug_report.yml). It asks for what happened, the steps to reproduce, the extension and VS Code versions, and your OS + architecture. The same list is in the [troubleshooting page](docs/TROUBLESHOOTING.md#report-a-bug).
- **Features:** use the [feature request form](https://github.com/miguelcolmenares/css-js-minifier/issues/new?template=feature_request.yml). Describe the use case first, what problem are you trying to solve, before proposing a specific implementation.
- **Questions and documentation fixes:** open a blank issue. A workflow gives it the generic `needs-triage` label (see `.github/workflows/label-new-issues.yml`), and the maintainer replaces it with a specific one when triaging.

Open issues at: <https://github.com/miguelcolmenares/css-js-minifier/issues>

## License

By contributing you agree that your contributions will be licensed under the [MIT License](LICENSE.md).
