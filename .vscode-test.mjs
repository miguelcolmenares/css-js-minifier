import { defineConfig } from '@vscode/test-cli';

/**
 * VS Code Test CLI configuration.
 *
 * By default, tests run under the host machine's locale (typically English).
 * To exercise the i18n runtime under a specific locale, set `VSCODE_LOCALE`
 * before invoking the tests:
 *
 *   VSCODE_LOCALE=es npm test          # Spanish
 *   VSCODE_LOCALE=fr npm test          # French
 *   VSCODE_LOCALE=qps-ploc npm test    # Pseudo-locale (built into VS Code)
 *
 * The corresponding Language Pack extension must be installed in the VS Code
 * test host for locale switching to take effect — see docs/INTERNATIONALIZATION.md.
 *
 * Coverage is opt-in. The `coverage` block at the bottom is read only when the
 * CLI runs with `--coverage` (`npm run test:coverage`), so a plain `npm test`
 * is unaffected. The extension under test runs from the webpack bundle
 * `dist/extension.js`, so `test:coverage` first rebuilds it with `--env coverage`
 * (see `webpack.config.cjs`) to make its source map point at the real `src/**`
 * files.
 *
 * See: https://code.visualstudio.com/api/working-with-extensions/testing-extension
 * See: https://code.visualstudio.com/docs/configure/locales
 */
const locale = process.env.VSCODE_LOCALE;

/** @type {import('@vscode/test-cli').TestConfiguration} */
const test = {
	files: 'out/test/**/*.test.js',
	version: process.env.VSCODE_VERSION || '1.145.0',
};

if (locale) {
	test.launchArgs = [`--locale=${locale}`];
}

// `coverage` is a sibling of `tests`, not an option of a single test entry: a flat
// `defineConfig({ files, version, coverage })` silently ignores it. The CLI also
// ignores a `coverage.output` here, so the report folder is set by `--coverage-output`
// in the `test:coverage` script. Patterns are matched against absolute paths.
export default defineConfig({
	tests: [test],
	coverage: {
		include: ['**/src/**', '**/dist/extension.js', '**/out/**'],
		exclude: ['**/src/test/**', '**/out/test/**'],
		includeAll: false,
		reporter: ['lcovonly'],
	},
});
