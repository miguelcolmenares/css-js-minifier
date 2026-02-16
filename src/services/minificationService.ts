import * as vscode from "vscode";
import { setTimeout } from "timers";
import { t } from "../utils/l10nHelper";
import CleanCSS from "clean-css";

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

/**
 * Configuration for Toptal minification APIs.
 * @readonly
 */
const MINIFICATION_APIS = {
	css: {
		url: 'https://www.toptal.com/developers/cssminifier/api/raw',
		name: 'CSS Minifier'
	},
	javascript: {
		url: 'https://www.toptal.com/developers/javascript-minifier/api/raw',
		name: 'JavaScript Minifier'
	}
} as const;

/**
 * HTTP configuration for API requests.
 * Based on performance testing, Toptal APIs can take up to 1100ms to respond.
 * @readonly
 */
const REQUEST_CONFIG = {
	method: 'POST',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	}
} as const;

/**
 * Timeout duration for API requests in milliseconds.
 * Based on performance testing showing responses up to 1100ms.
 * @readonly
 */
const API_TIMEOUT_MS = 5000;

/**
 * Maximum file size allowed by Toptal APIs (5MB in bytes).
 * Files larger than this will be rejected with HTTP 413 error.
 * @readonly
 */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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
function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	const kb = bytes / 1024;
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
function calculateStats(originalText: string, minifiedText: string): MinificationStats {
	const textEncoder = new TextEncoder();
	const originalSize = textEncoder.encode(originalText).length;
	const minifiedSize = textEncoder.encode(minifiedText).length;
	
	const reductionPercent = originalSize > 0 
		? Math.round(((originalSize - minifiedSize) / originalSize) * 100)
		: 0;
	
	return {
		originalSize,
		minifiedSize,
		reductionPercent,
		originalSizeKB: formatBytes(originalSize),
		minifiedSizeKB: formatBytes(minifiedSize)
	};
}

/**
 * Configuration options for clean-css minification.
 * Level 2 provides aggressive optimizations while remaining safe.
 * @readonly
 * @since 1.2.0
 */
const CLEAN_CSS_OPTIONS: CleanCSS.OptionsOutput = {
	level: 2,
	returnPromise: false
};

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
 * @function minifyCSSLocal
 * @param {string} text - The CSS source code to be minified
 * @returns {MinificationResult | null} The minified CSS with statistics, or null if minification failed
 * 
 * @sideEffects
 * - Shows error messages to the user via VS Code notifications on failure
 * - Shows warning messages for any CSS issues detected
 * 
 * @example
 * ```typescript
 * const cssCode = 'body { color: red; margin: 0; }';
 * const result = minifyCSSLocal(cssCode);
 * // Result: { minifiedText: 'body{color:red;margin:0}', stats: { ... } }
 * ```
 * 
 * @see {@link https://github.com/clean-css/clean-css} clean-css documentation
 * @since 1.2.0
 */
function minifyCSSLocal(text: string): MinificationResult | null {
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
		
		// Show warnings if any (non-critical issues)
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
			t('minificationService.error.generic', 'CSS', errorMessage)
		);
		return null;
	}
}

/**
 * Minifies CSS or JavaScript code.
 * 
 * For CSS files, this function uses the local clean-css library for fast,
 * offline minification. For JavaScript files, it uses the Toptal minification API.
 * 
 * **CSS Minification (Local - clean-css):**
 * - No network required - works offline
 * - Level 2 optimizations for maximum compression
 * - Handles modern CSS features
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
 * - For JavaScript: Makes an HTTP POST request to external Toptal API with 5-second timeout
 * - Shows error messages to the user via VS Code notifications on failure
 * 
 * @example
 * ```typescript
 * // Minify CSS code (uses local clean-css)
 * const cssCode = 'body { color: red; margin: 0; }';
 * const result = await getMinifiedText(cssCode, 'css');
 * // Result: { minifiedText: 'body{color:red;margin:0}', stats: { ... } }
 * 
 * // Minify JavaScript code (uses Toptal API)
 * const jsCode = 'function hello() { console.log("Hello World"); }';
 * const result = await getMinifiedText(jsCode, 'javascript');
 * // Result: { minifiedText: 'function hello(){console.log("Hello World")}', stats: { ... } }
 * ```
 * 
 * @see {@link https://github.com/clean-css/clean-css} clean-css documentation
 * @see {@link https://www.toptal.com/developers/javascript-minifier} JavaScript Minifier API
 */
