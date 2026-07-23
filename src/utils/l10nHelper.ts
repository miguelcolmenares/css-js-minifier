/**
 * Thin re-export of `vscode.l10n.t()` — the extension follows
 * VS Code's canonical localization pattern where the English source string is
 * passed as the first argument to `t()` and non-English translations live in
 * `l10n/bundle.l10n.<locale>.json` (loaded automatically because `package.json`
 * declares `"l10n": "./l10n"`).
 *
 * When the display language is English (or no bundle matches the locale),
 * `vscode.l10n.t(message, ...args)` returns `message` with positional
 * placeholders substituted — so English "just works" without shipping a
 * `bundle.l10n.en.json`. See:
 * https://github.com/microsoft/vscode-extension-samples/tree/main/l10n-sample
 *
 * Regression guard: issue [#169](https://github.com/miguelcolmenares/css-js-minifier/issues/169)
 * — a previous implementation loaded the English source bundle unconditionally
 * and broke translations for every non-English user. The current helper
 * delegates directly to VS Code so the runtime picks the right bundle for the
 * user's locale.
 *
 * @author Miguel Colmenares
 * @since 1.1.0
 */

import * as vscode from 'vscode';

/**
 * Return the localized string for the given English source `message` in the
 * user's current display language, substituting positional arguments (`{0}`,
 * `{1}`, …) with the values in `args`.
 *
 * The first argument must be the English source text — VS Code uses it both as
 * the lookup key against the loaded locale bundle and as the fallback value
 * when no translation is available.
 *
 * @param message - English source string. Also the key used in bundle files.
 * @param args - Optional positional values to interpolate into `{0}`, `{1}`, …
 * @returns The translated message when a bundle matches, otherwise `message`
 *          with placeholders substituted.
 */
export function t(message: string, ...args: (string | number | boolean)[]): string {
	return vscode.l10n.t(message, ...args);
}
