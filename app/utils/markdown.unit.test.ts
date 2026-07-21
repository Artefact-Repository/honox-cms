import { expect, test } from "bun:test";
import { markdownToHtml, parseFrontmatter, stripMarkdown } from "./markdown";

test("markdownToHtml converts a GFM pipe table", () => {
	const markdown = [
		"| Prop | Type | Description |",
		"| :--- | :--- | :--- |",
		"| `size` | `string` | The size. |",
		'| `variant` | `"solid" \\| "outline"` | The variant. |',
	].join("\n");

	const html = markdownToHtml(markdown);

	expect(html).toContain("<table>");
	expect(html).toContain('<th style="text-align:left">Prop</th>');
	expect(html).toContain('<td style="text-align:left"><code>size</code></td>');
	expect(html).toContain('<code>"solid" | "outline"</code>');
	expect(html).not.toContain("<p>|");
});

test("markdownToHtml leaves non-table pipe text alone", () => {
	const html = markdownToHtml("Use `a | b` inside a sentence.");
	expect(html).not.toContain("<table>");
	expect(html).toContain("<code>a | b</code>");
});

test("markdownToHtml preserves multi-line fenced code blocks and escapes markup", () => {
	const markdown = [
		"```tsx",
		'import { Button } from "../components/ui";',
		"",
		"export default function MyPage() {",
		"  return (",
		'    <Button variant="solid">Click me</Button>',
		"  );",
		"}",
		"```",
	].join("\n");

	const html = markdownToHtml(markdown);

	expect(html).toContain('<pre><code class="language-tsx">');
	expect(html).toContain("export default function MyPage() {");
	// `<` is escaped everywhere; a bare `>` in text is valid HTML and rehype
	// leaves it unescaped (unlike the old hand-rolled escaper, which escaped
	// both) — either way the markup can't be parsed as a real `<Button>` tag.
	expect(html).toContain('&lt;Button variant="solid">Click me&lt;/Button>');
	expect(html).not.toContain("<p>export default function");
});

test("markdownToHtml converts a multi-line blockquote into one <blockquote>", () => {
	const markdown = [
		"> Every component's hydration behaviour funnels through the `shouldHydrate`",
		"> predicate — see [Hydration](/docs/Hydration) for details.",
	].join("\n");

	const html = markdownToHtml(markdown);

	// mdast-util-to-hast inserts a `\n` between block-level tags for
	// readability (e.g. `<blockquote>\n<p>...`); it's not visible once
	// rendered, so the assertions below tolerate the whitespace rather than
	// requiring the old hand-rolled parser's tag-adjacent formatting.
	expect(html).toMatch(/<blockquote>\s*<p>/);
	expect(html).toMatch(
		/Every component's hydration behaviour funnels through the <code>shouldHydrate<\/code>\s+predicate/,
	);
	expect(html).toContain('<a href="/docs/Hydration">Hydration</a>');
	expect(html).not.toContain("&gt;");
	// The two source lines collapse into one blockquote, not two.
	expect(html.match(/<blockquote>/g)?.length).toBe(1);
});

test("markdownToHtml converts a horizontal rule to <hr />", () => {
	const markdown = ["## Section one", "", "---", "", "## Section two"].join(
		"\n",
	);

	const html = markdownToHtml(markdown);

	expect(html).toContain("<hr />");
	expect(html).not.toContain("<p>---</p>");
});

test("markdownToHtml wraps bullet lists in <ul> and numbered lists in <ol>", () => {
	const markdown = [
		"- Overlay / popover families (tooltip, hover-card, popover, menu)",
		"- Modals / drawers / drag (dialog, drawer, splitter)",
		"",
		"1. First step",
		"2. Second step",
	].join("\n");

	const html = markdownToHtml(markdown);

	expect(html).toMatch(
		/<ul>\s*<li>Overlay \/ popover families \(tooltip, hover-card, popover, menu\)<\/li>\s*<li>Modals \/ drawers \/ drag \(dialog, drawer, splitter\)<\/li>\s*<\/ul>/,
	);
	expect(html).toMatch(
		/<ol>\s*<li>First step<\/li>\s*<li>Second step<\/li>\s*<\/ol>/,
	);
	expect(html).not.toContain("data-ol");
});

test("markdownToHtml converts underscore emphasis without touching snake_case identifiers", () => {
	const html = markdownToHtml(
		"These components _are_ interaction, and __must not__ declare `foo_bar_baz`.",
	);

	expect(html).toContain("<em>are</em>");
	expect(html).toContain("<strong>must not</strong>");
	// The identifier survives untouched inside its code span.
	expect(html).toContain("<code>foo_bar_baz</code>");
});

test("parseFrontmatter parses the block-list YAML style Sveltia CMS writes", () => {
	const markdown = [
		"---",
		"title: Getting Started",
		"date: 2026-06-28",
		"draft: false",
		"author: ''",
		"tags:",
		"  - tutorial",
		"  - honox",
		"---",
		"",
		"# Body",
	].join("\n");

	const { data, content } = parseFrontmatter(markdown);

	expect(data.title).toBe("Getting Started");
	// An unquoted YAML date scalar must stay a plain string (matching every
	// consumer's `date?: string` field) rather than the `yaml` package's
	// YAML-1.1 !!timestamp behavior, which would hand back a `Date` instead.
	expect(data.date).toBe("2026-06-28");
	expect(data.draft).toBe(false);
	expect(data.author).toBe("");
	expect(data.tags).toEqual(["tutorial", "honox"]);
	expect(content).toBe("\n# Body");
});

test("parseFrontmatter returns empty data and the original text when there's no frontmatter block", () => {
	const markdown = "# Just a heading\n\nNo frontmatter here.";
	const { data, content } = parseFrontmatter(markdown);

	expect(data).toEqual({});
	expect(content).toBe(markdown);
});

test("stripMarkdown reduces formatted markdown to a plain-text haystack", () => {
	const markdown = [
		"# Title",
		"",
		"Some **bold** and _italic_ text with a [link](/somewhere) and `inline code`.",
		"",
		"```ts",
		"const x = 1;",
		"```",
	].join("\n");

	const text = stripMarkdown(markdown);

	expect(text).not.toContain("#");
	expect(text).not.toContain("**");
	expect(text).not.toContain("[link]");
	expect(text).not.toContain("`");
	expect(text).toContain("Title");
	expect(text).toContain(
		"Some bold and italic text with a link and inline code.",
	);
	// Fenced code content is preserved as plain text, not dropped.
	expect(text).toContain("const x = 1;");
});
