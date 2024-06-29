import * as fs from "fs";
import * as path from "path";
import * as sinon from "sinon";
import * as vscode from "vscode";
import assert from "assert";

/**
 * Deletes the generated files with the specified prefixes.
 *
 * @param {vscode.Uri} uri
 * @param {string[]} prefixes
 * @returns {Promise<void>}
 */
async function deleteGeneratedFiles(uri: vscode.Uri, prefixes: string[]): Promise<void> {
	for (const prefix of prefixes) {
		const newFileUri = vscode.Uri.file(uri.fsPath.replace(/(\.css|\.js)$/, `${prefix}$1`));
		if (fs.existsSync(newFileUri.fsPath)) {
			fs.unlinkSync(newFileUri.fsPath);
		}
	}
}

// Define expected minified content
const cssMinifiedContent = "p{color:red}";
const jsMinifiedContent =
	'function test(){for(var r="Hello, World!",o="",e=0;e<r.length;e++)o+=String.fromCharCode(r.charCodeAt(e)+1);return o}';
// Define prefixes for new files
	const prefixes = [".min", "-min", ".compressed", "-compressed", ".minified", "-minified"];

// Main suite that groups all tests
suite("JS & CSS Minifier Test Suite", async function () {
	// Set a maximum timeout for each test
	this.timeout(15000);

	// Show an informational message when starting the tests
	vscode.window.showInformationMessage("Start all tests.");

	this.afterAll(async function () {
		const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const jsUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.js"));
		await deleteGeneratedFiles(cssUri, prefixes);
		await deleteGeneratedFiles(jsUri, prefixes);
	});

	// Test for minifying a CSS file
	test("Minify CSS file", async function () {
		const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const cssDocument = await vscode.workspace.openTextDocument(cssUri);
		await vscode.window.showTextDocument(cssDocument);
		await vscode.commands.executeCommand("extension.minify");
		const minifiedContent = cssDocument.getText();
		assert.strictEqual(minifiedContent, cssMinifiedContent);
	});

	// Test for minifying a JS file
	test("Minify JS file", async function () {
		const jsUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.js"));
		const jsDocument = await vscode.workspace.openTextDocument(jsUri);
		await vscode.window.showTextDocument(jsDocument);
		await vscode.commands.executeCommand("extension.minify");
		const minifiedContent = jsDocument.getText();
		assert.strictEqual(minifiedContent, jsMinifiedContent);
	});

	// Tests for minifying CSS and JS files and saving them with different prefixes
	prefixes.forEach((prefix) => {
		test(`Minify CSS file and save as new file with prefix '${prefix}'`, async function () {
			const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
			const cssDocument = await vscode.workspace.openTextDocument(cssUri);
			await vscode.window.showTextDocument(cssDocument);
			await vscode.workspace.getConfiguration("css-js-minifier").update("minifiedNewFilePrefix", prefix, true);
			await vscode.commands.executeCommand("extension.minifyInNewFile");
			const newFileUri = vscode.Uri.file(cssDocument.uri.fsPath.replace(/(\.css)$/, `${prefix}$1`));
			const newDocument = await vscode.workspace.openTextDocument(newFileUri);
			const minifiedContent = newDocument.getText();
			assert.strictEqual(minifiedContent, cssMinifiedContent);
		});
	});

	prefixes.forEach((prefix) => {
		test(`Minify JS file and save as new file with prefix '${prefix}'`, async function () {
			const jsUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.js"));
			const jsDocument = await vscode.workspace.openTextDocument(jsUri);
			await vscode.window.showTextDocument(jsDocument);
			await vscode.workspace.getConfiguration("css-js-minifier").update("minifiedNewFilePrefix", prefix, true);
			await vscode.commands.executeCommand("extension.minifyInNewFile");
			const newFileUri = vscode.Uri.file(jsDocument.uri.fsPath.replace(/(\.js)$/, `${prefix}$1`));
			const newDocument = await vscode.workspace.openTextDocument(newFileUri);
			const minifiedContent = newDocument.getText();
			assert.strictEqual(minifiedContent, jsMinifiedContent);
		});
	});

	// Test for minifying a CSS file and saving it with the configured prefix
	test("Minify CSS file and save as new file with default prefix", async function () {
		const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const cssDocument = await vscode.workspace.openTextDocument(cssUri);
		const prefix = (await vscode.workspace
			.getConfiguration("css-js-minifier")
			.get("minifiedNewFilePrefix")) as string;
		await vscode.window.showTextDocument(cssDocument);
		await vscode.commands.executeCommand("extension.minifyInNewFile");
		const newFileUri = vscode.Uri.file(cssDocument.uri.fsPath.replace(/(\.css)$/, `${prefix}$1`));
		const newDocument = await vscode.workspace.openTextDocument(newFileUri);
		const minifiedContent = newDocument.getText();
		assert.strictEqual(minifiedContent, cssMinifiedContent);
	});

	// Test for minifying a JS file and saving it with the configured prefix
	test("Minify JS file and save as new file with default prefix", async function () {
		const jsUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.js"));
		const jsDocument = await vscode.workspace.openTextDocument(jsUri);
		const prefix = (await vscode.workspace
			.getConfiguration("css-js-minifier")
			.get("minifiedNewFilePrefix")) as string;
		await vscode.window.showTextDocument(jsDocument);
		await vscode.commands.executeCommand("extension.minifyInNewFile");
		const newFileUri = vscode.Uri.file(jsDocument.uri.fsPath.replace(/(\.js)$/, `${prefix}$1`));
		const newDocument = await vscode.workspace.openTextDocument(newFileUri);
		const minifiedContent = newDocument.getText();
		assert.strictEqual(minifiedContent, jsMinifiedContent);
	});

	// Test for minifying a CSS file and saving it as a new file from the explorer context menu
	test("Minify CSS file and save as new file in Explorer context menu", async function () {
		const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const prefix = (await vscode.workspace
			.getConfiguration("css-js-minifier")
			.get("minifiedNewFilePrefix")) as string;
		const explorerCommand = "extension.minifyInNewFile";
		await testExplorerContextMenu(cssUri, prefix, explorerCommand, cssMinifiedContent);
	});

	// Test for minifying a JS file and saving it as a new file from the explorer context menu
	test("Minify JS file and save as new file in Explorer context menu", async function () {
		const jsUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.js"));
		const prefix = (await vscode.workspace
			.getConfiguration("css-js-minifier")
			.get("minifiedNewFilePrefix")) as string;
		const explorerCommand = "extension.minifyInNewFile";
		await testExplorerContextMenu(jsUri, prefix, explorerCommand, jsMinifiedContent);
	});

	// Test for unsupported file type
	test("Unsupported file type", async function () {
		const showErrorMessageSpy = sinon.spy(vscode.window, "showErrorMessage");
		const txtUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.txt"));
		const txtDocument = await vscode.workspace.openTextDocument(txtUri);
		await vscode.window.showTextDocument(txtDocument);
		await vscode.commands.executeCommand("extension.minify");
		const documentContent = txtDocument.getText();
		// The content should not change for unsupported file types
		assert.strictEqual(documentContent, "This is a text file and should not be minified.");
		assert(showErrorMessageSpy.calledWith("The file type is not supported."));
		showErrorMessageSpy.restore();
	});

	// Test for empty CSS file
	test("Empty CSS file", async function () {
		const showErrorMessageSpy = sinon.spy(vscode.window, "showErrorMessage");
		const emptyCssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "empty.css"));
		const emptyCssDocument = await vscode.workspace.openTextDocument(emptyCssUri);
		await vscode.window.showTextDocument(emptyCssDocument);
		await vscode.commands.executeCommand("extension.minify");
		const documentContent = emptyCssDocument.getText();
		// The content should remain empty
		assert.strictEqual(documentContent, "");
		assert(showErrorMessageSpy.calledWith("The css file is empty."));
		showErrorMessageSpy.restore();
	});

	// Test for empty JS file
	test("Empty JS file", async function () {
		const showErrorMessageSpy = sinon.spy(vscode.window, "showErrorMessage");
		const emptyJsUri = vscode.Uri.file(path.join(__dirname, "fixtures", "empty.js"));
		const emptyJsDocument = await vscode.workspace.openTextDocument(emptyJsUri);
		await vscode.window.showTextDocument(emptyJsDocument);
		await vscode.commands.executeCommand("extension.minify");
		const documentContent = emptyJsDocument.getText();
		// The content should remain empty
		assert.strictEqual(documentContent, "");
		assert(showErrorMessageSpy.calledWith("The javascript file is empty."));
		showErrorMessageSpy.restore();
	});

	// Function to test the explorer context menu functionality
	async function testExplorerContextMenu(
		uri: vscode.Uri,
		newFilePrefix: string,
		command: string,
		expectedContent?: string,
	) {
		const context = {
			fsPath: uri.fsPath,
		};
		await vscode.commands.executeCommand(command, context);
		const newFileUri = vscode.Uri.file(uri.fsPath.replace(/(\.css|\.js)$/, `${newFilePrefix}$1`));
		const newDocument = await vscode.workspace.openTextDocument(newFileUri);
		const minifiedContent = newDocument.getText();
		assert.strictEqual(minifiedContent, expectedContent);
	}
});

