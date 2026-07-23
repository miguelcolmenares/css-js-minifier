/**
 * @packageDocumentation
 * Minification-related type definitions.
 *
 * This module contains interfaces and types used across all minification
 * strategies and services.
 *
 * @author Miguel Colmenares
 * @since 1.2.0
 */

/**
 * Statistics about the minification process.
 */
export interface MinificationStats {
	/** Original file size in bytes */
	originalSize: number;
	/** Minified file size in bytes */
	minifiedSize: number;
	/** Percentage of size reduction (0-100) */
	reductionPercent: number;
	/** Formatted original size (e.g., "1.21 KB") */
	originalSizeKB: string;
	/** Formatted minified size (e.g., "0.66 KB") */
	minifiedSizeKB: string;
}

/**
 * Result of minification with statistics.
 */
export interface MinificationResult {
	/** The minified code */
	minifiedText: string;
	/** Statistics about the minification */
	stats: MinificationStats;
}
