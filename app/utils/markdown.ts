// Markdown handling built on the remark/rehype unified ecosystem, instead of
// the hand-rolled regex pipeline this file used to contain.

import type { Element, Root as HastRoot } from "hast";
import { toString as mdastToString } from "mdast-util-to-string";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import strip from "strip-markdown";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

interface FrontmatterData {
	title?: string;
	date?: string;
	description?: string;
	tags?: string[];
	draft?: boolean;
	author?: string;
	readTime?: string;
	cover?: string;
	[key: string]: unknown;
}

const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

export function parseFrontmatter(markdown: string): {
	data: FrontmatterData;
	content: string;
} {
	const match = markdown.match(FRONTMATTER_PATTERN);

	if (!match) {
		return { data: {}, content: markdown };
	}

	const rawFrontmatter = match[1] ?? "";
	const content = match[2] ?? "";
	const data = (parseYaml(rawFrontmatter) ?? {}) as FrontmatterData;

	return { data, content };
}

/** Inverse of `parseFrontmatter` — rebuilds a `---`-fenced markdown file from
 * frontmatter data and a body. Round-tripping through parse+stringify drops
 * any comments in the original frontmatter block (the `yaml` library doesn't
 * preserve them), so this is meant for programmatic edits (e.g. the project
 * board's drag-and-drop writing straight to GitHub), not hand-authored files. */
export function stringifyFrontmatter(
	data: FrontmatterData,
	content: string,
): string {
	return `---\n${stringifyYaml(data).trimEnd()}\n---\n\n${content.trimStart()}`;
}

// mdast-util-to-hast has no built-in option to render GFM table alignment as
// a `style` (its table-row handler literally has a "To do: option to use
// `style`?" comment), so it emits the deprecated `align` attribute instead.
// That loses to markdownContentClass's `& th, & td { textAlign: "left" }`
// rule — CSS always wins over a presentational HTML attribute — silently
// flattening every aligned column back to the left. Rewrite `align` to an
// inline style so alignment actually renders.
function rehypeTableAlignStyle() {
	return (tree: HastRoot) => {
		visit(tree, "element", (node: Element) => {
			const align = node.properties?.align;
			if (
				(node.tagName === "td" || node.tagName === "th") &&
				typeof align === "string"
			) {
				node.properties.style = `text-align:${align}`;
				delete node.properties.align;
			}
		});
	};
}

const htmlProcessor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkRehype)
	.use(rehypeTableAlignStyle)
	.use(rehypeStringify, {
		// closeSelfClosing (with the default tightSelfClosing: false) renders
		// void elements like `<hr />` / `<img />` instead of HTML5's bare `<hr>`.
		closeSelfClosing: true,
		// `&lt;`/`&gt;` instead of the terser (but less familiar) `&#x3C;`/`&#x3E;`.
		characterReferences: { useNamedReferences: true },
	});

export function markdownToHtml(markdown: string): string {
	return String(htmlProcessor.processSync(markdown));
}

const plainTextProcessor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(strip, {
		// strip-markdown drops fenced/indented code entirely by default; the
		// old hand-rolled stripMarkdown deliberately kept code contents in the
		// search haystack (e.g. so an API call shown only in a code sample is
		// still findable), so restore that by keeping the code text instead.
		remove: [
			[
				"code",
				(node: { value: string }) => ({ type: "text", value: node.value }),
			],
		],
	});

// Reduce markdown to plain text for search indexing. strip-markdown removes
// the formatting nodes (emphasis, links, images, etc.) from the mdast tree,
// collapsing each block down to a plain paragraph; mdast-util-to-string then
// extracts each top-level block's text. Blocks are joined with a space (not
// concatenated directly) so e.g. a heading immediately followed by a
// paragraph doesn't smash together into one run-on word.
export function stripMarkdown(markdown: string): string {
	const tree = plainTextProcessor.runSync(plainTextProcessor.parse(markdown));
	const text = tree.children.map((child) => mdastToString(child)).join(" ");
	return text.replace(/\s+/g, " ").trim();
}
