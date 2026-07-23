/**
 * @packageDocumentation
 * Utility helper functions.
 *
 * This module provides reusable helper functions used across the extension.
 * Following Single Responsibility Principle, each function handles one
 * specific task.
 *
 * @author Miguel Colmenares
 * @since 1.2.0
 */

import { MinificationStats } from '@/types';
import { BYTES_PER_KB } from './constants';

/**
 * Formats bytes to human-readable string with KB or B units.
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.21 KB" or "512 B")
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
 * @param originalText - The original source code
 * @param minifiedText - The minified code
 * @returns Statistics object with size and reduction data
 *
 * @example
 * ```typescript
 * const stats = calculateStats("body { color: red; }", "body{color:red}");
 * // Returns: { originalSize: 22, minifiedSize: 15, reductionPercent: 32, ... }
 * ```
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
