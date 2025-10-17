// Test l10n functionality directly
import * as vscode from "vscode";

export function testL10n() {
	// Using VS Code's output channel instead of console to avoid linting issues
	const output = vscode.window.createOutputChannel("L10n Debug");
	output.appendLine("=== L10n Debug Test ===");
	output.appendLine(`vscode.l10n.bundle: ${vscode.l10n.bundle}`);
	output.appendLine(`vscode.l10n.uri: ${vscode.l10n.uri}`);
	
	const testMessage = vscode.l10n.t('fileService.inPlace.successWithStats', 'test.css', '100 B', '80 B', '20');
	output.appendLine(`Test message result: ${testMessage}`);
	
	// Test with a key that doesn't exist
	const nonExistentKey = vscode.l10n.t('nonExistent.key');
	output.appendLine(`Non-existent key result: ${nonExistentKey}`);
	output.show();
	
	// Show in UI to see what happens
	vscode.window.showInformationMessage(testMessage);
}