export async function getMinifiedText(text: string, fileType: string): Promise<MinificationResult | null> {
	// For CSS files, use local clean-css minification (no network required)
	if (fileType === 'css') {
		return minifyCSSLocal(text);
	}
	
	// For JavaScript files, use the Toptal API
	// Get the appropriate API configuration for the file type
	const apiConfig = MINIFICATION_APIS[fileType as keyof typeof MINIFICATION_APIS];
	
	if (!apiConfig) {
		vscode.window.showErrorMessage(t('minificationService.fileType.unsupported', fileType));
		return null;
	}

	// Validate file size before making API request
	const fileSizeBytes = new TextEncoder().encode(text).length;
	if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
		const sizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
		vscode.window.showErrorMessage(
			t('minificationService.fileSize.tooLarge', sizeMB)
		);
		return null;
	}

	try {
		// Prepare the request body with form-encoded data
		// Fix for Issue #1: Manual form encoding to handle + characters correctly
		// The API requires application/x-www-form-urlencoded, but URLSearchParams
		// converts spaces to + which conflicts with actual + characters in CSS/JS
		const manuallyEncoded = 'input=' + encodeURIComponent(text);
		
		// Create timeout promise that rejects after specified time
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => {
				reject(new Error(`${apiConfig.name} API request timed out after ${API_TIMEOUT_MS}ms`));
			}, API_TIMEOUT_MS);
		});
		
		// Race the fetch request against the timeout
		const response = await Promise.race([
			fetch(apiConfig.url, {
				...REQUEST_CONFIG,
				body: manuallyEncoded
			}),
			timeoutPromise
		]);

		// Handle different HTTP status codes with specific messages
		if (!response.ok) {
			let errorMessage = '';
			
			// Try to parse JSON error response first
			try {
				const errorData = await response.json() as { errors?: Array<{ detail?: string }> };
				if (errorData.errors && errorData.errors[0]?.detail) {
					errorMessage = errorData.errors[0].detail;
				}
			} catch {
				// Fall back to status-based messages if JSON parsing fails
				switch (response.status) {
					case 400:
						errorMessage = t('minificationService.error.missingInput');
						break;
					case 405:
						errorMessage = t('minificationService.error.invalidMethod');
						break;
					case 406:
						errorMessage = t('minificationService.error.invalidContentType');
						break;
					case 413:
						errorMessage = t('minificationService.error.fileTooLarge');
						break;
					case 422:
						errorMessage = t('minificationService.error.invalidSyntax', fileType);
						break;
					case 429:
						errorMessage = t('minificationService.error.rateLimitExceeded');
						break;
					default:
						errorMessage = t('minificationService.error.apiError', apiConfig.name, response.status.toString(), response.statusText);
				}
			}
			
			throw new Error(errorMessage);
		}

		// Extract and return the minified text
		const minifiedText = await response.text();
		
		// Basic validation of the response
		if (typeof minifiedText !== 'string') {
			throw new Error(t('minificationService.error.invalidResponse'));
		}
		
		// Calculate statistics
		const stats = calculateStats(text, minifiedText);
		
		return {
			minifiedText,
			stats
		};
		
	} catch (error: unknown) {
		// Handle and report errors with detailed context
		const errorMessage = error instanceof Error ? error.message : String(error);
		
		// Provide specific user-friendly messages based on error type
		let userMessage: string;
		
		if (errorMessage.includes('timed out after')) {
			// Timeout-specific message with helpful information
			userMessage = t('minificationService.error.timeout', apiConfig?.name || fileType);
		} else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
			// Network connectivity issues
			userMessage = t('minificationService.error.network');
		} else {
			// General error message
			userMessage = t('minificationService.error.generic', fileType, errorMessage);
		}
		
		// Show user-friendly error message
		vscode.window.showErrorMessage(userMessage);
		
		return null;
	}
}