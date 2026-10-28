import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import matter from "gray-matter";
import { applyReplacements, matchesAny } from "../domain";
import type { SiteConfig, SourceFile } from "../domain";

const SKIPPED_FOLDERS = new Set(["node_modules", ".git", "dist", ".astro", ".next", "coverage"]);

function posix(path: string): string {
  return path.split(sep).join("/");
}

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (SKIPPED_FOLDERS.has(entry.name)) return [];
    const full = join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/** The markdown read from a repository, and the paths of every file in it. */
/** The markdown read from a repository, and the paths of every file in it. */
export interface RepositorySources {
  /** Absolute path of the repository root. */
  root: string;
  files: SourceFile[];
  /** Every file of the repository, as repository-relative paths, for checking links. */
  existing: Set<string>;
}

/**
 * Read the markdown the site documents. A file matched by `anonymize.excludePaths` is never read,
 * and `anonymize.replace` is applied to everything that is. A file belongs to the collection whose
 * folder is the deepest one that contains it, so `docs/tutorials/` can be its own collection
 * inside `docs/` without its pages also showing up in the parent.
 */
export function readSources(siteDir: string, config: SiteConfig): RepositorySources {
  const root = resolve(siteDir, config.sources.root);
  const toRepoPath = (absolute: string) => posix(relative(root, absolute));
  const existing = new Set(walk(root).map(toRepoPath));
  const { excludePaths, replace } = config.anonymize;

  const folders = config.collections.map((collection) => ({
    id: collection.id,
    absolute: resolve(siteDir, collection.dir),
    path: toRepoPath(resolve(siteDir, collection.dir)),
  }));
  const ownerOf = (repoPath: string) =>
    folders
      .filter((folder) => repoPath === folder.path || repoPath.startsWith(`${folder.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0];

  const read = (
    absolute: string,
    collection: string,
    collectionPath: string,
  ): SourceFile | null => {
    const path = toRepoPath(absolute);
    if (matchesAny(path, excludePaths)) return null;
    const parsed = matter(readFileSync(absolute, "utf8"));
    return {
      path,
      collection,
      collectionPath,
      frontmatter: JSON.parse(applyReplacements(JSON.stringify(parsed.data), replace)) as Record<
        string,
        unknown
      >,
      content: applyReplacements(parsed.content, replace),
    };
  };

  const files: SourceFile[] = [];
  for (const folder of folders) {
    for (const absolute of walk(folder.absolute)
      .filter((file) => /\.mdx?$/i.test(file))
      .sort()) {
      const repoPath = toRepoPath(absolute);
      if (ownerOf(repoPath)?.id !== folder.id) continue; // a deeper collection owns it
      const file = read(absolute, folder.id, repoPath.slice(folder.path.length + 1));
      if (file) files.push(file);
    }
  }

  const changelog = resolve(siteDir, config.sources.changelog);
  if (existsSync(changelog) && statSync(changelog).isFile()) {
    const file = read(changelog, "changelog", toRepoPath(changelog));
    if (file) files.push(file);
  }
  return { root, files, existing };
}
