# Install the extension

Step-by-step install guide for CSS & JS Minifier: from the VS Code Marketplace, from Open VSX, and from a downloaded file.

Never installed an extension before? That is fine, every step is written out. Pick one route, install, then check that it worked.

## Before you start

You need Visual Studio Code version 1.144.0 or newer. To see your version, open **Help > About** on Windows and Linux, or **Code > About Visual Studio Code** on macOS. If it is older, update VS Code first.

Which route should you use?

| Route | Best for | Status |
| --- | --- | --- |
| [VS Code Marketplace](#route-1-the-vs-code-marketplace) | Almost everyone. Updates arrive by themselves. | Available |
| [Open VSX](#route-2-open-vsx-vscodium-and-other-forks) | VSCodium, Eclipse Theia, Gitpod and other forks. | Available |
| [A downloaded `.vsix` file](#route-3-a-downloaded-vsix-file-offline-or-manual) | No internet on the target machine, or you want to pick the exact file. | Available |

## Route 1: the VS Code Marketplace

The extension is published as **JS & CSS Minifier Tool and Compressor** by `miguel-colmenares`. Its short ID is `miguel-colmenares.css-js-minifier`. There are three ways to install it from the Marketplace. They give the same result.

### From the Extensions view inside VS Code

1. Open VS Code.
2. Open the Extensions view. Click the square icon in the Activity Bar (the bar of icons on the far left), or press `Ctrl+Shift+X` on Windows and Linux, or `Cmd+Shift+X` on macOS.
3. Click the search box at the top and type `@id:miguel-colmenares.css-js-minifier`. This finds exactly this extension.
4. Click the extension in the list, then click the blue **Install** button.
5. When it finishes, the **Install** button turns into a gear button called **Manage**. That means it is installed.

### From the Marketplace page

1. Open the [extension page on the Marketplace](https://marketplace.visualstudio.com/items?itemName=miguel-colmenares.css-js-minifier) in your browser.
2. Click **Install**.
3. Your browser may ask if it can open Visual Studio Code. Allow it. VS Code opens on the extension page, where you click **Install** if it is not installed yet.

### From the terminal

Open a terminal and run:

```bash
code --install-extension miguel-colmenares.css-js-minifier
```

> [!TIP]
> If the terminal says `code` is not found, close the terminal and open a new one. On macOS you may need to add the command first: open the Command Palette with `Cmd+Shift+P`, type `shell command`, and run **Shell Command: Install 'code' command in PATH**, then restart the terminal. If it still does not work, use the Extensions view above.

The Marketplace holds one package for each type of computer (Windows, macOS and Linux, on Intel/AMD and on ARM). VS Code picks the right one for you.

## Route 2: Open VSX (VSCodium and other forks)

Editors such as VSCodium, Eclipse Theia and Gitpod use [Open VSX](https://open-vsx.org) instead of the Microsoft Marketplace. The extension is published there under the same short ID, `miguel-colmenares.css-js-minifier`, from the same files as the Marketplace.

### From the Extensions view inside your editor

1. Open your editor.
2. Open the Extensions view, usually with `Ctrl+Shift+X`, or `Cmd+Shift+X` on macOS.
3. Search for `css-js-minifier`.
4. Click the extension in the list, then click **Install**.

### From the Open VSX page

Open the [extension page on Open VSX](https://open-vsx.org/extension/miguel-colmenares/css-js-minifier) to see the versions and the available packages, then install from your editor.

### From the terminal of your editor

```bash
codium --install-extension miguel-colmenares.css-js-minifier
```

Replace `codium` with the command of your editor. Open VSX holds one package per type of computer, the same set as the Marketplace, and your editor picks the right one.

> [!NOTE]
> Alpine Linux packages (`alpine-x64` and `alpine-arm64`) only exist from the release after 1.3.4. On an Alpine-based Dev Container running an older version, use [route 3](#route-3-a-downloaded-vsix-file-offline-or-manual).

## Route 3: a downloaded `.vsix` file (offline or manual)

A `.vsix` file is the extension packed in one file. Use this route when the computer has no internet access or you want a specific version.

### Step 1: download the right file

1. Open the [Releases page](https://github.com/miguelcolmenares/css-js-minifier/releases) and open the newest release.
2. Under **Assets**, download the file that matches your computer. The names look like `css-js-minifier-<version>-<platform>.vsix`.

| Your computer | File ending |
| --- | --- |
| Windows, Intel or AMD processor (most PCs) | `win32-x64.vsix` |
| Windows on an ARM processor | `win32-arm64.vsix` |
| Mac with an Intel processor | `darwin-x64.vsix` |
| Mac with Apple silicon (M1 or newer) | `darwin-arm64.vsix` |
| Linux, Intel or AMD processor | `linux-x64.vsix` |
| Linux, ARM processor | `linux-arm64.vsix` |

Not sure which one is yours? Match the architecture of VS Code itself: open the **About** dialog (see "Before you start") and look at the line that starts with **OS**. It ends with a word like `x64` or `arm64`.

Good to know:

- The six files above are the ones released so far (the latest release at the time of writing, 1.3.4, has exactly these six). New platforms are added to the table when they ship.
- Alpine Linux (and other musl-based Linux, common in small Docker images and Dev Containers) is **not in the current release**. Version 1.3.4 only has Linux files for the standard glibc Linux. Alpine packages (`alpine-x64` and `alpine-arm64`) are already built for the next release, see [issue #244](https://github.com/miguelcolmenares/css-js-minifier/issues/244).
- Each file is for one platform because the extension includes fast native code. That is why a release has several downloads.

### Step 2: install the file

Either use the terminal. Replace the file name with the one you downloaded, and add the folder path if the file is not in the current folder:

```bash
code --install-extension css-js-minifier-1.3.4-win32-x64.vsix
```

Or use VS Code:

1. Open the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
2. Click the `...` button at the top of the view (**More Actions**).
3. Choose **Install from VSIX...** and select the file you downloaded.

You can also open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run **Extensions: Install from VSIX**.

> [!NOTE]
> VS Code does not update extensions installed from a `.vsix` file by itself. To update, download the newer file and install it the same way.

## Check that it worked

1. Open the Extensions view and type `@installed` in the search box. You should see **JS & CSS Minifier Tool and Compressor** in the list. Or run `code --list-extensions --show-versions` in a terminal and look for `miguel-colmenares.css-js-minifier`.
2. Open any `.css` or `.js` file. Right-click inside the editor. You should see **Minify this File** and **Minify and Save as New File**.

If you do not see them, go to [Troubleshooting](TROUBLESHOOTING.md). If you do, continue with the [Quick start](QUICK-START.md).

## Update

- **Installed from the Marketplace:** VS Code checks for updates on its own and installs them. It may ask you to restart the extensions, click **Restart Extensions**. To update right now, open the Command Palette and run **Show Extension Updates**, then click **Update** on this extension.
- **Installed from a `.vsix` file:** install the newer file as in route 3.

## Uninstall

1. Open the Extensions view and find the extension (try `@installed`).
2. Click the gear button (**Manage**) and choose **Uninstall**.
3. If VS Code asks, restart the extensions.

From a terminal: `code --uninstall-extension miguel-colmenares.css-js-minifier`.

Uninstalling does not delete your files, including any `.min` files the extension created. The `css-js-minifier.*` lines you may have added to your settings stay in your `settings.json`. They do nothing without the extension, and you can delete them.

These steps follow the official [VS Code guide to installing and managing extensions](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace).
