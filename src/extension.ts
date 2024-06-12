import * as vscode from "vscode"; // Import the vscode module

/**
 * Activates the extension.
 * @param {vscode.ExtensionContext} context - The extension context.
 */
export function activate(context: vscode.ExtensionContext): void {
	// Register the minify command
	const minifyCommand = vscode.commands.registerCommand("extension.minify", async () => {
		const editor = vscode.window.activeTextEditor; // Get the active text editor
		const explorer = vscode.window.activeTextEditor?.document.uri; // Get the selected file in the file explorer

		if (editor) {
			const document = editor.document; // Get the active document
			const fileType = document.languageId; // Get the file type (css or javascript)
			const text = document.getText(); // Get the document text

			if (validateFileType(fileType) && validateContentLength(text, fileType)) {
				const minifiedText = await getMinifiedText(text, fileType); // Minify the text
				if (minifiedText) {
					await minifyDocument(document, minifiedText);
				}
			}
		}

		if (explorer) {
			const document = await vscode.workspace.openTextDocument(explorer); // Open the document from explorer
			const fileType = document.languageId; // Get the file type (css or javascript)
			const text = document.getText(); // Get the document text

			if (validateFileType(fileType) && validateContentLength(text, fileType)) {
				const minifiedText = await getMinifiedText(text, fileType); // Minify the text
				if (minifiedText) {
					await minifyDocument(document, minifiedText);
				}
			}
		}
	});

	// Register the command to minify and save in a new file
	const minifyInNewFileCommand = vscode.commands.registerCommand("extension.minifyInNewFile", async () => {
		const editor = vscode.window.activeTextEditor; // Get the active text editor
		const explorer = vscode.window.activeTextEditor?.document.uri; // Get the selected file in the file explorer
		const settings = vscode.workspace.getConfiguration("css-js-minifier"); // Get the extension settings
		const filePrefix = settings.get("minifiedNewFilePrefix"); // Get the prefix for the new file

		if (editor) {
			const document = editor.document; // Get the active document
			const fileType = document.languageId; // Get the file type (css or javascript)
			const text = document.getText(); // Get the document text

			if (validateFileType(fileType) && validateContentLength(text, fileType)) {
				const fileName = document.fileName; // Get the file name
				const minifiedText = await getMinifiedText(text, fileType); // Minify the text
				if (minifiedText) {
					const newFileName = fileName.replace(/(\.css|\.js)$/, `${filePrefix}$1`); // Create a new file name with the specified suffix
					await minifyInNewFile(minifiedText, newFileName);
				}
			}
		}

		if (explorer) {
			const document = await vscode.workspace.openTextDocument(explorer); // Open the document from explorer
			const fileType = document.languageId; // Get the file type (css or javascript)
			const text = document.getText(); // Get the document text

			if (validateFileType(fileType) && validateContentLength(text, fileType)) {
				const fileName = document.fileName; // Get the file name
				const minifiedText = await getMinifiedText(text, fileType); // Minify the text
				if (minifiedText) {
					const newFileName = fileName.replace(/(\.css|\.js)$/, `${filePrefix}$1`); // Create a new file name with the specified suffix
					await minifyInNewFile(minifiedText, newFileName);
				}
			}
		}
	});

	// Add commands to the context subscriptions to clean them up on extension deactivation
	context.subscriptions.push(minifyCommand);
	context.subscriptions.push(minifyInNewFileCommand);

	// Add a listener to minify on save if the minifyOnSave configuration is enabled
	if (vscode.workspace.getConfiguration("css-js-minifier").get("minifyOnSave")) {
		vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
			const fileType = document.languageId; // Get the file type
			if (fileType === "css" || fileType === "javascript") {
				const text = document.getText(); // Get the document text

				if (validateContentLength(text, fileType)) {
					const minifiedText = await getMinifiedText(text, fileType); // Minify the text
					if (minifiedText) {
						await minifyDocument(document, minifiedText);
					}
				}
			}
		});
	}
}

