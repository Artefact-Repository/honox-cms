import { markdownToHtml, parseFrontmatter } from "../utils/markdown";

// Use Vite's import.meta.glob to import all markdown files at build time
const docFiles = import.meta.glob("/content/docs/*.md", {
	query: "?raw",
	import: "default",
});

// Non-component reference docs get their own nav group; everything else is
// assumed to be a component doc named after the component it documents.
const GUIDE_SLUGS = new Set(["ARCHITECTURE", "PageBuilder"]);

export interface DocSummary {
	slug: string;
	title: string;
	category: "Guides" | "Components";
}

export interface DocDetail extends DocSummary {
	html: string;
}

function slugFromPath(path: string): string {
	return path.replace("/content/docs/", "").replace(/\.md$/, "");
}

export async function loadDocs(): Promise<DocSummary[]> {
	const docs: DocSummary[] = [];

	for (const [path, loader] of Object.entries(docFiles)) {
		const markdown = await (loader as () => Promise<string>)();
		const { data } = parseFrontmatter(markdown);
		const slug = slugFromPath(path);

		docs.push({
			slug,
			title: (data.title as string) || slug,
			category: GUIDE_SLUGS.has(slug) ? "Guides" : "Components",
		});
	}

	docs.sort((a, b) => a.slug.localeCompare(b.slug));
	return docs;
}

/**
 * Loads a single doc by slug, rendered to HTML.
 * Returns undefined if the slug doesn't exist.
 */
export async function loadDocBySlug(
	slug: string,
): Promise<DocDetail | undefined> {
	const loader = docFiles[`/content/docs/${slug}.md`];
	if (!loader) {
		return undefined;
	}

	const markdown = await (loader as () => Promise<string>)();
	const { data, content } = parseFrontmatter(markdown);

	return {
		slug,
		title: (data.title as string) || slug,
		category: GUIDE_SLUGS.has(slug) ? "Guides" : "Components",
		html: markdownToHtml(content),
	};
}
