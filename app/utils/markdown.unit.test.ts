import { expect, test } from "bun:test";
import { markdownToHtml } from "./markdown";

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
	expect(html).toContain(
		'&lt;Button variant="solid"&gt;Click me&lt;/Button&gt;',
	);
	expect(html).not.toContain("<p>export default function");
});
