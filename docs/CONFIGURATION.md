# Configuration

The five settings of the extension, what each one does, and ready-to-copy `settings.json` snippets for common setups.

You do not need to change any setting to use the extension. This page also shows how to open the settings on every system.

## The settings

| Setting | Default | What it does |
| --- | --- | --- |
| `css-js-minifier.minifyOnSave` | `false` | Minify CSS and JavaScript files automatically every time you save them. |
| `css-js-minifier.minifyInNewFile` | `false` | Only matters together with `minifyOnSave`. When on, saving writes a minified copy to a new file and leaves your file as it is. When off, saving replaces the content of your file with the minified version. |
| `css-js-minifier.minifiedNewFilePrefix` | `.min` | The text added before the file extension in the name of the new file. The Settings screen offers `.min`, `-min`, `.compressed`, `-compressed`, `.minified` and `-minified`. In `settings.json` you can also write your own, such as `.mini`, as long as it follows the rules below. |
| `css-js-minifier.autoOpenNewFile` | `true` | Open the new minified file in the editor after it is created. |
| `css-js-minifier.showSizeReduction` | `true` | Include the sizes and the percentage in the success message. When off, the message only says the file was minified. |

Good to know:

- `minifyInNewFile` does not change the two commands. **Minify this File** always replaces the content of the file, and **Minify and Save as New File** always writes a new file, whatever this setting says.
- `minifiedNewFilePrefix` is used for the new file name by the **Minify and Save as New File** command and by minify on save with `minifyInNewFile` on. With `.min`, `style.css` becomes `style.min.css`. With `-compressed`, `app.js` becomes `app-compressed.js`. The text goes before the last extension, so `module.mjs` becomes `module.min.mjs`.
- `minifiedNewFilePrefix` accepts 1 to 32 characters, and only letters (`a` to `z`, `A` to `Z`), digits, `.`, `-` and `_`. It cannot contain `/`, `\`, spaces or `..`, because the text becomes part of a file name and must not move the file to another folder. Any other value, including an empty one, is refused: nothing is written, the original file is left as it is, and an error names the setting and the value it found. There is no automatic fallback to `.min`, so you notice and fix it. With minify on save the error appears once for each wrong value until you reload the window, not on every save.
- With `minifyOnSave` on and `minifyInNewFile` off, no success message is shown, because it would pop up on every save.
- Change `minifyOnSave` and then reload the window (open the Command Palette and run **Developer: Reload Window**). The extension reads this setting only when it starts. The other four take effect right away.

> [!WARNING]
> With `minifyOnSave` on and `minifyInNewFile` off, every save overwrites your source file with the minified version. Undoing and saving again minifies it again. If you want to keep readable source, also turn on `minifyInNewFile`, or keep your sources in Git.

## Change the settings

### With the Settings screen

1. Open Settings: press `Ctrl+,` on Windows and Linux or `Cmd+,` on macOS. You can also open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run **Preferences: Open Settings**.
2. Type `css-js-minifier` in the search box.
3. The settings appear under **JS & CSS Minifier Tool Configuration**. Tick the boxes or pick a value from the list.

### With settings.json

Settings are saved in a file called `settings.json`. To open it, open the Command Palette and run **Preferences: Open User Settings (JSON)**. Add the lines you want inside the curly braces. Where that file lives:

| System | User `settings.json` |
| --- | --- |
| Windows | `%APPDATA%\Code\User\settings.json` |
| macOS | `$HOME/Library/Application Support/Code/User/settings.json` |
| Linux | `$HOME/.config/Code/User/settings.json` |

### User settings or workspace settings

- **User settings** apply everywhere, in every project you open.
- **Workspace settings** apply only to the project (the folder) that is open, and win over user settings for the same setting. They are stored in `.vscode/settings.json` inside the project, so you can share them with your team. Open them with **Preferences: Open Workspace Settings (JSON)**, or choose the **Workspace** tab in the Settings screen.

All five settings can be set in either place. More in the official [User and workspace settings guide](https://code.visualstudio.com/docs/configure/settings).

## Settings you can copy

Put the lines inside the main `{ }` of your `settings.json`. If the file already has other settings, add a comma between entries.

### Minify every time I save, keeping a copy

Your file stays as you wrote it. A `.min` file next to it is rewritten on every save, and it does not open by itself:

```json
{
  "css-js-minifier.minifyOnSave": true,
  "css-js-minifier.minifyInNewFile": true,
  "css-js-minifier.autoOpenNewFile": false
}
```

Remember to reload the window after changing `minifyOnSave`.

### Minify every time I save, replacing my file

```json
{
  "css-js-minifier.minifyOnSave": true
}
```

Use this only if your project builds from somewhere else or the sources are safe in version control.

### A different name for the new file

New files named `style-min.css` instead of `style.min.css`:

```json
{
  "css-js-minifier.minifiedNewFilePrefix": "-min"
}
```

### Keep the messages short

```json
{
  "css-js-minifier.showSizeReduction": false
}
```

### One project only

Create or open `.vscode/settings.json` in that project (or use **Preferences: Open Workspace Settings (JSON)**) and add the lines there. Other projects keep their own settings.

## All the defaults together

```json
{
  "css-js-minifier.minifyOnSave": false,
  "css-js-minifier.minifyInNewFile": false,
  "css-js-minifier.minifiedNewFilePrefix": ".min",
  "css-js-minifier.autoOpenNewFile": true,
  "css-js-minifier.showSizeReduction": true
}
```