// Keybinding test suite
suite("Keybinding Test Suite", async function () {
	// Set a maximum timeout for each test
	this.timeout(15000);

	// Show an informational message when starting the tests
	vscode.window.showInformationMessage("Start keybinding tests.");

	this.afterAll(async function () {
		const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const jsUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.js"));
		await deleteGeneratedFiles(cssUri, prefixes);
		await deleteGeneratedFiles(jsUri, prefixes);
	});

	// Test for the keybinding of the minify command
	test("Keybinding for minify command", async function () {
		// Create a spy on the command to check if it gets called
		const executeCommandSpy = sinon.spy(vscode.commands, "executeCommand");

		// Simulate pressing the keybinding
		const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const cssDocument = await vscode.workspace.openTextDocument(cssUri);
		await vscode.window.showTextDocument(cssDocument);
		await vscode.commands.executeCommand("extension.minify");

		// Check if the command was called
		assert(executeCommandSpy.calledWith("extension.minify"), "The minify command was not called via keybinding");

		// Restore the original method
		executeCommandSpy.restore();
	});

	test("Keybinding for minify in new file command", async function () {
		// Create a spy on the command to check if it gets called
		const executeCommandSpy = sinon.spy(vscode.commands, "executeCommand");

		// Simulate pressing the keybinding
		const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const cssDocument = await vscode.workspace.openTextDocument(cssUri);
		await vscode.window.showTextDocument(cssDocument);
		await vscode.commands.executeCommand("extension.minifyInNewFile");

		// Check if the command was called
		assert(
			executeCommandSpy.calledWith("extension.minifyInNewFile"),
			"The minify in new file command was not called via keybinding",
		);

		// Restore the original method
		executeCommandSpy.restore();
	});
});
