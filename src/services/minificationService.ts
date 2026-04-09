/**
 * @fileoverview Minification service facade that orchestrates all minification strategies.
 *
 * This module serves as the main entry point for minification operations,
 * routing requests to the appropriate strategy based on file type:
 * - CSS files → Local minification using LightningCSS
 * - JavaScript files → Remote minification using Toptal API
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
 * const cssResult = await getMinifiedText(cssCode, 'css');
 *
 * // JavaScript is minified via Toptal API
 * const jsResult = await getMinifiedText(jsCode, 'javascript');
 * ```
 */

import * as vscode from 'vscode';
import { t } from '@/utils/l10nHelper';
import { MinificationResult } from '@/types';
import { minifyCss, minifyJavaScript } from './strategies';

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
 * **JavaScript Minification (Remote - Toptal API):**
 * - Maximum file size: 5MB per request
 * - Rate limit: 30 requests per minute
 * - 5-second timeout for network variations
 *
 * @async
 * @function getMinifiedText
 * @param {string} text - The source code to be minified (CSS or JavaScript)
 * @param {string} fileType - The file type identifier ('css' or 'javascript')
 * @returns {Promise<MinificationResult | null>} The minified code with statistics, or null if minification failed
 *
 * @sideEffects
 * - For JavaScript: Makes an HTTP POST request to external Toptal API
 * - Shows error messages to the user via VS Code notifications on failure
 *
 * @example
 * ```typescript
 * // Minify CSS code (uses local clean-css)
 * const cssResult = await getMinifiedText(cssCode, 'css');
 *
 * // Minify JavaScript code (uses Toptal API)
 * const jsResult = await getMinifiedText(jsCode, 'javascript');
 * ```
 *
 * @see {@link https://github.com/clean-css/clean-css} clean-css documentation
 * @see {@link https://www.toptal.com/developers/javascript-minifier} JavaScript Minifier API
 */
export async function getMinifiedText(text: string, fileType: string): Promise<MinificationResult | null> {
	switch (fileType) {
		case 'css':
			return minifyCss(text);

		case 'javascript':
			return minifyJavaScript(text);

		default:
			vscode.window.showErrorMessage(t('minificationService.fileType.unsupported', fileType));
			return null;
	}
}
