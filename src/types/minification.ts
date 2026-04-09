/**
 * @fileoverview Minification-related type definitions.
 *
 * This module contains interfaces and types used across all minification
 * strategies and services.
 *
 * @author Miguel Colmenares
 * @version 1.3.0
 * @since 1.2.0
 */

/**
 * Statistics about the minification process.
 *
 * @interface MinificationStats
 * @property {number} originalSize - Original file size in bytes
 * @property {number} minifiedSize - Minified file size in bytes
 * @property {number} reductionPercent - Percentage of size reduction (0-100)
 * @property {string} originalSizeKB - Formatted original size (e.g., "1.21 KB")
 * @property {string} minifiedSizeKB - Formatted minified size (e.g., "0.66 KB")
 */
export interface MinificationStats {
	originalSize: number;
	minifiedSize: number;
	reductionPercent: number;
	originalSizeKB: string;
	minifiedSizeKB: string;
}

/**
 * Result of minification with statistics.
 *
 * @interface MinificationResult
 * @property {string} minifiedText - The minified code
 * @property {MinificationStats} stats - Statistics about the minification
 */
export interface MinificationResult {
	minifiedText: string;
	stats: MinificationStats;
}
