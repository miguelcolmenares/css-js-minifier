import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("JS & CSS Minifier Test Suite", function () {
	vscode.window.showInformationMessage("Start all tests.");

	test("Minify CSS file", async function () {
		this.timeout(15000); // Increase timeout to 15 seconds
		const uri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const document = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(document);

		await vscode.commands.executeCommand("extension.minify");

		const minifiedContent = document.getText();
		assert.strictEqual(minifiedContent, "p{color:red}");
	});

	test("Minify JS file", async function () {
		this.timeout(15000); // Increase timeout to 15 seconds
		const uri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.js"));
		const document = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(document);

		await vscode.commands.executeCommand("extension.minify");

		const minifiedContent = document.getText();
		assert.strictEqual(
			minifiedContent,
			'function test(){for(var r="Hello, World!",o="",e=0;e<r.length;e++)o+=String.fromCharCode(r.charCodeAt(e)+1);return o}',
		); // Actual minified content
	});

	test("Minify CSS file and save as new file", async function () {
		this.timeout(15000); // Increase timeout to 15 seconds
		const uri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const document = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(document);

		await vscode.commands.executeCommand("extension.minifyInNewFile");

		const newFileUri = vscode.Uri.file(document.uri.fsPath.replace(/(\.css)$/, ".min$1"));
		const newDocument = await vscode.workspace.openTextDocument(newFileUri);
		const minifiedContent = newDocument.getText();
		assert.strictEqual(minifiedContent, "p{color:red}");
	});

	test("Minify JS file and save as new file", async function () {
		this.timeout(15000); // Increase timeout to 15 seconds
		const uri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.js"));
		const document = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(document);

		await vscode.commands.executeCommand("extension.minifyInNewFile");

		const newFileUri = vscode.Uri.file(document.uri.fsPath.replace(/(\.js)$/, ".min$1"));
		const newDocument = await vscode.workspace.openTextDocument(newFileUri);
		const minifiedContent = newDocument.getText();
		assert.strictEqual(
			minifiedContent,
			'function test(){for(var r="Hello, World!",o="",e=0;e<r.length;e++)o+=String.fromCharCode(r.charCodeAt(e)+1);return o}',
		); // Actual minified content
	});
});
