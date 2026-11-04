/**
 * @packageDocumentation
 * File service module providing file system operations for the minification workflow.
 *
 * This module handles all file-related operations including saving minified content
 * to new files, replacing document content in-place, and generating minified filenames.
 *
 * @author Miguel Colmenares
 * @since 0.1.0
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { MinificationStats } from './minificationService';
import { t } from '../utils/l10nHelper';

/**
 * Saves minified content to a new file and opens it in the editor.
 *
 * This function creates a new file with the minified content, writes it to disk,
 * and automatically opens it in the VS Code editor. It provides user feedback
 * about the successful operation.
 *
 * @remarks
 * - Creates a new file on the file system
 * - Opens the new file in VS Code editor
 * - Shows success notification to the user
 * - Never writes over the source: when the new file resolves to the same URI as
 *   `sourceUri` (scheme, authority and path all equal), it shows an error and returns
 *   without writing anything (issue #255)
 *
 * @param minifiedText - The minified content to save
 * @param newFileName - The complete file path for the new file (including extension)
 * @param stats - Statistics about the minification process
 * @param sourceUri - The URI of the document being minified, used to refuse to overwrite it
 * @returns Resolves when the file is successfully created and opened, or when the write was refused
 *
 * @throws When file system operations fail (e.g., permissions, disk space)
 *
 * @example
 * ```typescript
 * const minifiedCSS = 'body{margin:0;color:red}';
 * const newPath = '/path/to/style.min.css';
 * const stats = { originalSize: 100, minifiedSize: 50, reductionPercent: 50, ... };
 * await saveAsNewFile(minifiedCSS, newPath, stats, document.uri);
 * // File is created, opened in editor, and user sees success message with statistics
 * ```
 */
export async function saveAsNewFile(
	minifiedText: string,
	newFileName: string,
	stats: MinificationStats,
	sourceUri: vscode.Uri
): Promise<void> {
	// Create a VS Code URI for the new file path
	const uri = vscode.Uri.file(newFileName);

	// Data-loss guard: never write the minified text over the source file. The full URI
	// (scheme, authority, path, query) is compared, not just the path string.
	if (uri.toString() === sourceUri.toString()) {
		vscode.window.showErrorMessage(
			t(
				'Cannot create the minified file: its name would be the same as the original ({0}) and would overwrite it. The original file was not changed.',
				path.basename(newFileName)
			)
		);
		return;
	}

	// Encode the text content as UTF-8 bytes for file writing
	const textEncoder = new TextEncoder();
	const encodedContent = textEncoder.encode(minifiedText);

	// Write the minified content to the file system
	await vscode.workspace.fs.writeFile(uri, encodedContent);

	// Check if the new file should be opened automatically
	const settings = vscode.workspace.getConfiguration('css-js-minifier');
	const autoOpenNewFile = settings.get('autoOpenNewFile') as boolean;

	if (autoOpenNewFile) {
		// Open the newly created file in the VS Code editor
		await vscode.window.showTextDocument(uri);
	}

	// Provide user feedback about the successful operation with statistics
	const fileName = path.basename(newFileName);
	const config = vscode.workspace.getConfiguration('css-js-minifier');
	const showSizeReduction = config.get('showSizeReduction', true);

	if (showSizeReduction) {
		vscode.window.showInformationMessage(
			t(
				'File successfully minified and saved as: {0} (Size reduced from {1} to {2}, {3}% reduction)',
				fileName,
				stats.originalSizeKB,
				stats.minifiedSizeKB,
				stats.reductionPercent.toString()
			)
		);
	} else {
		vscode.window.showInformationMessage(t('File successfully minified and saved as: {0}', fileName));
	}
}

/**
 * Replaces the content of an existing document with minified text.
 *
 * This function performs an in-place replacement of the entire document content
 * with the minified version. It uses VS Code's WorkspaceEdit API to ensure
 * the operation is atomic and can be undone by the user.
 *
 * @remarks
 * - Modifies the content of the existing document
 * - Saves the document to disk (unless skipSave is true)
 * - Shows success notification to the user (unless suppressed)
 * - Adds an entry to VS Code's undo history
 *
 * @param document - The VS Code document to modify
 * @param minifiedText - The minified content to replace the original with
 * @param stats - Statistics about the minification process
 * @param showNotification - Whether to show success notification (default: true)
 * @param skipSave - Whether to skip saving the document (default: false)
 * @returns Resolves when the document is updated and optionally saved
 *
 * @throws When the workspace edit fails or the document cannot be saved
 *
 * @example
 * ```typescript
 * const activeEditor = vscode.window.activeTextEditor;
 * if (activeEditor) {
 *   const minifiedContent = 'body{margin:0}';
 *   const stats = { originalSize: 100, minifiedSize: 50, reductionPercent: 50, ... };
 *   await replaceDocumentContent(activeEditor.document, minifiedContent, stats);
 *   // Document content is replaced and saved, message shows statistics
 *
 *   // Suppress notification when called from auto-save
 *   await replaceDocumentContent(activeEditor.document, minifiedContent, stats, false);
 *
 *   // Skip save to prevent double writes
 *   await replaceDocumentContent(activeEditor.document, minifiedContent, stats, true, true);
 * }
 * ```
 */
