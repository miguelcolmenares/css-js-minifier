import * as vscode from "vscode";

/**
 * Supported file types for minification.
 * @readonly
 * @enum {string}
 */
const SUPPORTED_FILE_TYPES = {
	CSS: 'css',
	JAVASCRIPT: 'javascript'
} as const;

/**
 * Validates if the provided file type is supported for minification.
 * 
 * This function checks if the file type is either CSS or JavaScript,
 * which are the only file types supported by the Toptal minification APIs.
 * 
 * @function isValidFileType
 * @param {string} fileType - The VS Code language identifier (e.g., 'css', 'javascript')
 * @returns {boolean} True if the file type is supported (css or javascript), false otherwise
 * 
 * @example
 * ```typescript
 * isValidFileType('css');        // returns true
 * isValidFileType('javascript'); // returns true
 * isValidFileType('html');       // returns false
 * isValidFileType('python');     // returns false
 * ```
 */
export function isValidFileType(fileType: string): boolean {
	return fileType === SUPPORTED_FILE_TYPES.CSS || fileType === SUPPORTED_FILE_TYPES.JAVASCRIPT;
}

/**
 * Validates the file type and displays user feedback for invalid types.
 * 
 * This function performs validation using isValidFileType() and provides
 * user-friendly error messages when the file type is not supported.
 * It's designed to be used in command handlers where user feedback is required.
 * 
 * @function validateFileType
 * @param {string} fileType - The VS Code language identifier to validate
 * @returns {boolean} True if validation passes, false if validation fails
 * 
 * @sideEffects
 * - Shows an error message to the user via VS Code's notification system
 *   when the file type is not supported
 * 
 * @example
 * ```typescript
 * // In a command handler
 * const document = vscode.window.activeTextEditor?.document;
 * if (document && validateFileType(document.languageId)) {
 *   // Proceed with minification
 * }
 * ```
 */
export function validateFileType(fileType: string): boolean {
	if (!isValidFileType(fileType)) {
		// Show user-friendly error message with supported file types
		vscode.window.showErrorMessage(
			`File type '${fileType}' is not supported. Only CSS and JavaScript files can be minified.`
		);
		return false;
	}
	return true;
}

/**
 * Validates that the file content is not empty and displays appropriate user feedback.
 * 
 * This function ensures that there is actual content to minify before making API calls.
 * Empty files would result in unnecessary API requests and should be handled gracefully.
 * 
 * @function validateContentLength
 * @param {string} text - The complete text content of the file to validate
 * @param {string} fileType - The file type identifier (used for contextual error messages)
 * @returns {boolean} True if the file has content (length > 0), false if empty
 * 
 * @sideEffects
 * - Shows an informative error message to the user when the file is empty
 * 
 * @example
 * ```typescript
 * const document = vscode.window.activeTextEditor?.document;
 * if (document) {
 *   const text = document.getText();
 *   if (validateContentLength(text, document.languageId)) {
 *     // File has content, proceed with minification
 *   }
 * }
 * ```
 */
export function validateContentLength(text: string, fileType: string): boolean {
	// Check for empty content (whitespace-only content is still considered valid)
	if (text.length === 0) {
		// Provide contextual error message based on file type
		vscode.window.showErrorMessage(
			`Cannot minify empty ${fileType} file. Please add some content first.`
		);
		return false;
	}
	return true;
}