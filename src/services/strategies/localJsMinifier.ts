/**
 * @fileoverview Local JavaScript minification strategy using oxc-minify.
 *
 * This module provides offline JavaScript minification without requiring network access.
 * It uses oxc-minify (written in Rust) for fast and modern JavaScript processing,
 * replacing the previous Toptal API dependency.
 *
 * @author Miguel Colmenares
 * @version 1.3.0
 * @since 1.3.0
 * @see {@link https://github.com/nicolo-ribaudo/oxc-minify} oxc-minify documentation
 */

/* global require, Buffer */

import * as vscode from 'vscode';
import { t } from '@/utils/l10nHelper';
import { MinificationResult, MinificationStats } from '@/types';
import { formatBytes } from '@/lib';

// oxc-minify is an ESM-only module, use require() since webpack externalizes it
// eslint-disable-next-line @typescript-eslint/no-require-imports
const oxcMinify = require('oxc-minify') as {
	minifySync: (
		filename: string,
		sourceText: string,
		options?: Record<string, unknown>
	) => { code: string; errors: Array<{ message: string }> };
};
const { minifySync } = oxcMinify;

/**
 * Minifies JavaScript code locally using the oxc-minify library.
 *
 * This function provides offline JavaScript minification without requiring network access.
 * oxc-minify is a Rust-based JavaScript minifier from the Oxc project (part of Voidzero ecosystem).
 *
 * Features include:
 * - Removing whitespace and comments
 * - Variable name mangling
 * - Dead code elimination
 * - Constant folding and propagation
 * - Statement joining and simplification
 * - No network dependency - works fully offline
 * - No rate limits or file size restrictions
 *
 * @function minifyJs
 * @param {string} text - The JavaScript source code to be minified
 * @returns {MinificationResult | null} The minified JavaScript with statistics, or null if minification failed
 *
 * @sideEffects
 * - Shows error messages to the user via VS Code notifications on failure
 *
 * @example
 * ```typescript
 * const jsCode = 'function hello() { var x = 1; console.log(x); }';
 * const result = minifyJs(jsCode);
 * // Result: { minifiedText: 'function hello(){console.log(1)}', stats: { ... } }
 * ```
 */
export function minifyJs(text: string): MinificationResult | null {
	try {
		const originalSize = Buffer.byteLength(text, 'utf8');

		const result = minifySync('input.js', text, {
			compress: {},
			mangle: {
				toplevel: false,
			},
			codegen: {
				removeWhitespace: true,
			},
		});

		// Check for errors returned by oxc-minify
		if (result.errors.length > 0) {
			const errorMessages = result.errors.map((e) => e.message).join('; ');
			vscode.window.showErrorMessage(t('minificationService.error.jsLocal', errorMessages));
			return null;
		}

		const minifiedText = result.code;
		const minifiedSize = Buffer.byteLength(minifiedText, 'utf8');

		const stats: MinificationStats = {
			originalSize,
			minifiedSize,
			reductionPercent: originalSize > 0 ? Math.round((1 - minifiedSize / originalSize) * 100) : 0,
			originalSizeKB: formatBytes(originalSize),
			minifiedSizeKB: formatBytes(minifiedSize),
		};

		return {
			minifiedText,
			stats,
		};
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		vscode.window.showErrorMessage(t('minificationService.error.jsLocal', errorMessage));
		return null;
	}
}