export async function replaceDocumentContent(
	document: vscode.TextDocument,
	minifiedText: string,
	stats: MinificationStats,
	showNotification: boolean = true,
	skipSave: boolean = false
): Promise<void> {
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

	// Save the document to persist changes to disk (unless caller will handle it)
	if (!skipSave) {
		await document.save();
	}

	// Provide user feedback about the successful minification with statistics (if not suppressed)
	if (showNotification) {
		const fileName = path.basename(document.fileName);
		const config = vscode.workspace.getConfiguration('css-js-minifier');
		const showSizeReduction = config.get('showSizeReduction', true);

		if (showSizeReduction) {
			vscode.window.showInformationMessage(
				t(
					'{0} has been successfully minified (Size reduced from {1} to {2}, {3}% reduction)',
					fileName,
					stats.originalSizeKB,
					stats.minifiedSizeKB,
					stats.reductionPercent.toString()
				)
			);
		} else {
			vscode.window.showInformationMessage(t('{0} has been successfully minified.', fileName));
		}
	}
}

/**
 * Creates a new filename by adding a minification prefix before the file extension.
 *
 * This utility function generates appropriate filenames for minified files by
 * inserting a user-configurable prefix (like '.min' or '-compressed') before
 * the last extension of the file name. It works for any extension, in any letter
 * case, so `.mjs`, `.cjs`, `.JS` and `.CSS` get a new name just like `.css` and `.js`.
 *
 * @remarks
 * - Only the last path segment is inspected, and both `/` and `\` count as separators,
 *   so a dot in a folder name (`/a.d/Makefile`) is never taken for an extension.
 * - The extension keeps its original case (`A.CSS` becomes `A.min.CSS`).
 * - A name with no extension, or only a leading dot (`Makefile`, `.eslintrc`), has the
 *   prefix appended at the end (`Makefile.min`, `.eslintrc.min`).
 * - A name that already contains the prefix is not special-cased: `a.min.js` becomes
 *   `a.min.min.js`, which never equals the original.
 * - For any non-empty prefix the result differs from the input. `saveAsNewFile` still
 *   checks it, so an empty prefix cannot overwrite the source.
 *
 * @param originalFileName - The complete path to the original file
 * @param prefix - The prefix to insert before the extension (e.g., '.min', '-compressed')
 * @returns The new filename with the prefix inserted before the extension
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
 * // Works with any extension, in any case
 * createMinifiedFileName('/path/to/module.mjs', '.min');
 * // Returns: '/path/to/module.min.mjs'
 *
 * // Works with Windows paths
 * createMinifiedFileName('C:\\projects\\app.css', '.minified');
 * // Returns: 'C:\\projects\\app.minified.css'
 *
 * // No extension: the prefix goes at the end
 * createMinifiedFileName('/path/to/Makefile', '.min');
 * // Returns: '/path/to/Makefile.min'
 * ```
 */
export function createMinifiedFileName(originalFileName: string, prefix: string): string {
	// Split the directory part (kept as is) from the last path segment (the file name)
	const nameStart = Math.max(originalFileName.lastIndexOf('/'), originalFileName.lastIndexOf('\\')) + 1;
	const directory = originalFileName.slice(0, nameStart);
	const baseName = originalFileName.slice(nameStart);

	// The extension starts at the last dot of the file name. A dot at index 0 is a hidden
	// file marker (".eslintrc"), not an extension, so it is treated like "no extension".
	const extensionStart = baseName.lastIndexOf('.');
	if (extensionStart <= 0) {
		return `${directory}${baseName}${prefix}`;
	}

	return `${directory}${baseName.slice(0, extensionStart)}${prefix}${baseName.slice(extensionStart)}`;
}

/**
 * Saves a document explicitly without showing user notifications.
 * Used when we need to save a document after modifications but want to avoid
 * triggering additional save events or showing duplicate notifications.
 *
 * @param document - The document to save
 * @returns Resolves when the document is saved
 */
export async function saveDocumentSilently(document: vscode.TextDocument): Promise<void> {
	await document.save();
}
