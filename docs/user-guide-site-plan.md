<!-- agents-toolkit:planning-doc issue=254 -->
# Plan: turn the documentation site into a user guide (#254)

Temporary planning document. It is deleted when the pull request is created.

## Problem statement

The documentation site only has contributor pages (overview, architecture, testing, internationalization).
A new user cannot learn how to install the extension, how to use it, or what to do when something fails.

## Current architecture (what was found)

- The site is the vendored docs-sitekit template in `site/` (kit `0.2.0` files, CI runs the `0.2.2` check). It is
  configured only by `site/sitekit.config.json`. Markdown under `docs/` is published automatically, and when a
  collection has `groups`, every page must be in a group (a page in no group fails the build).
- Home page layout is fixed by the template: hero (title, lede, copyable install command, two buttons), optional
  stats row, "Why" feature cards, one card section per collection, closing call-to-action band. It cannot hold
  images or a custom block without changing the kit, which is out of scope.
- Supported in page Markdown: callouts (`> [!NOTE]`), code blocks with titles and copy buttons, tables, frontmatter
  (`title`, `description`, `order`, `tags`, `meta`, `links`), `{{ version }}` variables, `snippets/`. There is no tab
  component, so per-OS content is written as headings or tables.
- Images are not rewritten: a relative path in a page would break in the built HTML. Files in `site/public/` are
  served at `/css-js-minifier/<name>`, so pages use that absolute path. The two GIFs live in `images/` (not in
  `site/public/` as the issue assumed), so they are copied into `site/public/`.
- Node 22.23.4 or newer is needed to build the site (Astro 7). The local default Node 22.23.1 is too old.

## Proposed changes

Two collections are not needed. One `docs` collection with groups, in a user-journey order, then a separate
contributors group at the end:

| Group | Pages |
| --- | --- |
| Get started | Install, Quick start |
| Use it | Commands and shortcuts, Configuration, Examples |
| Help | FAQ, Troubleshooting and reporting a bug |
| For contributors | Overview (current `docs/README.md`), Architecture, Testing guide, Internationalization |

Home page (config only): new hero copy, `Install` and `Quick start` buttons, three-step cards, measured savings in
the stats row, offline and fast points, technical detail last. `docs/README.md` and `README.md` point to the guide.

## Phases

1. Verify facts against `package.json`, `package.nls.json`, `src/`, the Marketplace, Open VSX and the release assets.
2. Measure real before and after examples by running `lightningcss` and `oxc-minify` the way `src/services/strategies/` does.
3. Write the pages, copy the GIFs, edit `site/sitekit.config.json`.
4. Update `docs/README.md`, `README.md`, `CHANGELOG.md` (one bullet under `## [Unreleased]`).
5. Build and preview the site, run the link check, inspect narrow and wide viewports.
6. Validate (`lint:md`, `format:check`, `lint`, `tsc`), run `core-review --budget medium`, push.

## Rules for this work

- Every fact comes from the repository, a registry, or the release. Unverified items are left out or flagged.
- Open VSX is inactive today (the API answers 404, issue #240), so it is written as "coming soon".
- No screenshots are created. The shot list is in the pull request summary.

## Testing strategy

- `npm run lint:md`, `npm run format:check`, `npm run lint`, `npx tsc --noEmit`.
- `npm run build` in `site/` with Node 24, then `npx docs-sitekit@0.2.2 check --dir site --dist site/dist`.
- Render pages in a browser at a narrow and a wide viewport.

## Findings while building

- A Markdown file under `docs/` that is in no group makes the site build fail (`... is in no group of "Docs"`).
  This plan file is therefore never published, it only breaks a build if it reaches `master`. It is removed at PR
  time, and it is not listed in `site/sitekit.config.json`.
- Images in pages use `../images/<name>`. On GitHub that is the repository `images/` folder, and on the site it
  resolves to `/css-js-minifier/docs/images/<name>`, served from `site/public/docs/images/`. Each image needs a copy
  in both places.
- Home page: the template cannot show images or a custom block, so the three steps are the feature cards and the
  GIFs are on the Quick start page.

## Screenshot shot list (to capture by the maintainer, nothing is faked)

Capture with the Dark Modern theme, a clean window, 100% zoom, PNG, cropped to the relevant area and no wider than
1200 px. Save each file in `images/` and copy it to `site/public/docs/images/`. If PNGs go in `images/`, also add
`images/*.png` to `.vscodeignore` (it excludes only `images/*.gif`; `icon.png` must stay).

| File name | What to show | Page and place |
| --- | --- | --- |
| `command-palette-minify.png` | Command Palette with `Minify` typed, both commands listed | Quick start (step 2), Commands and shortcuts |
| `context-menu-editor-macos.png`, `context-menu-editor-windows.png` | Right-click menu in a CSS file, the two commands highlighted | Commands and shortcuts |
| `context-menu-explorer.png` | Right-click menu on a `.css` file in the Explorer | Commands and shortcuts |
| `notification-size-reduction.png` | The success notification with the size reduction text | Quick start (step 3), Examples |
| `error-notification.png` | The `JavaScript minification error: Unexpected token` notification | Examples, Troubleshooting |
| `extensions-view-install.png`, `extensions-view-installed.png` | Extensions view with `@id:miguel-colmenares.css-js-minifier`, before (Install) and after (Manage gear) | Install, route 1 |
| `install-from-vsix.png` | The `...` menu of the Extensions view with Install from VSIX highlighted | Install, route 3 |
| `about-dialog-os-line-windows.png`, `about-dialog-os-line-macos.png` | Help > About with the OS line highlighted | Install, route 3 step 1 |
| `settings-ui-macos.png`, `settings-ui-windows.png` | Settings filtered by `css-js-minifier`, showing the five settings | Configuration |
| `keyboard-shortcuts-editor.png` | Keyboard Shortcuts editor filtered by `minify` | Commands and shortcuts |
| `output-panel.png` | Output panel with `CSS & JS Minifier` selected in the drop-down | Troubleshooting |
| `status-bar-language-mode.png` | Status bar language indicator (CSS) and the Change Language Mode list | Troubleshooting |
