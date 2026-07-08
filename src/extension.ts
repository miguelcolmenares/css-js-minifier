/**
 * @fileoverview Main entry point for the CSS & JS Minifier VS Code extension.
 *
 * This extension provides commands to minify CSS and JavaScript files.
 * CSS minification uses the local LightningCSS library (Rust-based),
 * while JavaScript uses the local oxc-minify library (Rust-based).
 * Both work fully offline with no API dependencies. It supports both in-place
 * minification and creating new minified files with configurable prefixes.
 *
 * @author Miguel Colmenares
 * @version 1.3.2
 * @since 0.1.0
 * @see {@link https://github.com/miguelcolmenares/css-js-minifier} GitHub Repository
 */

import * as vscode from 'vscode';
import { minifyCommand, minifyInNewFileCommand, onSaveMinify } from './commands';
import { loadL10nBundle, t } from './utils/l10nHelper';

/**
 * Output channel for extension logging.
 * Provides structured messages visible in the VS Code Output panel.
 */
let outputChannel: vscode.OutputChannel;

/**
 * Activates the CSS & JS Minifier extension.
 *
 * This function is called by VS Code when the extension is first activated.
 * It registers command handlers, sets up event listeners, and configures
 * the extension based on user settings.
 *
 * Registered commands:
 * - `extension.minify`: Minifies the current file in-place
 * - `extension.minifyInNewFile`: Creates a new minified file
 *
 * Optional features (based on configuration):
 * - Auto-minification on file save (when `minifyOnSave` is enabled)
 *
 * @function activate
 * @param {vscode.ExtensionContext} context - The extension context provided by VS Code
 * @returns {void}
 *
 * @example
 * // This function is automatically called by VS Code when:
 * // - The extension is first loaded
 * // - A CSS or JavaScript file is opened (based on activationEvents)
 * // - The user manually activates the extension
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	// Create output channel for extension logging
	outputChannel = vscode.window.createOutputChannel('CSS & JS Minifier');
	context.subscriptions.push(outputChannel);

	try {
		// Initialize l10n fallback system
		await loadL10nBundle(context.extensionPath);

		// Register the main minification command (in-place minification)
		const minifyCommandDisposable = vscode.commands.registerCommand('extension.minify', minifyCommand);

		// Register the command for creating new minified files
		const minifyInNewFileCommandDisposable = vscode.commands.registerCommand(
			'extension.minifyInNewFile',
			minifyInNewFileCommand
		);

		// Add command disposables to context for proper cleanup on deactivation
		context.subscriptions.push(minifyCommandDisposable);
		context.subscriptions.push(minifyInNewFileCommandDisposable);

		// Set up auto-minification on save if enabled in user settings
		const config = vscode.workspace.getConfiguration('css-js-minifier');
		if (config.get('minifyOnSave')) {
			// Register event listener for document save events
			const onSaveListener = vscode.workspace.onDidSaveTextDocument(onSaveMinify);
			// Add listener to subscriptions for proper cleanup
			context.subscriptions.push(onSaveListener);
		}

		outputChannel.appendLine('[INFO] CSS & JS Minifier extension activated successfully.');
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		outputChannel.appendLine(`[ERROR] Extension activation failed: ${errorMessage}`);
		if (error instanceof Error && error.stack) {
			outputChannel.appendLine(`[ERROR] Stack trace: ${error.stack}`);
		}
		outputChannel.show(true);
		vscode.window.showErrorMessage(t('extension.activation.failed', errorMessage));
	}
}

/**
 * Deactivates the CSS & JS Minifier extension.
 *
 * This function is called by VS Code when the extension is being deactivated.
 * All registered commands and event listeners are automatically cleaned up
 * via the context.subscriptions array, so this function can remain empty.
 *
 * @function deactivate
 * @returns {void}
 *
 * @example
 * // This function is automatically called by VS Code when:
 * // - The extension is being disabled
 * // - VS Code is shutting down
 * // - The extension is being uninstalled
 */
export function deactivate(): void {
	// Extension cleanup is handled automatically by VS Code through
	// the context.subscriptions array populated during activation
}
