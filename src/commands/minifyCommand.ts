/**
 * @fileoverview Command handlers for CSS and JavaScript minification operations.
 *
 * This module contains the main command handlers that are registered with VS Code
 * to handle user-initiated minification requests. It supports both in-place
 * minification and creating new minified files.
 *
 * @author Miguel Colmenares
 * @since 0.1.0
 */

import * as vscode from 'vscode';
import { validateFileType, validateContentLength } from '@/utils/validators';
import { getMinifiedText } from '@/services/minificationService';
import { saveAsNewFile, replaceDocumentContent, createMinifiedFileName } from '@/services/fileService';
import { t } from '@/utils/l10nHelper';

// Set to track documents currently being processed to prevent recursion
// Uses document URI as key to allow per-document tracking
const processingDocuments = new Set<string>();

/**
 * Configuration options for minification operations.
 *
 * @interface MinifyOptions
 * @property {boolean} [saveAsNewFile] - Whether to save the result as a new file instead of replacing content
 * @property {string} [filePrefix] - The prefix to use when creating new files (e.g., '.min', '-compressed')
 * @property {string} [debugSource] - Debug identifier for the source of the command
 */
export interface MinifyOptions {
	saveAsNewFile?: boolean;
	filePrefix?: string;
	debugSource?: string;
}

/**
 * Processes a VS Code document for minification with the specified options.
 *
 * This is the core function that handles the minification workflow:
 * 1. Validates file type and content
 * 2. Calls the minification service
 * 3. Saves the result (either in-place or as new file)
 *
 * @async
 * @function processDocument
 * @param {vscode.TextDocument} document - The VS Code document to process
 * @param {MinifyOptions} [options={}] - Configuration options for the minification
 * @param {boolean} [skipSave=false] - Whether to skip saving the document (caller will handle save)
 * @returns {Promise<void>} Resolves when the minification process is complete
 *
 * @throws {Error} When file validation fails or minification service encounters errors
 *
 * @example
 * ```typescript
 * // Minify in-place
 * await processDocument(document);
 *
 * // Minify and save as new file
 * await processDocument(document, {
 *   saveAsNewFile: true,
 *   filePrefix: '.min'
 * });
 *
 * // Minify but don't save (manual command will save later)
 * await processDocument(document, {}, true);
 * ```
 */
async function processDocument(
	document: vscode.TextDocument,
	options: MinifyOptions = {},
	skipSave: boolean = false
): Promise<void> {
	// Extract file information for validation and processing
	const fileType = document.languageId;
	const text = document.getText();

	// Validate that the file type is supported and has content
	if (!validateFileType(fileType) || !validateContentLength(text, fileType)) {
		// Validation failed, error messages already shown to user
		return;
	}

	// Call the minification service to process the content
	const result = getMinifiedText(text, fileType);
	if (!result) {
		// Minification failed, error already reported to user
		return;
	}

	// Extract minified text and statistics
	const { minifiedText, stats } = result;

	// Save the result based on user preferences
	if (options.saveAsNewFile && options.filePrefix) {
		// Create new file with minified content
		const newFileName = createMinifiedFileName(document.fileName, options.filePrefix);
		await saveAsNewFile(minifiedText, newFileName, stats);
	} else {
		// Replace current document content with minified version
		// Skip save if caller (e.g., manual command) will handle it to maintain Set protection
		await replaceDocumentContent(document, minifiedText, stats, true, skipSave);
	}
}

/**
 * Command handler for the 'extension.minify' VS Code command.
 *
 * This function handles in-place minification of CSS and JavaScript files.
 * It works with both the active editor and files selected in the explorer.
 * The original file content is replaced with the minified version.
 *
 * **Important**: Prevents double minification by tracking documents during processing.
 * When processDocument saves the file, it would trigger onSaveMinify, but we prevent
 * that by adding the document to processingDocuments Set.
 *
 * @async
 * @function minifyCommand
 * @param {vscode.Uri} [uri] - Optional URI of the file to minify. When invoked from
 *   the file explorer context menu, VS Code passes the clicked file's URI. When
 *   invoked from the editor context menu or command palette, this is undefined and
 *   the active editor document is used.
 * @returns {Promise<void>} Resolves when the command execution is complete
 *
 * @sideEffects
 * - Modifies the content of the target file(s)
 * - Shows user notifications for success/error states
 * - Saves modified documents to disk
 *
 * @example
 * // This function is typically called by VS Code when the user:
 * // - Uses the command palette: "Minify this File"
 * // - Uses the keyboard shortcut: Alt+Ctrl+M
 * // - Right-clicks in editor: "Minify this File"
 * // - Right-clicks a file in the explorer: "Minify this File"
 */
