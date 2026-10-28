import { remarkRewriteLinks } from "./remarkRewriteLinks";
import type { LinkContext } from "../domain";

/** A page body as HTML, with its headings for the table of contents. */
export interface RenderedMarkdown {
  html: string;
  headings: { depth: number; slug: string; text: string }[];
}

/**
 * Walk a hast tree to make rendered markdown safe and usable:
 * web links open in a new tab, and blocks that can scroll sideways (code, tables) can be
 * focused, so a keyboard user can scroll them. Done in the HTML, so it needs no JavaScript.
 */
function rehypeExternalLinks() {
  type Node = {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: Node[];
  };
  const visit = (node: Node) => {
    if (node.type === "element" && (node.tagName === "pre" || node.tagName === "table")) {
      node.properties = { ...node.properties, tabIndex: 0 };
    }
    if (node.type === "element" && node.tagName === "a") {
      const href = String(node.properties?.href ?? "");
      if (/^https?:\/\//i.test(href))
        node.properties = { ...node.properties, target: "_blank", rel: "noopener noreferrer" };
    }
    node.children?.forEach(visit);
  };
  return (tree: Node) => visit(tree);
}

/**
 * Render markdown to HTML with Shiki highlighting and rewritten links. The markdown package is
 * loaded on demand: it is ESM only, and nothing else in this layer needs it.
 */
export async function renderMarkdown(
  markdown: string,
  options: { context: LinkContext; base: string; onWarning?: (message: string) => void },
): Promise<RenderedMarkdown> {
  const { createMarkdownProcessor } = await import("@astrojs/markdown-remark");
  const processor = await createMarkdownProcessor({
    syntaxHighlight: { type: "shiki", excludeLangs: [] },
    shikiConfig: { theme: "github-dark-default" },
    remarkPlugins: [[remarkRewriteLinks, options]],
    rehypePlugins: [rehypeExternalLinks],
  });
  const result = await processor.render(markdown);
  return { html: result.code, headings: result.metadata.headings };
}
