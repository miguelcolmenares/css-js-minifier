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
