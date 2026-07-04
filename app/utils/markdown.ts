// Simple frontmatter parser for markdown files
// No external dependencies required

interface BlogPost {
	slug: string;
	title: string;
	date: string;
	description: string;
	tags: string[];
	draft: boolean;
	content: string;
}

interface FrontmatterData {
	title?: string;
	date?: string;
	description?: string;
	tags?: string[];
	draft?: boolean;
	[key: string]: unknown;
}

export function parseFrontmatter(markdown: string): {
	data: FrontmatterData;
	content: string;
} {
	const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

	if (!match) {
		return { data: {}, content: markdown };
	}

	const frontmatter = match[1];
	const content = match[2];

	// Simple YAML parsing for basic types
	const data: FrontmatterData = {};
	const lines = frontmatter.split("\n");

	for (const line of lines) {
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;

		const key = line.slice(0, colonIndex).trim();
		let value: string | string[] | boolean = line.slice(colonIndex + 1).trim();

		// Remove quotes if present
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		// Parse arrays (simple format: ["item1", "item2"])
		if (value.startsWith("[") && value.endsWith("]")) {
			try {
				data[key] = JSON.parse(value);
			} catch {
				data[key] = value;
			}
		} else if (value === "true") {
			data[key] = true;
		} else if (value === "false") {
			data[key] = false;
		} else {
			data[key] = value;
		}
	}

	return { data, content };
}

// Simple markdown to HTML converter (basic implementation)
export function markdownToHtml(markdown: string): string {
	let html = markdown;

	// Headers
	html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
	html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
	html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

	// Bold and italic
	html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
	html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
	html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

	// Code blocks
	html = html.replace(
		/```(.*?)\n([\s\S]*?)```/g,
		'<pre><code class="language-$1">$2</code></pre>',
	);
	html = html.replace(/`(.*?)`/g, "<code>$1</code>");

	// Links
	html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

	// Lists
	html = html.replace(/^\s*\d+\.\s+(.*)$/gim, "<li>$1</li>");
	html = html.replace(/^\s*[-*+]\s+(.*)$/gim, "<li>$1</li>");

	// Paragraphs (wrap text that's not already in HTML tags)
	const lines = html.split("\n");
	const processedLines = lines.map((line) => {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("<")) {
			return line;
		}
		return `<p>${trimmed}</p>`;
	});

	return processedLines.join("\n");
}

export type { BlogPost };
