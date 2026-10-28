/** Where a link should point once its file is published, or why it cannot. */
export type LinkResolution =
  | { kind: "unchanged"; href: string }
  | { kind: "route"; href: string }
  | { kind: "repository"; href: string }
  | { kind: "text-only"; warning: string }
  | { kind: "missing"; href: string; warning: string };

/** What link resolution needs to know about the repository and the page that holds the link. */
export interface LinkContext {
  /** Repository-relative path of the file that holds the link, with forward slashes. */
  file: string;
  /** Repository-relative path of a published document, mapped to its route. */
  published: ReadonlyMap<string, string>;
  /** Every repository-relative path that exists, published or not. */
  existing: ReadonlySet<string>;
  /** True for a path that must not appear on the site. */
  isExcluded: (path: string) => boolean;
  /** Repository web address, for links to files that are not on the site. */
  repositoryUrl?: string;
}

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

function dirname(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

/** Resolve `.` and `..` segments. Returns null when the path climbs out of the repository. */
function resolvePath(from: string, target: string): string | null {
  const parts = (target.startsWith("/") ? target.slice(1) : `${from}/${target}`).split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (out.length === 0) return null;
      out.pop();
    } else out.push(part);
  }
  return out.join("/");
}

/**
 * Decide where a link found in a markdown file should point once the file is published.
 * Web addresses, `mailto:`, in-page anchors and paths that start with `/` are left as they are.
 */
export function resolveLink(href: string, context: LinkContext): LinkResolution {
  if (href === "" || href.startsWith("#") || href.startsWith("/") || EXTERNAL.test(href)) {
    return { kind: "unchanged", href };
  }

  const hashIndex = href.indexOf("#");
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const pathPart = (hashIndex === -1 ? href : href.slice(0, hashIndex)).split("?")[0]!;
  const resolved = resolvePath(dirname(context.file), decodeURI(pathPart));
  if (resolved === null)
    return { kind: "missing", href, warning: `Link "${href}" leaves the repository` };

  const candidates = [
    resolved,
    `${resolved}.md`,
    `${resolved}.mdx`,
    `${resolved}/README.md`,
    `${resolved}/index.md`,
  ];

  for (const candidate of candidates) {
    const route = context.published.get(candidate);
    if (route !== undefined) return { kind: "route", href: `${route}${hash}` };
  }
  for (const candidate of candidates) {
    if (context.isExcluded(candidate)) {
      return {
        kind: "text-only",
        warning: `Link "${href}" points to an excluded file, so only its text is kept`,
      };
    }
  }
  const existing = candidates.find((candidate) => context.existing.has(candidate));
  if (existing !== undefined) {
    if (context.repositoryUrl) {
      return {
        kind: "repository",
        href: `${context.repositoryUrl.replace(/\/$/, "")}/blob/HEAD/${existing}${hash}`,
      };
    }
    return { kind: "unchanged", href };
  }
  return { kind: "missing", href, warning: `Link "${href}" does not match any file` };
}
