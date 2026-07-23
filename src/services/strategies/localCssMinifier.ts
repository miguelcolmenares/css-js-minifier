/**
 * @packageDocumentation
 * Local CSS minification strategy using LightningCSS.
 *
 * This module provides offline CSS minification without requiring network access.
 * It uses LightningCSS (written in Rust) for extremely fast and modern CSS processing.
 *
 * @author Miguel Colmenares
 * @since 1.2.0
 * @see {@link https://lightningcss.dev/} LightningCSS documentation
 */

import * as vscode from 'vscode';
import { Buffer } from 'node:buffer';
import { transform } from 'lightningcss';
import { t } from '@/utils/l10nHelper';
import { MinificationResult, MinificationStats } from '@/types';
import { formatBytes } from '@/lib';

/**
 * Minifies CSS code locally using the LightningCSS library.
 *
 * This function provides offline CSS minification without requiring network access.
 * LightningCSS is an extremely fast CSS parser, transformer, and minifier written in Rust.
 *
 * Features include:
 * - Removing whitespace and comments
 * - Merging adjacent rules with same selectors
 * - Combining longhand properties into shorthands
 * - Removing duplicate rules
 * - Optimizing colors, fonts, and other values
 * - Full support for modern CSS features (`@starting-style`, CSS Nesting, etc.)
 * - ~60x faster than JavaScript-based minifiers
 *
 * @remarks
 * Shows error messages to the user via VS Code notifications on failure.
 *
 * @param text - The CSS source code to be minified
 * @returns The minified CSS with statistics, or null if minification failed
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
		const originalSize = Buffer.byteLength(text, 'utf8');

		const output = transform({
			filename: 'style.css',
			code: Buffer.from(text),
			minify: true,
		});

		const minifiedCode = Buffer.from(output.code);
		const minifiedText = minifiedCode.toString('utf8');
		const minifiedSize = minifiedCode.length;

		// Calculate statistics
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
		vscode.window.showErrorMessage(t('CSS minification error: {0}', errorMessage));
		return null;
	}
}
