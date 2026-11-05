# CSS & JS Minifier documentation

This directory holds the documentation of the CSS & JS Minifier VS Code extension. It is published as the [documentation site](https://miguelcolmenares.com/css-js-minifier/). The user guide comes first, the pages for contributors are at the end.

## User guide

For people who want to install and use the extension.

- **[INSTALL.md](INSTALL.md)**: install from the VS Code Marketplace, Open VSX or a `.vsix` file, then update and uninstall.
- **[QUICK-START.md](QUICK-START.md)**: minify a first file in about a minute.
- **[COMMANDS-AND-SHORTCUTS.md](COMMANDS-AND-SHORTCUTS.md)**: the two commands, the menus and the keyboard shortcuts for Windows, Linux and macOS.
- **[CONFIGURATION.md](CONFIGURATION.md)**: the five settings, with ready-to-copy `settings.json` snippets.
- **[EXAMPLES.md](EXAMPLES.md)**: real before and after for CSS and JavaScript, with measured sizes.
- **[FAQ.md](FAQ.md)**: short answers to common questions.
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**: what to try when something fails, and how to report a bug.

## For contributors

For people who change the extension, its tests or its translations.

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: extension architecture, module layers, and distribution model.
- **[TESTING-GUIDE.md](TESTING-GUIDE.md)**: test suites, VS Code tasks, and debugging tips.
- **[INTERNATIONALIZATION.md](INTERNATIONALIZATION.md)**: multi-language support architecture (`vscode.l10n` + `package.nls.*`).

## Quick links

- **[Main README](../README.md)**: the short overview of the extension.
- **[CHANGELOG](../CHANGELOG.md)**: version history.
- **[CONTRIBUTING](../CONTRIBUTING.md)**: contributor onboarding, PR checklist, branch protection.
- **[AGENTS.md](../AGENTS.md)**: agent-oriented reference (release flow, git hooks, ruleset, cross-platform CI matrix).
- **[Publishing runbook](../.github/instructions/publish-update-extension.instructions.md)**: maintainer-only release runbook.

## How the site is built

The site is built with [docs-sitekit](https://github.com/miguelcolmenares/docs-sitekit) from the Markdown files in this directory and from `CHANGELOG.md`. The pages, their groups and their order, and the home page text, are set in `site/sitekit.config.json`. A new Markdown file in this directory must be added to a group there, or the build fails.

The two animated demos used in the guide live in `images/` and are copied to `site/public/docs/images/`, so the same relative link (`../images/minify.gif`) works on GitHub and on the site. Update both copies when a demo changes.

---

**Last Updated**: 2026-11-04
**Extension Version**: 1.3.4
