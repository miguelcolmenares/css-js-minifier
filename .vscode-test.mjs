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
 * See: https://code.visualstudio.com/api/working-with-extensions/testing-extension
 * See: https://code.visualstudio.com/docs/configure/locales
 */
const locale = process.env.VSCODE_LOCALE;

/** @type {import('@vscode/test-cli').TestConfiguration} */
const config = {
	files: 'out/test/**/*.test.js',
	version: process.env.VSCODE_VERSION || '1.125.0',
};

if (locale) {
	config.launchArgs = ['--locale', locale];
}

export default defineConfig(config);
