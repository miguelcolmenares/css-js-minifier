<!-- agents-toolkit:planning-doc issue=241 -->
# Plan: test coverage reporting (#241)

## Problem statement

The repository collects no test coverage. Codecov was considered and deferred (native code is not measurable, Dependabot PRs get no secrets, the CI matrix is 3 x 3, another third-party service and token). The goal is local coverage with no new dependency, plus a summary in one CI job, with no external service and no secret.

## Current architecture

- `npm test` runs `vscode-test` (`@vscode/test-cli` 0.0.15) with `.vscode-test.mjs` and the compiled tests in `out/test/**` (`tsc`, `sourceMap: true`).
- The extension under test is NOT run from `out/`. Its `main` is `./dist/extension.js`, the webpack bundle (`devtool: 'nosources-source-map'`). The tests import only `l10nHelper` from `out/`.
- CI: `master.yml` has the required checks (`Test on ubuntu-latest|macos-latest|windows-latest`, CodeQL). The Ubuntu / VS Code Stable job lives in `test-vscode-stable.yml`, not `master.yml`.
- `@vscode/test-cli` already depends on `c8` ^11.0.0 and supports `--coverage`, `--coverage-output` and `--coverage-reporter`, and a `coverage` config block.

## Findings that change the issue text

- Coverage mechanics work with the shipped `c8`, so no dependency is needed.
- With webpack's default source-map paths (`webpack://css-js-minifier/./src/...`), c8 cannot read the sources: `src/**` shows 0%, or a false 100% for the mapped bogus paths. The bundle's source map must point at real absolute paths, only for coverage runs.
- `coverage` must be a sibling of `tests` in `defineConfig({ tests, coverage })`. A flat config ignores it. `coverage.output` is ignored by the CLI, so `--coverage-output` is passed by the npm script. Include and exclude patterns match absolute paths (`**/src/**`).
- c8 also reports non-source bundle modules (`external ...`, `webpack/bootstrap`) as 100%, and the CLI cannot exclude them after source mapping.

## Proposed changes

1. `webpack.config.cjs`: export a function of `env`; `--env coverage` sets `output.devtoolModuleFilenameTemplate` to `[absolute-resource-path]`. Regular builds and shipped maps are unchanged.
2. `.vscode-test.mjs`: `defineConfig({ tests: [test], coverage })`, reporter `lcovonly`, `includeAll: false`. `npm test` behaviour is unchanged.
3. `scripts/coverage-report.mjs`: keep only `src/**` (not `src/test/**`) records, rewrite `lcov.info` with relative paths, print a text table or, with `--markdown`, a job-summary table. Exit 1 if `src/extension.ts` is absent (bundle built without `--env coverage`).
4. `package.json`: `compile:coverage`, `pretest:coverage`, `test:coverage`.
5. Ignore `coverage/` in `.gitignore`, `.vscodeignore`, `eslint.config.mjs`, `.prettierignore`, `.markdownlint-cli2.jsonc`.
6. `test-vscode-stable.yml`: two informational steps on the Ubuntu matrix entry only (`continue-on-error: true`), after the existing test step. `master.yml` and the required checks are not touched.
7. Docs: `CONTRIBUTING.md`, `docs/TESTING-GUIDE.md`, `AGENTS.md` command list; one `### Added` entry in `CHANGELOG.md`.
8. Correct issue #241's text (out/ vs dist bundle, CI job location).

## Phases

1. Verify `@vscode/test-cli` coverage and the source-map mapping (done, see findings).
2. Build and script: webpack gate, test config, report script, npm scripts, ignore files.
3. CI: coverage steps in `test-vscode-stable.yml`.
4. Docs and changelog.
5. Validation and review: lint, tsc, lint:md, format:check, actionlint, coverage run, `npm test`, `core-review`.

## Decisions

- No minimum threshold: report only, until the numbers are known.
- No new dependency and no secret.

## Testing strategy

- Run `npm run test:coverage` for real: expect the per-file table for `src/**` with plausible, non-100% numbers, and `coverage/lcov.info`.
- Check the guard: a normally built bundle with `--coverage` must make the report script fail.
- Run the suite without `--coverage` and confirm no `coverage/` folder is produced.
- Check that `coverage/` is ignored by git, `vsce ls`, ESLint, Prettier and markdownlint, and that a production build's source map keeps the `webpack://` paths.
- `actionlint` on the touched workflow (only known finding: the `ubuntu-26.04` label).