export async function minifyCommand(uri?: vscode.Uri): Promise<void> {
	let document: vscode.TextDocument | undefined;

	if (uri) {
		// Invoked from the file explorer with a URI — open the document
		try {
			document = await vscode.workspace.openTextDocument(uri);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(t('commands.openFile.failed', errorMessage));
			return;
		}
	} else {
		// Invoked from editor context menu, keyboard shortcut, or command palette
		document = vscode.window.activeTextEditor?.document;
	}

	// Process the document if available
	if (document) {
		const documentUri = document.uri.toString();
		// Prevent onSaveMinify from re-processing when we save
		processingDocuments.add(documentUri);
		try {
			// Skip save in processDocument - we'll save after while Set still has protection
			await processDocument(document, { debugSource: 'manual' }, true);
			// Now save while still protected by Set to prevent onSaveMinify recursion
			await document.save();
		} finally {
			// Remove from set only after ALL operations including save are complete
			processingDocuments.delete(documentUri);
		}
	}
}

/**
 * Command handler for the 'extension.minifyInNewFile' VS Code command.
 *
 * This function handles minification with the result saved to a new file.
 * The original file remains unchanged, and a new file is created with the
 * user-configured prefix (e.g., 'style.css' becomes 'style.min.css').
 *
 * @async
 * @function minifyInNewFileCommand
 * @param {vscode.Uri} [uri] - Optional URI of the file to minify. When invoked from
 *   the file explorer context menu, VS Code passes the clicked file's URI. When
 *   invoked from the editor context menu or command palette, this is undefined and
 *   the active editor document is used.
 * @returns {Promise<void>} Resolves when the command execution is complete
 *
 * @sideEffects
 * - Creates a new file with minified content
 * - Opens the new file in VS Code editor
 * - Shows user notifications for success/error states
 *
 * @example
 * // This function is typically called by VS Code when the user:
 * // - Uses the command palette: "Minify and Save as New File"
 * // - Uses the keyboard shortcut: Alt+Ctrl+N
 * // - Right-clicks in editor: "Minify and Save as New File"
 * // - Right-clicks a file in the explorer: "Minify and Save as New File"
 */
export async function minifyInNewFileCommand(uri?: vscode.Uri): Promise<void> {
	let document: vscode.TextDocument | undefined;

	if (uri) {
		// Invoked from the file explorer with a URI — open the document
		try {
			document = await vscode.workspace.openTextDocument(uri);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(t('commands.openFile.failed', errorMessage));
			return;
		}
	} else {
		// Invoked from editor context menu, keyboard shortcut, or command palette
		document = vscode.window.activeTextEditor?.document;
	}

	// Get user configuration for file naming
	const settings = vscode.workspace.getConfiguration('css-js-minifier');
	const filePrefix = settings.get('minifiedNewFilePrefix') as string;

	// Configure options for creating new files
	const options: MinifyOptions = {
		saveAsNewFile: true,
		filePrefix,
		debugSource: 'manual',
	};

	// Process the document if available
	if (document) {
		await processDocument(document, options);
	}
}

/**
 * Event handler for automatic minification when files are saved.
 *
 * This function is triggered by VS Code's onDidSaveTextDocument event
 * when the 'minifyOnSave' configuration option is enabled. It automatically
 * minifies CSS and JavaScript files whenever they are saved.
 *
 * **Important**: This function ensures only ONE API call per save event:
 * - When creating new files: delegates to processDocument (single call)
 * - When in-place: calls getMinifiedText once, then uses setSkipAutoMinify to prevent recursion
 *
 * @async
 * @function onSaveMinify
 * @param {vscode.TextDocument} document - The document that was saved
 * @returns {Promise<void>} Resolves when auto-minification is complete
 *
 * @sideEffects
 * - Modifies the content of the saved file if it's CSS or JavaScript
 * - Shows user notifications for success/error states
 * - Saves the document again after minification (in-place mode only)
 *
 * @example
 * // This function is automatically called when:
 * // - User saves a CSS or JS file (Ctrl+S)
 * // - Auto-save triggers on a CSS or JS file
 * // - File is saved programmatically
 */
export async function onSaveMinify(document: vscode.TextDocument): Promise<void> {
	// Prevent recursion - if this document is already being processed, skip
	const documentUri = document.uri.toString();
	if (processingDocuments.has(documentUri)) {
		return;
	}

	// Check if the saved file is a supported type for minification
	const fileType = document.languageId;
	if (fileType === 'css' || fileType === 'javascript') {
		// Get the file content for validation
		const text = document.getText();

		// Only proceed if the file has content (empty files don't need minification)
		if (validateContentLength(text, fileType)) {
			// Get user configuration settings
			const settings = vscode.workspace.getConfiguration('css-js-minifier');
			const shouldCreateNewFile = settings.get('minifyInNewFile') as boolean;
			const filePrefix = settings.get('minifiedNewFilePrefix') as string;

			if (shouldCreateNewFile) {
				// Create new file with minified content
				// Use processDocument to handle the entire workflow (no duplicate API call)
				const options: MinifyOptions = {
					saveAsNewFile: true,
					filePrefix,
				};
				await processDocument(document, options);
			} else {
				// For in-place minification, track this document to prevent recursion
				processingDocuments.add(documentUri);
				try {
					const result = getMinifiedText(text, fileType);
					if (result) {
						const { minifiedText, stats } = result;
						// Replace content and save (suppress notification for auto-save to avoid duplicates)
						await replaceDocumentContent(document, minifiedText, stats, false);
					}
				} finally {
					// Always remove from set when done, even if an error occurs
					processingDocuments.delete(documentUri);
				}
			}
		}
	}
}
