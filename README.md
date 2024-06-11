# CSS & JS Minifier Extension for VS Code

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/miguel-colmenares.css-js-minifier?style=flat-square)
![GitHub License](https://img.shields.io/github/license/miguelcolmenares/css-js-minifier?style=flat-square)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/miguelcolmenares/css-js-minifier/master.yml?style=flat-square)
![Install Extension](https://img.shields.io/badge/Install_extension-blue?style=flat-square&link=vscode%3Aextension%2Fmiguel-colmenares.css-js-minifier)

## Description

The CSS & JS Minifier extension for Visual Studio Code allows you to minify CSS and JavaScript files directly from the editor. Using the minification service provided by [Toptal](https://www.toptal.com/developers/), this extension makes it quick and easy to optimize your files.

## Demostation
Minify File through context menu

![Minify File through context menu](images/minify.gif)

Minify and Save as New File through context menu

![Minify and Save as New File through context menu](images/minify-and-save-as-new-file.gif)


## Key Features

-   **CSS and JavaScript Minification**: Minify open CSS and JS files in the editor using commands from the command palette or the context menu.
-   **Minify to New File**: Save the minified file to a new file with the `.min` suffix (e.g., `file.min.css` or `file.min.js`).
-   **Automatic Minification on Save**: Configure the extension to automatically minify CSS and JS files when saving them.
-   **Intuitive Commands**: Easily access minification features through the command palette and the editor's context menu.

## Available Commands

-   `Minify`: Minifies the current CSS or JS file and overwrites its content.
-   `Minify and Save as New File`: Minifies the current CSS or JS file and saves the result to a new file with the `.min` suffix.

## Configuration

You can customize the extension's behavior through the available settings in VS Code:

-   `css-js-minifier.minifyOnSave`: Automatically minify CSS and JS files when saving them. (`true` or `false`, default is `false`).
-   `css-js-minifier.minifyInNewFile`: Save the minified content to a new file instead of overwriting the original. (`true` or `false`, default is `false`).
-   `css-js-minifier.minifiedNewFilePrefix`: Specify a custom prefix for the new minified file. (default is `.min`).

To adjust these settings, add the following lines to your `settings.json` file:

```json
{
	"css-js-minifier.minifyOnSave": true,
	"css-js-minifier.minifyInNewFile": true,
	"css-js-minifier.minifiedNewFilePrefix": ".min"
}
```

## Keyboard Shortcuts

The extension provides convenient keyboard shortcuts for quick access to its commands:

-   `Minify`:
    -   `Ctrl+Shift+M` (Windows/Linux)
    -   `Cmd+Shift+M` (Mac)
-   `Minify and Save as New File`:
    -   `Ctrl+Shift+Alt+M` (Windows/Linux)
    -   `Cmd+Shift+Alt+M` (Mac)

## Installation

1. Open VS Code.
2. Go to the Extensions view by clicking the Extensions icon in the Activity Bar on the side of the window or by pressing `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for "`CSS & JS Minifier`".
4. Click Install.

## Usage

1. Open a CSS or JS file in VS Code.
2. Use the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and type Minify to access the minification commands.
3. Alternatively, right-click within the editor and select the desired minification option from the context menu.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on the [GitHub repository](https://github.com/miguelcolmenares/css-js-minifier.git).

## License

This extension is licensed under the [MIT License](LICENSE.md).
