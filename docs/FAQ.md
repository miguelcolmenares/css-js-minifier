# Frequently asked questions

Short answers to the questions people ask most about CSS & JS Minifier.

Each answer comes from how the extension actually works. If yours is not here, see [Troubleshooting](TROUBLESHOOTING.md) for how to ask.

## What can it minify?

CSS and JavaScript files, and only those. It goes by the language VS Code shows for the file (bottom right of the window): **CSS** or **JavaScript**.

- Not supported: SCSS, Less, TypeScript, JSX and TSX (**JavaScript React**), HTML, JSON and any other language. You get the message `File type '<language>' is not supported. Only CSS and JavaScript files can be minified.`
- JavaScript is read as plain JavaScript. A file with JSX or TypeScript syntax in it shows a minification error.
- One file at a time. There is no command to minify a whole folder.

## Does it work offline? Does it send my code anywhere?

It works fully offline and sends nothing anywhere. Minification runs on your computer, on the text of the file. The extension's source code contains no network calls, no account and no API key.

## Does it change my original file?

It depends on the command:

- **Minify this File** replaces the content of the file and saves it.
- **Minify and Save as New File** writes a new file (for example `style.min.css`) and does not touch the original.

To undo **Minify this File**, press `Ctrl+Z` (Windows and Linux) or `Cmd+Z` (macOS), then save again. See the [Quick start](QUICK-START.md). If you use minify on save, saving minifies again, so turn it off first or keep your sources in version control such as Git.

## What happens if my code has a syntax error?

Nothing is changed. You see an error message such as `JavaScript minification error: Unexpected token`, and your file stays exactly as it was. Some small mistakes in CSS are accepted, for example a rule missing its last `}` is closed for you. See [Examples](EXAMPLES.md#when-the-code-has-an-error).

## Is there a file size limit? What about an empty file?

The extension sets no size limit. A very large file is limited only by your computer's memory. An empty file shows `Cannot minify empty css file. Please add some content first.` (or `javascript` in place of `css`).

## Will it break my JavaScript?

The extension renames variables that are local to a function, and it leaves names at the top level of the file alone, so other scripts that call your functions keep working. As with any minifier, test your site after minifying. The original is easy to get back if you used the new-file command or version control.

## How do I minify automatically on save?

Turn on the `css-js-minifier.minifyOnSave` setting, and reload the window. See [Configuration](CONFIGURATION.md) for ready-to-copy settings, including a version that keeps your original file and writes a `.min` copy.

## Can I change the name of the new file?

Yes. The `css-js-minifier.minifiedNewFilePrefix` setting gives six choices: `.min`, `-min`, `.compressed`, `-compressed`, `.minified` and `-minified`. In `settings.json` you can also write your own, made of letters, digits, `.`, `-` and `_`. See [Configuration](CONFIGURATION.md).

The text is added before the last extension of the file name, whatever it is and in whichever letter case: `style.css` becomes `style.min.css`, `module.mjs` becomes `module.min.mjs`, `common.cjs` becomes `common.min.cjs` and `APP.JS` becomes `APP.min.JS`. A name with no extension, such as `Makefile`, gets the text at the end (`Makefile.min`). The new file is never given the same name as the original, and the extension refuses to write a file over the one it is minifying.

## Does it work in Remote SSH, WSL, Dev Containers or virtual workspaces?

The project's automated tests run on desktop VS Code on macOS, Ubuntu and Windows. Remote setups are not part of them, so treat this answer as what is known, not a promise:

- In a remote window (SSH, WSL, a container), install the extension in that remote window too. VS Code normally runs an extension like this one on the remote machine, so it needs a package for the remote's system. Windows, macOS, and standard glibc Linux packages exist for Intel/AMD and ARM.
- Alpine Linux, common in small Dev Container images, has no package in the current release (1.3.4). Alpine packages are already built for the next one, see [issue #244](https://github.com/miguelcolmenares/css-js-minifier/issues/244).
- Virtual workspaces (a repository opened without cloning it) are not declared as supported or unsupported, and **Minify and Save as New File** may write to the wrong place there. This is tracked in [issue #243](https://github.com/miguelcolmenares/css-js-minifier/issues/243).

## Why are there several downloads for each version?

The extension contains fast native code, and native code is different for each type of computer. So each release has one package for each system: Windows, macOS and Linux, each for Intel/AMD and for ARM. VS Code picks the right one for you when you install from the Marketplace. You only choose by hand when you download a `.vsix` file, see [Install](INSTALL.md#route-3-a-downloaded-vsix-file-offline-or-manual).

## Marketplace or Open VSX, what is the difference?

They are two places to get the same extension. The VS Code Marketplace is the one VS Code uses. Open VSX is the registry used by VSCodium, Eclipse Theia, Gitpod and other forks. The extension is published on both, from the same files, so use whichever your editor reads. See [Install](INSTALL.md).

## Which VS Code versions work?

VS Code 1.144.0 or newer. The project's tests run on that minimum version, on the current stable release, and on Insiders.

## Can I use it in another language?

The extension follows the display language of VS Code. It is available in English, Spanish, French, German, Portuguese (Brazil), Japanese and Simplified Chinese. To change the display language:

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2. Type `display` and choose **Configure Display Language**.
3. Pick your language (VS Code installs its language pack if needed) and restart VS Code when asked.

The command names, the messages and the settings descriptions then appear in that language. This site is only in English.

## Is it free?

Yes. It is open source under the [MIT license](../LICENSE.md).

## How do I uninstall it?

Open the Extensions view, click the gear button of the extension and choose **Uninstall**. The full steps are in [Install](INSTALL.md#uninstall).
