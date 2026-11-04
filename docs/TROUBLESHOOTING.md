# Troubleshooting and reporting a bug

What to try when something does not work, what each message means, and how to report a bug.

Try the short checklist first, check the message you see in the table below, and if you are still stuck, report it with the details listed at the end. A good report is the fastest way to a fix.

## Try this first

1. **Update the extension.** Open the Extensions view, click the extension and look for an **Update** button. See [Install](INSTALL.md#update). Also update VS Code if you can.
2. **Reload the window.** Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`), type `Reload Window` and run **Developer: Reload Window**.
3. **Check the file language.** Look at the bottom right of the VS Code window. It must say **CSS** or **JavaScript**. If it says something else, click it, or run **Change Language Mode** from the Command Palette, and pick the right one. The commands and menu entries only work for these two languages.
4. **Check the file is editable.** The keyboard shortcuts only work when the cursor is in the editor and the file is not read-only.
5. **Check the settings.** Open Settings (`Ctrl+,` or `Cmd+,`) and search for `css-js-minifier`. Make sure nothing is set in a way you did not expect, and remember that workspace settings override user settings. See [Configuration](CONFIGURATION.md).
6. **Try a tiny file.** Paste the sample from the [Quick start](QUICK-START.md) into a new file named `style.css`. If that works, the problem is something in your file.
7. **Read the extension log.** Open **View > Output** and choose **CSS & JS Minifier** in the drop-down on the right of the panel. If the extension started, it prints `[INFO] CSS & JS Minifier extension activated successfully.`

## Messages you may see

| Message | What it means and what to do |
| --- | --- |
| `File type '<language>' is not supported. Only CSS and JavaScript files can be minified.` | The file is not in CSS or JavaScript language mode. Change the language (step 3 above) or use a different file. SCSS, Less, TypeScript and JSX are not supported. |
| `Cannot minify empty css file. Please add some content first.` (or `javascript`) | The file has no content. Add some and try again. |
| `CSS minification error: ...` or `JavaScript minification error: ...` | The code has a syntax error the minifier cannot read. Your file was not changed. Fix the code at the place the message points to. See [Examples](EXAMPLES.md#when-the-code-has-an-error). |
| `Please save the file to disk before using 'Minify and Save as New File'. ...` | The file is new and has never been saved, so there is no folder to put the copy in. Save the file (`Ctrl+S` or `Cmd+S`) and run the command again. |
| `Failed to open file: ...` | The file chosen in the Explorer could not be opened. Check that it still exists and that you can read it. |
| `CSS & JS Minifier failed to activate: ... Check the Output panel for details.` | The extension could not start. Open the **CSS & JS Minifier** output (step 7 above) and include it in a report. If you installed from a `.vsix` file, make sure it is the right one for your system, see [Install](INSTALL.md#step-1-download-the-right-file). |

## Other things people run into

- **The commands are missing from the right-click menu.** They only show for CSS and JavaScript files. Check the language (step 3).
- **Minify on save does nothing after I turned it on.** Reload the window. The extension reads that setting only when it starts.
- **The shortcut does nothing.** Check the [shortcuts table](COMMANDS-AND-SHORTCUTS.md#keyboard-shortcuts) for your system. Another extension may use the same keys: open the Keyboard Shortcuts editor (`Ctrl+K Ctrl+S` or `Cmd+K Cmd+S`), search for `minify`, and look for a conflict. You can also run the command from the Command Palette.
- **My file was minified and I want it back.** Press `Ctrl+Z` or `Cmd+Z` in the editor, then save. If that is too late, restore it from version control.
- **It is not installable on my system.** Windows, macOS and standard Linux (glibc) are covered. Alpine Linux is not yet, see [Install](INSTALL.md#step-1-download-the-right-file).

## Report a bug

Open a bug report on GitHub: [new bug report](https://github.com/miguelcolmenares/css-js-minifier/issues/new?template=bug_report.yml). You need a free GitHub account. The form asks for the items below, so it helps to have them ready.

Please include:

1. **Extension version.** In the Extensions view, click the extension. The version is next to its name.
2. **VS Code version.** **Help > About** on Windows and Linux, **Code > About Visual Studio Code** on macOS. Use the **Copy** button in that dialog to copy the details.
3. **Operating system and architecture.** For example Windows 11 x64, macOS 15 on Apple silicon, Ubuntu 24.04 ARM. The **OS** line in the About dialog shows it.
4. **Steps to reproduce.** What you clicked or pressed, in order, starting from opening the file.
5. **A minimal sample file.** The smallest CSS or JavaScript that shows the problem. Remove anything private first.
6. **What you expected, and what happened instead.** The exact text of any error message helps most.
7. **Your settings.** Copy the `css-js-minifier.*` lines from your `settings.json`, or say that you use the defaults.
8. **The extension log.** The text from the **CSS & JS Minifier** output (step 7 above), if there is any.

You can paste this into the report and fill it in:

```text
Extension version:
VS Code version:
Operating system and architecture:
File type: CSS / JavaScript
Steps to reproduce:
1.
2.
Expected:
Actual (include the exact message):
Settings (css-js-minifier.*):
Sample file (smallest example that shows it):
```

## Ask a question or suggest something

- **A question about how to use the extension:** open a [question](https://github.com/miguelcolmenares/css-js-minifier/issues/new?template=question.yml).
- **An idea or a missing feature:** open a [feature request](https://github.com/miguelcolmenares/css-js-minifier/issues/new?template=feature_request.yml).
- **Something wrong or missing in this guide:** open a [documentation issue](https://github.com/miguelcolmenares/css-js-minifier/issues/new?template=documentation.yml).

Before you open a new one, search the [existing issues](https://github.com/miguelcolmenares/css-js-minifier/issues). Someone may have asked the same thing.

## Report a security problem

Do not post it in a public issue. Use GitHub's private reporting instead: [report a vulnerability privately](https://github.com/miguelcolmenares/css-js-minifier/security/advisories/new). Only the project maintainers can see it.

## Want to help fix it?

Contributions are welcome. Start with [CONTRIBUTING.md](../CONTRIBUTING.md) and the pages for contributors on this site, beginning with the [documentation index](README.md).
