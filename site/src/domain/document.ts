/** The four tones a group badge can have. They match the `ToneBadge` component. */
export type Tone = "neutral" | "brand" | "success" | "warn";

/** The group a page belongs to inside its collection. */
export interface DocumentGroup {
  name: string;
  tone: Tone;
}

/** A markdown file read from the repository, before it becomes a page. */
export interface SourceFile {
  /** Repository-relative path with forward slashes. */
  path: string;
  /** Id of the collection that owns the file, or `changelog`. */
  collection: string;
  /** Path of the file inside the folder of its collection, with forward slashes. */
  collectionPath: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

/** A page of the site. */
export interface Document {
  collection: string;
  /** Repository-relative path of the source file. */
  path: string;
  slug: string;
  /** Route including the site base, with a trailing slash. */
  route: string;
  title: string;
  description: string;
  /** Where the description came from. A description taken from the body is already on the page. */
  descriptionSource: "frontmatter" | "content" | "none";
  /** Explicit position from the frontmatter, or null. */
  order: number | null;
  /** The group of the page, or null when its collection has no groups. */
  group: DocumentGroup | null;
  /** Markdown body, without a leading heading that repeats the title. */
  body: string;
}
