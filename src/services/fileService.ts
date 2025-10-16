import * as vscode from "vscode";

/**
 * Saves minified content to a new file and opens it in the editor.
 * 
 * This function creates a new file with the minified content, writes it to disk,
 * and automatically opens it in the VS Code editor. It provides user feedback
 * about the successful operation.
 * 
 * @async
 * @function saveAsNewFile
 * @param {string} minifiedText - The minified content to save
 * @param {string} newFileName - The complete file path for the new file (including extension)
 * @returns {Promise<void>} Resolves when the file is successfully created and opened
 * 
 * @throws {Error} When file system operations fail (e.g., permissions, disk space)
 * 
 * @sideEffects
 * - Creates a new file on the file system
 * - Opens the new file in VS Code editor
 * - Shows success notification to the user
 * 
 * @example
 * ```typescript
 * const minifiedCSS = 'body{margin:0;color:red}';
 * const newPath = '/path/to/style.min.css';
 * await saveAsNewFile(minifiedCSS, newPath);
 * // File is created, opened in editor, and user sees success message
 * ```
 */
export async function saveAsNewFile(minifiedText: string, newFileName: string): Promise<void> {
	// Create a VS Code URI for the new file path
	const uri = vscode.Uri.file(newFileName);
	
	// Encode the text content as UTF-8 bytes for file writing
	const textEncoder = new TextEncoder();
	const encodedContent = textEncoder.encode(minifiedText);
	
	// Write the minified content to the file system
	await vscode.workspace.fs.writeFile(uri, encodedContent);
	
	// Check if the new file should be opened automatically
	const settings = vscode.workspace.getConfiguration("css-js-minifier");
	const autoOpenNewFile = settings.get("autoOpenNewFile") as boolean;
	
	if (autoOpenNewFile) {
		// Open the newly created file in the VS Code editor
		await vscode.window.showTextDocument(uri);
	}
	
	// Provide user feedback about the successful operation
	vscode.window.showInformationMessage(
		`File successfully minified and saved as: ${newFileName.split('/').pop()}`
	);
}

/**
 * Replaces the content of an existing document with minified text.
 * 
 * This function performs an in-place replacement of the entire document content
 * with the minified version. It uses VS Code's WorkspaceEdit API to ensure
 * the operation is atomic and can be undone by the user.
 * 
 * @async
 * @function replaceDocumentContent
 * @param {vscode.TextDocument} document - The VS Code document to modify
 * @param {string} minifiedText - The minified content to replace the original with
 * @returns {Promise<void>} Resolves when the document is updated and saved
 * 
 * @throws {Error} When the workspace edit fails or the document cannot be saved
 * 
 * @sideEffects
 * - Modifies the content of the existing document
 * - Saves the document to disk
 * - Shows success notification to the user
 * - Adds an entry to VS Code's undo history
 * 
 * @example
 * ```typescript
 * const activeEditor = vscode.window.activeTextEditor;
 * if (activeEditor) {
 *   const minifiedContent = 'body{margin:0}';
 *   await replaceDocumentContent(activeEditor.document, minifiedContent);
 *   // Document content is replaced and saved
 * }
 * ```
 */
export async function replaceDocumentContent(document: vscode.TextDocument, minifiedText: string): Promise<void> {
	// Create a workspace edit to modify the document
	const edit = new vscode.WorkspaceEdit();
	
	// Define the range that covers the entire document content
	const firstLine = document.lineAt(0);
	const lastLine = document.lineAt(document.lineCount - 1);
	const fullDocumentRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
	
	// Replace the entire document content with the minified text
	edit.replace(document.uri, fullDocumentRange, minifiedText);
	
	// Apply the edit to the workspace (this operation can be undone)
	await vscode.workspace.applyEdit(edit);
	
	// Save the document to persist changes to disk
	await document.save();
	
	// Provide user feedback about the successful minification
	const fileName = document.fileName.split('/').pop() || 'file';
	vscode.window.showInformationMessage(`${fileName} has been successfully minified.`);
}

/**
 * Creates a new filename by adding a minification prefix before the file extension.
 * 
 * This utility function generates appropriate filenames for minified files by
 * inserting a user-configurable prefix (like '.min' or '-compressed') before
 * the file extension. It only works with supported file extensions (.css, .js).
 * 
 * @function createMinifiedFileName
 * @param {string} originalFileName - The complete path to the original file
 * @param {string} prefix - The prefix to insert before the extension (e.g., '.min', '-compressed')
 * @returns {string} The new filename with the prefix inserted before the extension
 * 
 * @example
 * ```typescript
 * // Using .min prefix
 * createMinifiedFileName('/path/to/style.css', '.min');
 * // Returns: '/path/to/style.min.css'
 * 
 * // Using -compressed prefix
 * createMinifiedFileName('/path/to/script.js', '-compressed');
 * // Returns: '/path/to/script-compressed.js'
 * 
 * // Works with absolute paths
 * createMinifiedFileName('C:\\projects\\app.css', '.minified');
 * // Returns: 'C:\\projects\\app.minified.css'
 * ```
 */
export function createMinifiedFileName(originalFileName: string, prefix: string): string {
	// Use regex to insert the prefix before the file extension
	// Matches .css or .js at the end of the filename and replaces with prefix + extension
	return originalFileName.replace(/(\.css|\.js)$/, `${prefix}$1`);
}