/**
 * Minifies the given text based on the file type.
 * @function getMinifiedText
 * @param {string} text - The text to be minified.
 * @param {string} fileType - The type of the file ('css' or 'javascript').
 * @returns {Promise<string | null>} The minified text, or null if an error occurs.
 */
async function getMinifiedText(text: string, fileType: string): Promise<string | null> {
	// Define the API URL based on the file type
	const apiUrl =
		fileType === "css"
			? "https://www.toptal.com/developers/cssminifier/api/raw"
			: "https://www.toptal.com/developers/javascript-minifier/api/raw";

	try {
		// Perform a POST request to the API to minify the text
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({ input: text }), // Send the text to be minified as a parameter
		});

		// Check if the response is valid
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`); // Throw an error if the response is not valid
		}

		const minifiedText = await response.text(); // Get the minified text from the response
		return minifiedText; // Return the minified text
	} catch (error: any) {
		// Show an error message if something goes wrong
		vscode.window.showErrorMessage(`Error minifying ${fileType}: ${error.message}`);
		return null; // Return null if an error occurs
	}
}

/**
 * Saves the given text as a minified new file.
 * @function minifyInNewFile
 * @async
 * @param {string} minifiedText - The minified text to be saved.
 * @param {string} newFileName - The name of the new file.
 * @returns {Promise<void>} A promise that resolves when the file is saved.
 */
async function minifyInNewFile(minifiedText: string, newFileName: string): Promise<void> {
	const uri = vscode.Uri.file(newFileName); // Create a new URI for the minified file
	await vscode.workspace.fs.writeFile(uri, Buffer.from(minifiedText, "utf8")); // Write the minified text to the new file
	vscode.window.showTextDocument(uri); // Open the new file in the editor
	vscode.window.showInformationMessage("The file has been minified and saved."); // Show an information message
}

/**
 * Minifies the given document with the minified text.
 * @function minifyDocument
 * @async
 * @param {vscode.TextDocument} document - The document to be minified.
 * @param {string} minifiedText - The minified text.
 * @returns {Promise<void>} A promise that resolves when the document is minified and saved.
 */
async function minifyDocument(document: vscode.TextDocument, minifiedText: string): Promise<void> {
	const edit = new vscode.WorkspaceEdit(); // Create a new workspace edit
	const firstLine = document.lineAt(0); // Get the first line of the document
	const lastLine = document.lineAt(document.lineCount - 1); // Get the last line of the document
	const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end); // Create a range covering the whole document
	edit.replace(document.uri, textRange, minifiedText); // Replace the document content with the minified text
	await vscode.workspace.applyEdit(edit); // Apply the edit to the document
	await document.save(); // Save the document
	vscode.window.showInformationMessage("The file has been minified."); // Show an information message
}

/**
 * Validates if the file type is css or javascript.
 * @function isValidFileType
 * @param {string} fileType - The file type.
 * @returns {boolean} - True if the file type is valid, otherwise false.
 */
function isValidFileType(fileType: string): boolean {
	return fileType === "css" || fileType === "javascript";
}

/**
 * Validates if the file type is css or javascript.
 * Shows an error message if the file type is not valid.
 * @function validateFileType
 * @param {string} fileType - The file type.
 * @returns {boolean} - True if the file type is valid, otherwise false.
 */
function validateFileType(fileType: string): boolean {
	if (!isValidFileType(fileType)) {
		vscode.window.showErrorMessage("The file type is not supported.");
		return false;
	}
	return true;
}

/**
 * Validates if the content length is greater than 0.
 * Shows an error message if the content length is 0.
 * @function validateContentLength
 * @param {string} text - The text content.
 * @param {string} fileType - The file type.
 * @returns {boolean} - True if the content length is valid, otherwise false.
 */
function validateContentLength(text: string, fileType: string): boolean {
	if (text.length === 0) {
		vscode.window.showErrorMessage(`The ${fileType} file is empty.`);
		return false;
	}
	return true;
}

/**
 * Deactivates the extension.
 */
export function deactivate(): void {
	// Empty function, but required to comply with the extension lifecycle interface
}
