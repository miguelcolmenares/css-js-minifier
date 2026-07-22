# Contributing to CSS & JS Minifier

Thanks for wanting to contribute! This document covers the essentials: local setup, how the CI matrix validates your work across platforms, and what to include in a pull request.

## Prerequisites

- **Node.js 20+** (matches the version used in CI).
- **npm 10+** (bundled with Node 20).
- **VS Code 1.125.0 or newer** (matches `engines.vscode` in `package.json`).
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
| `Test: Run All Tests` | Full suite (52+ tests) | ~2 min |
| `Test: Main Functionality Suite Only` | Core minification (21 tests) | ~1.5 min |
| `Test: Configuration Suite Only` | Configuration (4 tests) | ~20 s |
| `Test: Internationalization (i18n) Suite Only` | Translations across 7 languages | ~30 s |

Or from the CLI: `npm test` (runs pretest + full suite).

## Cross-platform validation

**You do not need to test on multiple operating systems locally.** The `Build & Release` workflow (`.github/workflows/release.yml`) automatically runs a 6-platform build matrix on every pull request that touches:

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
| `ubuntu-latest` | `linux-x64` | 64-bit Linux (glibc) |
| `ubuntu-24.04-arm` | `linux-arm64` | ARM Linux (glibc) |
| `windows-latest` | `win32-x64` | 64-bit Windows |
| `windows-11-arm` | `win32-arm64` | ARM Windows |

For each target, the workflow packages a platform-tagged `.vsix` and runs `scripts/verify-vsix-activation.mjs`, which extracts the archive and confirms that both `require('lightningcss').transform(...)` and `require('oxc-minify').minifySync(...)` execute without errors. If any of the six fails, the PR is not mergeable.

If your change **doesn't** touch any of the paths above, the matrix is skipped (test suite still runs). This keeps CI cost proportional to risk.

## Pull request checklist

Before opening a PR, please make sure:

- [ ] Code is formatted and lints clean: `npm run lint`
- [ ] All tests pass locally on your platform: `npm test`
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `perf:`)
- [ ] Branch name follows `<type>/<short-description>` (e.g. `feat/new-language-support`, `fix/windows-path-encoding`)
- [ ] `CHANGELOG.md` has a new entry under `## [Unreleased]` describing the user-facing impact of your change
- [ ] Documentation in `README.md` or `docs/` is updated if you added or changed user-visible behavior
- [ ] If you added a new user-visible string, all seven `l10n/bundle.l10n.*.json` files have the corresponding key (see [docs/INTERNATIONALIZATION.md](docs/INTERNATIONALIZATION.md))

### Why you must open a PR (branch protection)

`master` is protected by the `Protect master` repository ruleset. Direct pushes are rejected — every change, including maintainer changes, must arrive via pull request. The ruleset requires four checks to pass before a PR can be merged: three cross-platform tests (`Test on ubuntu-latest`, `Test on macos-latest`, `Test on windows-latest`) and CodeQL (`Analyze (javascript-typescript)`). These run automatically on every PR to `master`, so you don't need to trigger anything manually. See [AGENTS.md → Branch protection](AGENTS.md#branch-protection-master) for the full ruleset breakdown.

## Release process (maintainer only)

Releases are gated behind two safeguards that contributors don't need to worry about but should be aware of:

1. **Marketplace auth preflight** — before a tag or GitHub Release is created, the release workflow verifies that the maintainer's `VSCE_PAT` is still valid via `vsce verify-pat`. If the PAT is expired or has the wrong scope, the workflow exits before creating anything on GitHub or the Marketplace — no versions are burned.
2. **Immutable tags and releases** — once a `v*` tag is pushed, the repository ruleset blocks deletion and force-push. A given `v1.x.y` tag → release → `.vsix` set is stable forever. If a release ever needs to be re-cut, it must go under a fresh version number.

The release itself is triggered from GitHub Actions (`workflow_dispatch` on `Build & Release`) with the version number as input. See [`.github/instructions/publish-update-extension.instructions.md`](.github/instructions/publish-update-extension.instructions.md) for the full runbook.

## Reporting bugs and requesting features

- **Bugs:** please include your OS + architecture, VS Code version (`Code → About`), extension version, and the exact steps to reproduce.
- **Features:** describe the use case first — what problem are you trying to solve? — before proposing a specific implementation.

Open issues at: <https://github.com/miguelcolmenares/css-js-minifier/issues>

## License

By contributing you agree that your contributions will be licensed under the [MIT License](LICENSE.md).
