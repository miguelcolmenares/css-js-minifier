import * as vscode from "vscode";

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
 * @readonly
 */
const REQUEST_CONFIG = {
	method: 'POST',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	},
	// Timeout could be added here in the future
} as const;

/**
 * Minifies CSS or JavaScript code using the Toptal minification APIs.
 * 
 * This function sends the provided code to Toptal's free minification service
 * and returns the minified result. It handles both CSS and JavaScript files
 * by selecting the appropriate API endpoint based on the file type.
 * 
 * @async
 * @function getMinifiedText
 * @param {string} text - The source code to be minified (CSS or JavaScript)
 * @param {string} fileType - The file type identifier ('css' or 'javascript')
 * @returns {Promise<string | null>} The minified code as a string, or null if minification failed
 * 
 * @throws {Error} When the API request fails or returns an invalid response
 * 
 * @sideEffects
 * - Makes an HTTP POST request to external Toptal API
 * - Shows error messages to the user via VS Code notifications on failure
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
		
		// Make the API request to Toptal's minification service
		const response = await fetch(apiConfig.url, {
			...REQUEST_CONFIG,
			body: requestBody
		});

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
		const userMessage = `Failed to minify ${fileType} file: ${errorMessage}`;
		
		// Show user-friendly error message
		vscode.window.showErrorMessage(userMessage);
		
		return null;
	}
}