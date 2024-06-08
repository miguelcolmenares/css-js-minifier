import * as vscode from "vscode"; // Importa el módulo vscode

/**
 * Activates the extension.
 * @param {vscode.ExtensionContext} context - The extension context.
 */
export function activate(context: vscode.ExtensionContext): void {
	// Registra el comando de minificación
	const minifyCommand = vscode.commands.registerCommand("extension.minify", async () => {
		// Obtiene el editor de texto activo
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document; // Obtiene el documento activo
			const fileType = document.languageId; // Obtiene el tipo de archivo (css o javascript)
			const text = document.getText(); // Obtiene el texto del documento

			const minifiedText = await minifyText(text, fileType); // Minifica el texto
			if (minifiedText) {
				const edit = new vscode.WorkspaceEdit(); // Crea una nueva edición de trabajo
				const firstLine = document.lineAt(0); // Obtiene la primera línea del documento
				const lastLine = document.lineAt(document.lineCount - 1); // Obtiene la última línea del documento
				const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end); // Crea un rango que abarca todo el documento
				edit.replace(document.uri, textRange, minifiedText); // Reemplaza el contenido del documento con el texto minificado
				await vscode.workspace.applyEdit(edit); // Aplica la edición al documento
				await document.save(); // Guarda el documento
			}
		}
	});

	// Registra el comando para minificar y guardar en un nuevo archivo
	const minifyInNewFileCommand = vscode.commands.registerCommand("extension.minifyInNewFile", async () => {
		// Obtiene el editor de texto activo
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document; // Obtiene el documento activo
			const fileType = document.languageId; // Obtiene el tipo de archivo (css o javascript)
			const text = document.getText(); // Obtiene el texto del documento
			const fileName = document.fileName; // Obtiene el nombre del archivo
			const minifiedText = await minifyText(text, fileType); // Minifica el texto
			if (minifiedText) {
				const newFileName = fileName.replace(/(\.css|\.js)$/, ".min$1"); // Crea un nuevo nombre de archivo con el sufijo .min
				const uri = vscode.Uri.file(newFileName); // Crea una nueva URI para el archivo minificado
				await vscode.workspace.fs.writeFile(uri, Buffer.from(minifiedText, "utf8")); // Escribe el texto minificado en el nuevo archivo
				vscode.window.showTextDocument(uri); // Abre el nuevo archivo en el editor
			}
		}
	});

	// Agrega los comandos al contexto de suscripciones para que se limpien al desactivar la extensión
	context.subscriptions.push(minifyCommand);
	context.subscriptions.push(minifyInNewFileCommand);

	// Si la configuración minifyOnSave está habilitada, se agrega un listener para minificar al guardar
	if (vscode.workspace.getConfiguration("css-js-minifier").get("minifyOnSave")) {
		vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
			const fileType = document.languageId; // Obtiene el tipo de archivo
			if (fileType === "css" || fileType === "javascript") {
				// Verifica si el archivo es CSS o JS
				const text = document.getText(); // Obtiene el texto del documento
				const minifiedText = await minifyText(text, fileType); // Minifica el texto
				if (minifiedText) {
					const edit = new vscode.WorkspaceEdit(); // Crea una nueva edición de trabajo
					const firstLine = document.lineAt(0); // Obtiene la primera línea del documento
					const lastLine = document.lineAt(document.lineCount - 1); // Obtiene la última línea del documento
					const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end); // Crea un rango que abarca todo el documento
					edit.replace(document.uri, textRange, minifiedText); // Reemplaza el contenido del documento con el texto minificado
					await vscode.workspace.applyEdit(edit); // Aplica la edición al documento
					await document.save(); // Guarda el documento
				}
			}
		});
	}
}

/**
 * Minifies the given text based on the file type.
 * @param {string} text - The text to be minified.
 * @param {string} fileType - The type of the file ('css' or 'javascript').
 * @returns {Promise<string | null>} The minified text, or null if an error occurs.
 */
async function minifyText(text: string, fileType: string): Promise<string | null> {
	// Define la URL del API según el tipo de archivo
	const apiUrl =
		fileType === "css"
			? "https://www.toptal.com/developers/cssminifier/api/raw"
			: "https://www.toptal.com/developers/javascript-minifier/api/raw";

	try {
		// Realiza la petición POST al API para minificar el texto
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({ input: text }), // Envía el texto a minificar como parámetro
		});

		// Verifica si la respuesta es válida
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`); // Lanza un error si la respuesta no es válida
		}

		const minifiedText = await response.text(); // Obtiene el texto minificado de la respuesta
		return minifiedText; // Retorna el texto minificado
	} catch (error: any) {
		// Muestra un mensaje de error en caso de que ocurra un problema
		vscode.window.showErrorMessage(`Error minifying ${fileType}: ${error.message}`);
		return null; // Retorna null si ocurre un error
	}
}

/**
 * Deactivates the extension.
 */
export function deactivate(): void {
	// Función vacía, pero necesaria para cumplir con la interfaz del ciclo de vida de las extensiones
}
