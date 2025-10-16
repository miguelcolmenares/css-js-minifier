import * as vscode from "vscode";
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
 * Minifies CSS or JavaScript code using the Toptal minification APIs.
 * 
 * This function sends the provided code to Toptal's free minification service
 * and returns the minified result. It handles both CSS and JavaScript files
 * by selecting the appropriate API endpoint based on the file type.
 * 
 * Performance testing shows API response times can vary from 200ms to 1100ms,
 * so a 5-second timeout is implemented to handle network variations gracefully.
 * 
 * @async
 * @function getMinifiedText
 * @param {string} text - The source code to be minified (CSS or JavaScript)
 * @param {string} fileType - The file type identifier ('css' or 'javascript')
 * @returns {Promise<string | null>} The minified code as a string, or null if minification failed
 * 
  * @throws {Error} When the API request fails, times out, or returns an invalid response
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
		vscode.window.showErrorMessage(`Unsupported file type for minification: ${fileType}`);
		return null;
	}

	try {
		// Prepare the request body with form-encoded data
		const requestBody = new URLSearchParams({ input: text });
		
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
				body: requestBody
			}),
			timeoutPromise
		]);

		// Validate the HTTP response status
		if (!response.ok) {
			throw new Error(
				`${apiConfig.name} API request failed with status ${response.status}: ${response.statusText}`
			);
		}

		// Extract and return the minified text
		const minifiedText = await response.text();
		
		// Basic validation of the response
		if (typeof minifiedText !== 'string') {
			throw new Error('Invalid response format from minification API');
		}
		
		return minifiedText;
		
	} catch (error: unknown) {
		// Handle and report errors with detailed context
		const errorMessage = error instanceof Error ? error.message : String(error);
		
		// Provide specific user-friendly messages based on error type
		let userMessage: string;
		
		if (errorMessage.includes('timed out after')) {
			// Timeout-specific message with helpful information
			userMessage = `Minification timeout: The ${apiConfig?.name || fileType} service is taking longer than expected. Please check your internet connection and try again.`;
		} else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
			// Network connectivity issues
			userMessage = `Network error: Unable to connect to the minification service. Please check your internet connection and try again.`;
		} else {
			// General error message
			userMessage = `Failed to minify ${fileType} file: ${errorMessage}`;
		}
		
		// Show user-friendly error message
		vscode.window.showErrorMessage(userMessage);
		
		return null;
	}
}