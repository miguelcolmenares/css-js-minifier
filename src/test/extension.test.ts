import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

// Main suite that groups all tests
suite("JS & CSS Minifier Test Suite", async function () {
	// Set a maximum timeout for each test
	this.timeout(15000);

	// Show an informational message when starting the tests
	vscode.window.showInformationMessage("Start all tests.");

	// Define expected minified content
	const cssMinifiedContent = "p{color:red}";
	const jsMinifiedContent =
		'function test(){for(var r="Hello, World!",o="",e=0;e<r.length;e++)o+=String.fromCharCode(r.charCodeAt(e)+1);return o}';

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
	[".min", "-min", ".compressed", "-compressed", ".minified", "-minified"].forEach((prefix) => {
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

	[".min", "-min", ".compressed", "-compressed", ".minified", "-minified"].forEach((prefix) => {
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
		const prefix = await vscode.workspace.getConfiguration("css-js-minifier").get("minifiedNewFilePrefix");
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
		const prefix = await vscode.workspace.getConfiguration("css-js-minifier").get("minifiedNewFilePrefix");
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
