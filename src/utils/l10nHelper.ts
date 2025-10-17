/**
 * @fileoverview L10n helper utilities for fallback localization support.
 * @author Miguel Colmenares
 * @since 1.1.0
 */

import * as vscode from 'vscode';

/**
 * Global l10n bundle loaded manually as fallback
 */
let l10nBundle: Record<string, string> = {};

/**
 * Load l10n bundle manually from extension files
 * @param extensionPath - Path to the extension directory
 */
export async function loadL10nBundle(extensionPath: string): Promise<void> {
	try {
		const l10nFile = vscode.Uri.file(`${extensionPath}/l10n/bundle.l10n.json`);
		const content = await vscode.workspace.fs.readFile(l10nFile);
		l10nBundle = JSON.parse(content.toString());
	} catch {
		l10nBundle = {};
	}
}

/**
 * Localization function with fallback support
 * Uses native VS Code l10n if available, otherwise falls back to manual bundle loading
 * @param key - The localization key
 * @param args - Arguments to substitute in the message
 * @returns Localized message
 */
export function t(key: string, ...args: string[]): string {
	try {
		// Try native VS Code l10n first
		return vscode.l10n.t(key, ...args);
	} catch {
		// Fall through to manual fallback
	}
	
	// Use manual fallback
	let message = l10nBundle[key] || key;
	args.forEach((arg, index) => {
		message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), arg);
	});
	return message;
}

/**
 * Get the current l10n bundle status for debugging
 * @returns Object with bundle status information
 */
export function getL10nStatus() {
	return {
		nativeBundle: vscode.l10n.bundle,
		nativeUri: vscode.l10n.uri,
		fallbackKeys: Object.keys(l10nBundle).length,
		fallbackBundle: l10nBundle
	};
}