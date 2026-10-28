import { publishedRoutes, buildDocuments } from "../application";
import { matchesAny } from "../domain";
import type { Document, LinkContext, SiteConfig } from "../domain";
import { renderMarkdown } from "./renderMarkdown";
import type { RenderedMarkdown } from "./renderMarkdown";
import { readSources } from "./readSources";
import { readRepositoryVersion } from "./repositoryVersion";
import { loadSiteConfig } from "./siteConfig";

/** A loaded site: its config, its pages, a renderer, and the problems found on the way. */
export interface Site {
  config: SiteConfig;
  /** The version to show: the one in the config if there is one, else the repository's own, read at build time. */
  version: string | undefined;
  documents: Document[];
  /** Problems found while reading links, to print once at the end of a build. */
  warnings: string[];
  /** Join a path to the site base: `href("docs/")` becomes `/repo/docs/`. */
  href: (path: string) => string;
  render: (document: Document) => Promise<RenderedMarkdown>;
}

let cached: Site | undefined;

/** Load the whole site once per build: config, source files, documents and a renderer. */
export function loadSite(siteDir: string = process.cwd()): Site {
  if (cached) return cached;
  const config = loadSiteConfig(siteDir);
  const sources = readSources(siteDir, config);
  const documents = buildDocuments(sources.files, {
    base: config.site.base,
    collections: config.collections,
  });
  const published = publishedRoutes(documents);
  const warnings: string[] = [];

  const contextFor = (document: Document): LinkContext => ({
    file: document.path,
    published,
    existing: sources.existing,
    isExcluded: (path) => matchesAny(path, config.anonymize.excludePaths),
    repositoryUrl: config.site.repository,
  });

  cached = {
    config,
    version: config.site.version ?? readRepositoryVersion(sources.root),
    documents,
    warnings,
    href: (path) => `${config.site.base}${path.replace(/^\//, "")}`,
    render: (document) =>
      renderMarkdown(document.body, {
        context: contextFor(document),
        base: config.site.base,
        onWarning: (message) => warnings.push(message),
      }),
  };
  return cached;
}
