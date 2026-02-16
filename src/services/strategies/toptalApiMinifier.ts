/**
 * @fileoverview Remote JavaScript minification strategy using Toptal API.
 * 
 * This module provides JavaScript minification via the Toptal minification API.
 * It handles HTTP requests, timeouts, error handling, and rate limiting.
 * 
 * @author Miguel Colmenares
 * @version 1.2.0
 * @since 0.1.0
 * @see {@link https://www.toptal.com/developers/javascript-minifier} JavaScript Minifier API
 */

/* global AbortController, Response, setTimeout, clearTimeout */

import * as vscode from "vscode";
import { t } from "../../utils/l10nHelper";
import { MinificationResult } from "../../types";
import { 
	TOPTAL_JS_API, 
	HTTP_REQUEST_CONFIG, 
	API_TIMEOUT_MS, 
	MAX_FILE_SIZE_BYTES,
	calculateStats 
} from "../../lib";

/**
 * Minifies JavaScript code using the Toptal minification API.
 * 
 * This function makes an HTTP POST request to the Toptal JavaScript minifier API.
 * It includes proper error handling for network issues, timeouts, and API errors.
 * 
 * **Limitations:**
 * - Maximum file size: 5MB per request
 * - Rate limit: 30 requests per minute
 * - Network required: Cannot work offline
 * 
 * @async
 * @function minifyJavaScript
 * @param {string} text - The JavaScript source code to be minified
 * @returns {Promise<MinificationResult | null>} The minified JS with statistics, or null if minification failed
 * 
 * @sideEffects
 * - Makes an HTTP POST request to external Toptal API with 5-second timeout
 * - Shows error messages to the user via VS Code notifications on failure
 * 
 * @example
 * ```typescript
 * const jsCode = 'function hello() { console.log("Hello World"); }';
 * const result = await minifyJavaScript(jsCode);
 * // Result: { minifiedText: 'function hello(){console.log("Hello World")}', stats: { ... } }
 * ```
 */
export async function minifyJavaScript(text: string): Promise<MinificationResult | null> {
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
		// converts spaces to + which conflicts with actual + characters in JS
		const manuallyEncoded = 'input=' + encodeURIComponent(text);
		
		// Use AbortController for proper timeout cleanup
		// This ensures the timeout is cancelled when fetch completes first
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
		
		let response: Response;
		try {
			response = await fetch(TOPTAL_JS_API.url, {
				...HTTP_REQUEST_CONFIG,
				body: manuallyEncoded,
				signal: controller.signal
			});
		} finally {
			// Always clear the timeout to prevent memory leaks
			clearTimeout(timeoutId);
		}

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
						errorMessage = t('minificationService.error.invalidSyntax', 'javascript');
						break;
					case 429:
						errorMessage = t('minificationService.error.rateLimitExceeded');
						break;
					default:
						errorMessage = t('minificationService.error.apiError', TOPTAL_JS_API.name, response.status.toString(), response.statusText);
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
		const errorName = error instanceof Error ? error.name : '';
		
		// Provide specific user-friendly messages based on error type
		let userMessage: string;
		
		if (errorName === 'AbortError' || errorMessage.includes('aborted')) {
			// Timeout via AbortController
			userMessage = t('minificationService.error.timeout', TOPTAL_JS_API.name);
		} else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
			// Network connectivity issues
			userMessage = t('minificationService.error.network');
		} else {
			// General error message
			userMessage = t('minificationService.error.generic', 'javascript', errorMessage);
		}
		
		// Show user-friendly error message
		vscode.window.showErrorMessage(userMessage);
		
		return null;
	}
}
