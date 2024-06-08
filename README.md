# CSS & JS Minifier Extension for VS Code

## Description

The Minifier extension for Visual Studio Code allows you to minify CSS and JavaScript files directly from the editor. Using the minification service provided by [Toptal](https://www.toptal.com/developers/), this extension makes it quick and easy to optimize your files.

## Key Features

- **CSS and JavaScript Minification**: Minify open CSS and JS files in the editor using commands from the command palette or the context menu.
- **Minify to New File**: Save the minified file to a new file with the `.min` suffix (e.g., `file.min.css` or `file.min.js`).
- **Automatic Minification on Save**: Configure the extension to automatically minify CSS and JS files when saving them.
- **Intuitive Commands**: Easily access minification features through the command palette and the editor's context menu.

## Available Commands

- `Minify`: Minifies the current CSS or JS file and overwrites its content.
- `Minify and Save as New File`: Minifies the current CSS or JS file and saves the result to a new file with the `.min` suffix.

## Configuration

You can customize the extension's behavior through the available settings in VS Code:

- `minifier.minifyOnSave`: Automatically minify CSS and JS files when saving them. (`true` or `false`, default is `false`).
- `minifier.minifyInNewFile`: Save the minified content to a new file instead of overwriting the original. (`true` or `false`, default is `false`).

To adjust these settings, add the following lines to your `settings.json` file:

```json
{
  "minifier.minifyOnSave": true,
  "minifier.minifyInNewFile": true
}
