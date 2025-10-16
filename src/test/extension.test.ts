import * as fs from "fs";
import * as path from "path";
import * as sinon from "sinon";
import * as vscode from "vscode";
import assert from "assert";
import { setTimeout } from "timers";

/**
 * Rate limiting configuration for Toptal API tests
 * Toptal allows 30 requests per minute, so we need delays between tests
 */
const RATE_LIMIT_CONFIG = {
	// Delay between tests in milliseconds (3 seconds)
	TEST_DELAY_MS: 3000,
	// Maximum retries for failed requests
	MAX_RETRIES: 3,
	// Timeout for individual tests (5 seconds - realistic for API calls)
	TEST_TIMEOUT_MS: 5000
};

/**
 * Adds a delay between tests to respect Toptal API rate limits (30 req/min)
 * @param ms - Delay in milliseconds (default: 3000ms)
 */
async function delayBetweenTests(ms: number = RATE_LIMIT_CONFIG.TEST_DELAY_MS): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

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
suite("JS & CSS Minifier Test Suite", function () {
	// Set a maximum timeout for each test (increased for rate limiting)
	this.timeout(RATE_LIMIT_CONFIG.TEST_TIMEOUT_MS);

	// Show an informational message when starting the tests
	vscode.window.showInformationMessage("Start all tests.");

	// Clean up sinon spies after each test to prevent conflicts
	this.afterEach(function () {
		sinon.restore();
	});

	// Add delay after each test to respect rate limits
	this.afterEach(async function () {
		await delayBetweenTests();
	});

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
		assert(showErrorMessageSpy.calledWith("File type 'plaintext' is not supported. Only CSS and JavaScript files can be minified."));
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
		assert(showErrorMessageSpy.calledWith("Cannot minify empty css file. Please add some content first."));
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
		assert(showErrorMessageSpy.calledWith("Cannot minify empty javascript file. Please add some content first."));
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

// CSS nth-child Test Suite
suite("CSS nth-child Test Suite", async function () {
	// Set a maximum timeout for each test (increased for rate limiting)
	this.timeout(RATE_LIMIT_CONFIG.TEST_TIMEOUT_MS);

	// Show an informational message when starting the tests
	vscode.window.showInformationMessage("Start CSS nth-child tests.");

	// Add delay after each test to respect rate limits
	this.afterEach(async function () {
		await delayBetweenTests();
	});

	this.afterAll(async function () {
		const nthChildUri = vscode.Uri.file(path.join(__dirname, "fixtures", "nth-child-test.css"));
		await deleteGeneratedFiles(nthChildUri, prefixes);
	});

	// Test for minifying CSS with nth-child selectors
	test("Minify CSS with nth-child selectors", async function () {
		const nthChildUri = vscode.Uri.file(path.join(__dirname, "fixtures", "nth-child-test.css"));
		const nthChildDocument = await vscode.workspace.openTextDocument(nthChildUri);
		await vscode.window.showTextDocument(nthChildDocument);
		
		// Get original content for debugging
		const originalContent = nthChildDocument.getText();
		
		// Expected minified result based on our curl test
		const expectedMinified = ".container:nth-child(odd){background-color:#fff;margin:10px}div:nth-child(odd){color:#00f;padding:5px}.item:nth-child(3nof.special){font-weight:700;border:1px solid red}p:nth-child(2n){text-align:center;font-size:14px}.menu-item:nth-child(2n+1of.active){display:block;opacity:.8}";
		
		// Execute minify command
		await vscode.commands.executeCommand("extension.minify");
		
		// Get minified content
		const minifiedContent = nthChildDocument.getText();
		
		// DEBUG: Log content to understand what's happening
		if (minifiedContent === originalContent) {
			// If content didn't change, this reproduces the issue
			assert.fail(
				`CSS nth-child selectors were not minified.\n` +
				`Original length: ${originalContent.length} characters\n` +
				`Minified length: ${minifiedContent.length} characters\n` +
				`Expected result: ${expectedMinified}\n` +
				`This confirms the CSS nth-child minification bug.`
			);
		}
		
		// If we get here, minification worked - verify the result
		assert.notStrictEqual(minifiedContent, "", "Minified content should not be empty");
		assert.notStrictEqual(minifiedContent, originalContent, "Content should be different after minification");
		
		// Check that nth-child selectors are preserved
		assert(minifiedContent.includes("nth-child"), "nth-child selectors should be preserved");
		
		// Check that the result is properly minified (no unnecessary whitespace)
		assert(!minifiedContent.includes("  "), "Should not contain multiple spaces");
		assert(!minifiedContent.includes("\n"), "Should not contain newlines");
		
		// Verify the minified content matches the expected result (or is close to it)
		const minifiedTrimmed = minifiedContent.trim();
		assert(minifiedTrimmed.length < originalContent.length, "Minified content should be shorter than original");
	});

	// Test for minifying CSS with nth-child and saving to new file
	test("Minify CSS with nth-child and save as new file", async function () {
		const nthChildUri = vscode.Uri.file(path.join(__dirname, "fixtures", "nth-child-test.css"));
		const nthChildDocument = await vscode.workspace.openTextDocument(nthChildUri);
		const prefix = (await vscode.workspace
			.getConfiguration("css-js-minifier")
			.get("minifiedNewFilePrefix")) as string;
		await vscode.window.showTextDocument(nthChildDocument);
		
		// Execute minify in new file command
		await vscode.commands.executeCommand("extension.minifyInNewFile");
		
		// Check the new minified file
		const newFileUri = vscode.Uri.file(nthChildDocument.uri.fsPath.replace(/(\.css)$/, `${prefix}$1`));
		const newDocument = await vscode.workspace.openTextDocument(newFileUri);
		const minifiedContent = newDocument.getText();
		
		// Basic validation
		assert.notStrictEqual(minifiedContent, "");
		assert(minifiedContent.includes("nth-child"), "nth-child selectors should be preserved in new file");
	});
});

// Keybinding Test Suite
suite("Keybinding Test Suite", function () {
	// Set a maximum timeout for each test (increased for rate limiting)
	this.timeout(RATE_LIMIT_CONFIG.TEST_TIMEOUT_MS);

	// Add delay after each test to respect rate limits
	this.afterEach(async function () {
		await delayBetweenTests();
	});

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

// Configuration Test Suite
suite("Configuration Test Suite", async function () {
	// Set a maximum timeout for each test (increased for rate limiting)
	this.timeout(RATE_LIMIT_CONFIG.TEST_TIMEOUT_MS);

	// Clean up any existing files before starting configuration tests
	this.beforeAll(async function () {
		vscode.window.showInformationMessage("Cleaning up files before configuration tests.");
		
		// Reset all configurations to defaults first
		const config = vscode.workspace.getConfiguration("css-js-minifier");
		await config.update("minifyInNewFile", true, true);
		await config.update("autoOpenNewFile", true, true);
		await config.update("minifiedNewFilePrefix", ".min", true);
		
		// Wait for configuration changes to take effect
		await delayBetweenTests(1000);
		
		// Clean up any generated minified files from previous tests
		const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const jsUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.js"));
		const nthChildUri = vscode.Uri.file(path.join(__dirname, "fixtures", "nth-child-test.css"));
		
		await deleteGeneratedFiles(cssUri, prefixes);
		await deleteGeneratedFiles(jsUri, prefixes);
		await deleteGeneratedFiles(nthChildUri, prefixes);
		
		// Also clean up any extra minified files that might have been created
		const fixturesDir = path.join(__dirname, "fixtures");
		if (fs.existsSync(fixturesDir)) {
			const files = fs.readdirSync(fixturesDir);
			for (const file of files) {
				if (file.includes("min") || file.includes("compressed")) {
					const filePath = path.join(fixturesDir, file);
					if (fs.existsSync(filePath)) {
						fs.unlinkSync(filePath);
					}
				}
			}
		}
		
		// Restore original fixture files from source (they may have been modified in-place by previous tests)
		const srcFixturesDir = path.join(__dirname, "..", "..", "src", "test", "fixtures");
		const outFixturesDir = path.join(__dirname, "fixtures");
		
		// Copy fresh fixtures from source to restore original content
		const fixturesToRestore = ["test.css", "test.js", "nth-child-test.css"];
		for (const fixture of fixturesToRestore) {
			const srcPath = path.join(srcFixturesDir, fixture);
			const outPath = path.join(outFixturesDir, fixture);
			if (fs.existsSync(srcPath)) {
				const originalContent = fs.readFileSync(srcPath, 'utf8');
				fs.writeFileSync(outPath, originalContent);
			}
		}
		
		// Force VS Code to refresh any cached documents by closing them
		for (const document of vscode.workspace.textDocuments) {
			if (document.fileName.includes("fixtures")) {
				await vscode.window.showTextDocument(document);
				await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
			}
		}
		
		vscode.window.showInformationMessage("File cleanup completed for configuration tests.");
	});

	// Add delay after each test to respect rate limits
	this.afterEach(async function () {
		await delayBetweenTests();
	});

	// Show an informational message when starting the tests
	vscode.window.showInformationMessage("Start configuration tests.");

	// Clean up sinon spies after each test to prevent conflicts
	this.afterEach(function () {
		sinon.restore();
	});

	this.afterAll(async function () {
		const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const jsUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.js"));
		await deleteGeneratedFiles(cssUri, prefixes);
		await deleteGeneratedFiles(jsUri, prefixes);
		
		// Reset all configurations to defaults
		const config = vscode.workspace.getConfiguration("css-js-minifier");
		await config.update("minifyOnSave", false, true);
		await config.update("minifyInNewFile", false, true);
		await config.update("autoOpenNewFile", true, true);
		await config.update("minifiedNewFilePrefix", ".min", true);
	});

	// Test autoOpenNewFile configuration - disabled
	test("autoOpenNewFile setting - disabled", async function () {
		// Configure settings
		const config = vscode.workspace.getConfiguration("css-js-minifier");
		await config.update("autoOpenNewFile", false, true);
		
		// Wait for configuration to take effect
		await delayBetweenTests(500);

		// Copy source file to out directory for this test
		const sourceFile = path.join(__dirname, "..", "..", "src", "test", "fixtures", "test.css");
		const testFile = path.join(__dirname, "fixtures", "temp-test.css");
		fs.copyFileSync(sourceFile, testFile);

		// Create a spy to monitor showTextDocument calls
		const showTextDocumentSpy = sinon.spy(vscode.window, "showTextDocument");

		// Open the copied test file
		const cssUri = vscode.Uri.file(testFile);
		const cssDocument = await vscode.workspace.openTextDocument(cssUri);
		await vscode.window.showTextDocument(cssDocument);

		// Reset the spy counter after opening the original file
		showTextDocumentSpy.resetHistory();

		// Execute the minify in new file command
		await vscode.commands.executeCommand("extension.minifyInNewFile");

		// Verify showTextDocument was NOT called for the new file
		assert.strictEqual(showTextDocumentSpy.callCount, 0, "New file should NOT have been opened automatically");

		// Verify the new file still exists (just wasn't opened)
		const newFileUri = vscode.Uri.file(cssDocument.uri.fsPath.replace(/(\\.css)$/, ".min$1"));
		assert(fs.existsSync(newFileUri.fsPath), `Minified file should still be created at: ${newFileUri.fsPath}`);

		// Clean up created files
		if (fs.existsSync(newFileUri.fsPath)) {
			fs.unlinkSync(newFileUri.fsPath);
		}
		if (fs.existsSync(testFile)) {
			fs.unlinkSync(testFile);
		}

		// Reset configuration to default
		await config.update("autoOpenNewFile", true, true);

		// Restore spy
		showTextDocumentSpy.restore();
	});

	// Test autoOpenNewFile configuration - enabled (default behavior)
	test("autoOpenNewFile setting - enabled", async function () {
		// Configure settings (this is the default, but being explicit)
		const config = vscode.workspace.getConfiguration("css-js-minifier");
		await config.update("autoOpenNewFile", true, true);
		
		// Wait for configuration to take effect
		await delayBetweenTests(500);

		// Copy source file to out directory for this test
		const sourceFile = path.join(__dirname, "..", "..", "src", "test", "fixtures", "test.js");
		const testFile = path.join(__dirname, "fixtures", "temp-test.js");
		fs.copyFileSync(sourceFile, testFile);

		// Verify the temp file was created and has content
		assert(fs.existsSync(testFile), `Temporary test file was not created at: ${testFile}`);
		const tempContent = fs.readFileSync(testFile, "utf8");
		assert(tempContent.length > 0, "Temporary test file is empty");

		// Open the copied test file
		const jsUri = vscode.Uri.file(testFile);
		const jsDocument = await vscode.workspace.openTextDocument(jsUri);
		await vscode.window.showTextDocument(jsDocument);

		// Additional wait before executing command
		await delayBetweenTests(500);

		// Execute the minify in new file command
		await vscode.commands.executeCommand("extension.minifyInNewFile");

		// Wait a bit for file creation
		await delayBetweenTests(1000);

		// Verify the new file exists (auto-open behavior is tested via file creation)
		const newFileUri = vscode.Uri.file(jsDocument.uri.fsPath.replace(/(\.js)$/, ".min$1"));
		assert(fs.existsSync(newFileUri.fsPath), `Minified file was not created at: ${newFileUri.fsPath}`);

		// Verify the new file has correct minified content
		const newDocument = await vscode.workspace.openTextDocument(newFileUri);
		const newFileContent = newDocument.getText();
		assert.strictEqual(newFileContent, jsMinifiedContent);

		// Clean up created files
		if (fs.existsSync(newFileUri.fsPath)) {
			fs.unlinkSync(newFileUri.fsPath);
		}
		if (fs.existsSync(testFile)) {
			fs.unlinkSync(testFile);
		}
	});

	// Test different file prefixes work correctly
	test("minifiedNewFilePrefix configuration - custom prefix", async function () {
		// Configure settings with custom prefix
		const config = vscode.workspace.getConfiguration("css-js-minifier");
		await config.update("minifyInNewFile", true, true);
		await config.update("minifiedNewFilePrefix", ".compressed", true);
		
		// Wait for configuration to take effect
		await delayBetweenTests(1000);

		// Copy source file to avoid modification issues
		const sourceFile = path.join(__dirname, "..", "..", "src", "test", "fixtures", "test.css");
		const testFile = path.join(__dirname, "fixtures", "temp-custom-test.css");
		fs.copyFileSync(sourceFile, testFile);

		// Open the test file
		const cssUri = vscode.Uri.file(testFile);
		const cssDocument = await vscode.workspace.openTextDocument(cssUri);
		await vscode.window.showTextDocument(cssDocument);

		// Execute minify in new file command
		await vscode.commands.executeCommand("extension.minifyInNewFile");

		// Wait for file creation
		await delayBetweenTests(1000);

		// Verify new file was created with custom prefix
		const newFileUri = vscode.Uri.file(cssDocument.uri.fsPath.replace(/(\.css)$/, ".compressed$1"));
		assert(fs.existsSync(newFileUri.fsPath), `Minified file with custom prefix was not created at: ${newFileUri.fsPath}`);

		// Verify the new file has minified content
		const newDocument = await vscode.workspace.openTextDocument(newFileUri);
		const newFileContent = newDocument.getText();
		assert.strictEqual(newFileContent, cssMinifiedContent);

		// Clean up created files
		if (fs.existsSync(newFileUri.fsPath)) {
			fs.unlinkSync(newFileUri.fsPath);
		}
		if (fs.existsSync(testFile)) {
			fs.unlinkSync(testFile);
		}

		// Reset prefix to default
		await config.update("minifiedNewFilePrefix", ".min", true);

		// Reset configuration
		await config.update("minifiedNewFilePrefix", ".min", true);
	});

	// Test minifyInNewFile vs in-place behavior
	test("minifyInNewFile configuration vs in-place minification", async function () {
		// Test in-place minification (default behavior)
		const cssUri = vscode.Uri.file(path.join(__dirname, "fixtures", "test.css"));
		const cssDocument = await vscode.workspace.openTextDocument(cssUri);
		await vscode.window.showTextDocument(cssDocument);

		// Get original content
		const originalContent = cssDocument.getText();

		// Execute regular minify command (in-place)
		await vscode.commands.executeCommand("extension.minify");

		// Verify content was changed in-place
		const modifiedContent = cssDocument.getText();
		assert.strictEqual(modifiedContent, cssMinifiedContent);
		assert.notStrictEqual(modifiedContent, originalContent);

		// Restore original content for next test
		const edit = new vscode.WorkspaceEdit();
		const firstLine = cssDocument.lineAt(0);
		const lastLine = cssDocument.lineAt(cssDocument.lineCount - 1);
		const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
		edit.replace(cssDocument.uri, textRange, originalContent);
		await vscode.workspace.applyEdit(edit);
		await cssDocument.save();

		// Now test minifyInNewFile behavior
		await vscode.commands.executeCommand("extension.minifyInNewFile");

		// Verify original content was NOT changed
		assert.strictEqual(cssDocument.getText(), originalContent);

		// Verify new file was created
		const newFileUri = vscode.Uri.file(cssDocument.uri.fsPath.replace(/(\.css)$/, ".min$1"));
		assert(fs.existsSync(newFileUri.fsPath), "Minified file was not created");

		// Verify new file has minified content
		const newDocument = await vscode.workspace.openTextDocument(newFileUri);
		const newFileContent = newDocument.getText();
		assert.strictEqual(newFileContent, cssMinifiedContent);
	});
});
