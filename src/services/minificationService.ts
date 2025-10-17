import * as vscode from "vscode";
import * as l10n from "@vscode/l10n";
import { setTimeout } from "timers";

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
 * Minifies CSS or JavaScript code using the Toptal minification APIs.
 * 
 * This function sends the provided code to Toptal's free minification service
 * and returns the minified result. It handles both CSS and JavaScript files
 * by selecting the appropriate API endpoint based on the file type.
 * 
 * Performance testing shows API response times can vary from 200ms to 1100ms,
 * so a 5-second timeout is implemented to handle network variations gracefully.
 * 
 * **API Limitations:**
 * - Maximum file size: 5MB per request
 * - Rate limit: 30 requests per minute
 * - Content type: application/x-www-form-urlencoded only
 * - HTTP method: POST only
 * 
 * @async
 * @function getMinifiedText
 * @param {string} text - The source code to be minified (CSS or JavaScript)
 * @param {string} fileType - The file type identifier ('css' or 'javascript')
 * @returns {Promise<string | null>} The minified code as a string, or null if minification failed
 * 
  * @throws {Error} API request fails, times out, or returns an invalid response
 * 
 * @sideEffects
 * - Makes an HTTP POST request to external Toptal API with 5-second timeout
 * - Shows error messages to the user via VS Code notifications on failure
 * - Timeout errors show specific guidance about connectivity issues
 * 
 * @example
 * ```typescript
 * // Minify CSS code
 * const cssCode = 'body { color: red; margin: 0; }';
 * const minifiedCSS = await getMinifiedText(cssCode, 'css');
 * // Result: 'body{color:red;margin:0}'
 * 
 * // Minify JavaScript code
 * const jsCode = 'function hello() { console.log("Hello World"); }';
 * const minifiedJS = await getMinifiedText(jsCode, 'javascript');
 * // Result: 'function hello(){console.log("Hello World")}'
 * ```
 * 
 * @performance
 * - Typical response time: 200-1100ms based on performance testing
 * - Timeout configured: 5000ms to handle network variations
 * - Large files may take longer to process
 * 
 * @see {@link https://www.toptal.com/developers/cssminifier} CSS Minifier API
 * @see {@link https://www.toptal.com/developers/javascript-minifier} JavaScript Minifier API
 */
export async function getMinifiedText(text: string, fileType: string): Promise<string | null> {
	// Get the appropriate API configuration for the file type
	const apiConfig = MINIFICATION_APIS[fileType as keyof typeof MINIFICATION_APIS];
	
	if (!apiConfig) {
		vscode.window.showErrorMessage(l10n.t('minificationService.fileType.unsupported', fileType));
		return null;
	}

	// Validate file size before making API request
	const fileSizeBytes = new TextEncoder().encode(text).length;
	if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
		const sizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
		vscode.window.showErrorMessage(
			l10n.t('minificationService.fileSize.tooLarge', sizeMB)
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
						errorMessage = l10n.t('minificationService.error.missingInput');
						break;
					case 405:
						errorMessage = l10n.t('minificationService.error.invalidMethod');
						break;
					case 406:
						errorMessage = l10n.t('minificationService.error.invalidContentType');
						break;
					case 413:
						errorMessage = l10n.t('minificationService.error.fileTooLarge');
						break;
					case 422:
						errorMessage = l10n.t('minificationService.error.invalidSyntax', fileType);
						break;
					case 429:
						errorMessage = l10n.t('minificationService.error.rateLimitExceeded');
						break;
					default:
						errorMessage = l10n.t('minificationService.error.apiError', apiConfig.name, response.status.toString(), response.statusText);
				}
			}
			
			throw new Error(errorMessage);
		}

		// Extract and return the minified text
		const minifiedText = await response.text();
		
		// Basic validation of the response
		if (typeof minifiedText !== 'string') {
			throw new Error(l10n.t('minificationService.error.invalidResponse'));
		}
		
		return minifiedText;
		
	} catch (error: unknown) {
		// Handle and report errors with detailed context
		const errorMessage = error instanceof Error ? error.message : String(error);
		
		// Provide specific user-friendly messages based on error type
		let userMessage: string;
		
		if (errorMessage.includes('timed out after')) {
			// Timeout-specific message with helpful information
			userMessage = l10n.t('minificationService.error.timeout', apiConfig?.name || fileType);
		} else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
			// Network connectivity issues
			userMessage = l10n.t('minificationService.error.network');
		} else {
			// General error message
			userMessage = l10n.t('minificationService.error.generic', fileType, errorMessage);
		}
		
		// Show user-friendly error message
		vscode.window.showErrorMessage(userMessage);
		
		return null;
	}
}