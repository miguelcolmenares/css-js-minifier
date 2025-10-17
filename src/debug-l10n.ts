// Test l10n functionality directly
import * as vscode from "vscode";

/* eslint-disable no-console */
export function testL10n() {
	console.log("=== L10n Debug Test ===");
	console.log("vscode.l10n.bundle:", vscode.l10n.bundle);
	console.log("vscode.l10n.uri:", vscode.l10n.uri);
	
	const testMessage = vscode.l10n.t('fileService.inPlace.successWithStats', 'test.css', '100 B', '80 B', '20');
	console.log("Test message result:", testMessage);
	
	// Test with a key that doesn't exist
	const nonExistentKey = vscode.l10n.t('nonExistent.key');
	console.log("Non-existent key result:", nonExistentKey);
	
	// Show in UI to see what happens
	vscode.window.showInformationMessage(testMessage);
}