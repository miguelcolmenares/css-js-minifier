<!-- agents-toolkit:planning-doc issue=273 -->

# Site menu and footer links (#273)

## Problem

The site config has an empty `nav`, so the header shows the default menu: Docs and Changelog. Visitors look for examples, help and contributor pages, which sit one click deeper in the docs sidebar. The footer does not link Open VSX, where the same extension is published.

## Current architecture

- `site/sitekit.config.json` holds `nav`, `footer.links` and `collections`.
- `site/src/presentation/layouts/BaseLayout.astro` builds the header menu. With an empty `nav` it lists one entry per collection, then Changelog.
- The footer "Documentation" column always lists the same collection entries and Changelog, whatever `nav` holds. The "Project" column holds the repository, "Report an issue" and `footer.links`.
- `footer.links` takes `label` and `href` only (`strictObject` in `site/src/domain/config.ts`).

## Proposed changes

1. Set `nav` to Docs `/docs/`, Examples `/docs/examples/`, Help `/docs/faq/`, Contributors `/docs/overview/`.
2. Add the Open VSX link to `footer.links`, after the VS Code Marketplace link.
3. Add a CHANGELOG entry under `[Unreleased]`, because the repository records site changes there.

## Decisions

- Help and Contributors point to the first page of their sidebar group. A group index page is out of scope. This is the smallest change the issue describes.
- The two registry links stay text links. docs-sitekit has no icon for them.
- Changelog leaves the header. The footer keeps it through the "Documentation" column.

## Known limit

The acceptance criterion asks for Open VSX to open in a new tab with `rel="noopener noreferrer"`. The config schema has no `external` flag for `footer.links`, and `BaseLayout.astro` sets `external` only on the repository and issue links. So the new link, like the existing Marketplace link, opens in the same tab. Fixing this needs a change in docs-sitekit, not in this repository.

## Testing strategy

- `npm ci` and `npm run build` in `site/`, with the base `/css-js-minifier/`.
- `npm run check` in `site/`.
- Read the built HTML for the header, the phone menu and the footer links.
- `npm run format:check` and `npm run lint:md` at the repository root.
