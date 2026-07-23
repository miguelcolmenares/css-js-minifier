/**
 * @packageDocumentation
 * File service module providing file system operations for the minification workflow.
 *
 * This module handles all file-related operations including saving minified content
 * to new files, replacing document content in-place, and generating minified filenames.
 *
 * @author Miguel Colmenares
 * @version 1.3.0
 * @since 0.1.0
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { MinificationStats } from './minificationService';
import { t } from '@/utils/l10nHelper';

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
 *
 * @param minifiedText - The minified content to save
 * @param newFileName - The complete file path for the new file (including extension)
 * @param stats - Statistics about the minification process
 * @returns Resolves when the file is successfully created and opened
 *
 * @throws When file system operations fail (e.g., permissions, disk space)
 *
 * @example
 * ```typescript
 * const minifiedCSS = 'body{margin:0;color:red}';
 * const newPath = '/path/to/style.min.css';
 * const stats = { originalSize: 100, minifiedSize: 50, reductionPercent: 50, ... };
 * await saveAsNewFile(minifiedCSS, newPath, stats);
 * // File is created, opened in editor, and user sees success message with statistics
 * ```
 */
export async function saveAsNewFile(
	minifiedText: string,
	newFileName: string,
	stats: MinificationStats
): Promise<void> {
	// Create a VS Code URI for the new file path
	const uri = vscode.Uri.file(newFileName);

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
 * the file extension. It only works with supported file extensions (.css, .js).
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
