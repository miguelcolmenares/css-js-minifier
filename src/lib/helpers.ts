/**
 * @fileoverview Utility helper functions.
 *
 * This module provides reusable helper functions used across the extension.
 * Following Single Responsibility Principle, each function handles one
 * specific task.
 *
 * @author Miguel Colmenares
 * @version 1.3.0
 * @since 1.2.0
 */

import { MinificationStats } from '@/types';
import { BYTES_PER_KB } from './constants';

/**
 * Formats bytes to human-readable string with KB or B units.
 *
 * @function formatBytes
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "1.21 KB" or "512 B")
 *
 * @example
 * formatBytes(1234) // Returns: "1.21 KB"
 * formatBytes(512)  // Returns: "512 B"
 */
export function formatBytes(bytes: number): string {
	if (bytes < BYTES_PER_KB) {
		return `${bytes} B`;
	}
	const kb = bytes / BYTES_PER_KB;
	return `${kb.toFixed(2)} KB`;
}

/**
 * Calculates minification statistics comparing original and minified text.
 *
 * @function calculateStats
 * @param {string} originalText - The original source code
 * @param {string} minifiedText - The minified code
 * @returns {MinificationStats} Statistics object with size and reduction data
 *
 * @example
 * const stats = calculateStats("body { color: red; }", "body{color:red}");
 * // Returns: { originalSize: 22, minifiedSize: 15, reductionPercent: 32, ... }
 */
export function calculateStats(originalText: string, minifiedText: string): MinificationStats {
	const textEncoder = new TextEncoder();
	const originalSize = textEncoder.encode(originalText).length;
	const minifiedSize = textEncoder.encode(minifiedText).length;

	const reductionPercent = originalSize > 0 ? Math.round(((originalSize - minifiedSize) / originalSize) * 100) : 0;

	return {
		originalSize,
		minifiedSize,
		reductionPercent,
		originalSizeKB: formatBytes(originalSize),
		minifiedSizeKB: formatBytes(minifiedSize),
	};
}
