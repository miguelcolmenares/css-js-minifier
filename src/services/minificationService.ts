/**
 * @fileoverview Minification service facade that orchestrates all minification strategies.
 *
 * This module serves as the main entry point for minification operations,
 * routing requests to the appropriate strategy based on file type:
 * - CSS files → Local minification using LightningCSS
 * - JavaScript files → Local minification using oxc-minify
 *
 * @author Miguel Colmenares
 * @version 1.3.0
 * @since 0.1.0
 *
 * @example
 * ```typescript
 * import { getMinifiedText } from './minificationService';
 *
 * // CSS is minified locally
 * const cssResult = getMinifiedText(cssCode, 'css');
 *
 * // JavaScript is minified locally
 * const jsResult = getMinifiedText(jsCode, 'javascript');
 * ```
 */

import * as vscode from 'vscode';
import { t } from '@/utils/l10nHelper';
import { MinificationResult } from '@/types';
import { minifyCss, minifyJs } from './strategies';

// Re-export types for backward compatibility
export { MinificationResult, MinificationStats } from '@/types';

/**
 * Minifies CSS or JavaScript code using the appropriate strategy.
 *
 * This function acts as a facade, routing minification requests to the
 * appropriate strategy based on the file type:
 *
 * **CSS Minification (Local - LightningCSS):**
 * - No network required - works offline
 * - Rust-based parser (~60x faster than JavaScript alternatives)
 * - Full support for modern CSS features (@starting-style, CSS Nesting, etc.)
 *
 * **JavaScript Minification (Local - oxc-minify):**
 * - No network required - works offline
 * - Rust-based minifier from the Oxc project
 * - Variable mangling, dead code elimination, constant folding
 * - No rate limits or file size restrictions
 *
 * @function getMinifiedText
 * @param {string} text - The source code to be minified (CSS or JavaScript)
 * @param {string} fileType - The file type identifier ('css' or 'javascript')
 * @returns {MinificationResult | null} The minified code with statistics, or null if minification failed
 *
 * @sideEffects
 * - Shows error messages to the user via VS Code notifications on failure
 *
 * @example
 * ```typescript
 * // Minify CSS code (uses local LightningCSS)
 * const cssResult = getMinifiedText(cssCode, 'css');
 *
 * // Minify JavaScript code (uses local oxc-minify)
 * const jsResult = getMinifiedText(jsCode, 'javascript');
 * ```
 *
 * @see {@link https://lightningcss.dev/} LightningCSS documentation
 * @see {@link https://github.com/nicolo-ribaudo/oxc-minify} oxc-minify documentation
 */
export function getMinifiedText(text: string, fileType: string): MinificationResult | null {
	switch (fileType) {
		case 'css':
			return minifyCss(text);

		case 'javascript':
			return minifyJs(text);

		default:
			vscode.window.showErrorMessage(t('minificationService.fileType.unsupported', fileType));
			return null;
	}
}
