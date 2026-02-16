/**
 * @fileoverview Local CSS minification strategy using clean-css library.
 * 
 * This module provides offline CSS minification without requiring network access.
 * It uses clean-css level 2 optimizations for aggressive yet safe compression.
 * 
 * @author Miguel Colmenares
 * @version 1.2.0
 * @since 1.2.0
 * @see {@link https://github.com/clean-css/clean-css} clean-css documentation
 */

import * as vscode from "vscode";
import CleanCSS from "clean-css";
import { t } from "../../utils/l10nHelper";
import { MinificationResult, MinificationStats } from "../../types";
import { CLEAN_CSS_OPTIONS, formatBytes } from "../../lib";

/**
 * Minifies CSS code locally using the clean-css library.
 * 
 * This function provides offline CSS minification without requiring network access.
 * It uses clean-css level 2 optimizations which include:
 * - Removing whitespace and comments
 * - Merging adjacent rules with same selectors
 * - Combining longhand properties into shorthands
 * - Removing duplicate rules
 * - Optimizing colors, fonts, and other values
 * 
 * @function minifyCss
 * @param {string} text - The CSS source code to be minified
 * @returns {MinificationResult | null} The minified CSS with statistics, or null if minification failed
 * 
 * @sideEffects
 * - Shows error messages to the user via VS Code notifications on failure
 * 
 * @example
 * ```typescript
 * const cssCode = 'body { color: red; margin: 0; }';
 * const result = minifyCss(cssCode);
 * // Result: { minifiedText: 'body{color:red;margin:0}', stats: { ... } }
 * ```
 */
export function minifyCss(text: string): MinificationResult | null {
	try {
		const cleanCSS = new CleanCSS(CLEAN_CSS_OPTIONS);
		const output = cleanCSS.minify(text);
		
		// Check for errors (critical issues that prevent minification)
		if (output.errors && output.errors.length > 0) {
			const errorMessage = output.errors[0];
			vscode.window.showErrorMessage(
				t('minificationService.error.cssLocal', errorMessage)
			);
			return null;
		}
		
		// Note: We silently ignore warnings since clean-css can still produce valid output
		// Warnings typically indicate minor CSS issues that don't affect the minified result
		
		// Ensure we have valid output
		if (typeof output.styles !== 'string') {
			vscode.window.showErrorMessage(
				t('minificationService.error.invalidResponse')
			);
			return null;
		}
		
		// Calculate statistics using clean-css built-in stats
		const stats: MinificationStats = {
			originalSize: output.stats.originalSize,
			minifiedSize: output.stats.minifiedSize,
			reductionPercent: Math.round(output.stats.efficiency * 100),
			originalSizeKB: formatBytes(output.stats.originalSize),
			minifiedSizeKB: formatBytes(output.stats.minifiedSize)
		};
		
		return {
			minifiedText: output.styles,
			stats
		};
		
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		vscode.window.showErrorMessage(
			t('minificationService.error.generic', 'css', errorMessage)
		);
		return null;
	}
}
