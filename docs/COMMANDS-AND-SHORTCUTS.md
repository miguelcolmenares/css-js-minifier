# Commands and keyboard shortcuts

The two commands of the extension, every place to find them in VS Code, and the keyboard shortcuts for Windows, Linux and macOS.

This page also shows how to change the keys.

## The two commands

| Command (the name you see) | What it does | Command ID |
| --- | --- | --- |
| **Minify this File** | Replaces the content of the file with its minified version and saves the file. | `extension.minify` |
| **Minify and Save as New File** | Writes the minified version to a new file next to the original, for example `style.css` becomes `style.min.css`. The original is not changed. | `extension.minifyInNewFile` |

Both work on CSS and JavaScript files, and only on those. The command ID is what you use if you want to [change a shortcut](#change-a-shortcut).

## Keyboard shortcuts

| Command | Windows and Linux | macOS |
| --- | --- | --- |
| Minify this File | `Ctrl+Alt+M` | `Control+Option+M` (written ⌃⌥M) |
| Minify and Save as New File | `Ctrl+Alt+N` | `Control+Option+N` (written ⌃⌥N) |

The shortcuts work when the cursor is in an editor and the file is not read-only. They do not depend on the file type, so pressing one in a file that is not CSS or JavaScript shows an error message instead of doing something.

On a Mac, the `Control` key is the one marked `control` or `ctrl`, not the Command key.

## From the editor

Right-click anywhere inside an open CSS or JavaScript file. Both commands are in the menu, next to each other.

The menu entries only appear when the file is a CSS or JavaScript file. If you do not see them, check the language shown in the bottom right of the window, see [Troubleshooting](TROUBLESHOOTING.md).

## From the Explorer

Right-click a CSS or JavaScript file in the Explorer (the file list on the left side) and choose one of the two commands. The file does not need to be open. One file at a time is minified, the one you right-click.

## From the Command Palette

The Command Palette runs any command by name.

1. Open it with `Ctrl+Shift+P` on Windows and Linux, or `Cmd+Shift+P` on macOS.
2. Type `Minify`.
3. Choose **Minify this File** or **Minify and Save as New File**, and press `Enter`.

The command runs on the file you were last editing.

## Change a shortcut

You can use different keys, or remove the default ones. This is a normal VS Code feature, described in the official [Keyboard Shortcuts guide](https://code.visualstudio.com/docs/configure/keybindings).

### With the Keyboard Shortcuts editor

1. Open it with `Ctrl+K Ctrl+S` (press `Ctrl+K`, release, then press `Ctrl+S`) on Windows and Linux, or `Cmd+K Cmd+S` on macOS. You can also run **Preferences: Open Keyboard Shortcuts** from the Command Palette.
2. Type `minify` in the search box. You see both commands with their keys.
3. Double-click the entry, press the new keys, and press `Enter`.
4. To remove a shortcut, right-click the entry and choose **Remove Keybinding**.

If another extension or VS Code already uses the same keys, the editor shows the conflict.

### With keybindings.json

In the Keyboard Shortcuts editor, click the **Open Keyboard Shortcuts (JSON)** button at the top right. Add your entries to the list. This example turns off the default shortcut of **Minify this File** and puts it on `Ctrl+Alt+X` (`Control+Option+X` on macOS) instead:

```json
[
  {
    "key": "alt+ctrl+m",
    "command": "-extension.minify"
  },
  {
    "key": "alt+ctrl+x",
    "command": "extension.minify",
    "when": "editorTextFocus && !editorReadonly"
  }
]
```

The minus sign in front of the command ID (`-extension.minify`) removes the default shortcut. The `when` line is the same condition the extension uses itself. Without it the shortcut also works in places where it makes little sense, such as read-only editors.

In this file, `alt` is the Alt key on Windows and Linux and the Option key on macOS, and `ctrl` is Control on every system.
