import type { FC } from "hono/jsx";
import { markdownToHtml, parseFrontmatter } from "../utils/markdown";
import { buildHaystack, type SearchIndexEntry } from "../utils/search";

// Guides (architecture notes, CMS internals) are plain markdown — prose
// only, no need for live JSX demos — parsed with the same hand-rolled
// pipeline as blog posts. Component reference docs are MDX, compiled to a
// real component (via @mdx-js/rollup, configured in vite.config.ts) so they
// can embed live, actually-rendered examples.
const guideModules = import.meta.glob("/content/docs/*.md", {
	query: "?raw",
	import: "default",
}) as Record<string, () => Promise<string>>;

interface ComponentFrontmatter {
	title?: string;
	hydration?: number;
	category?: string;
}
type ComponentModule = () => Promise<{
	default: FC;
	frontmatter?: ComponentFrontmatter;
}>;
const componentModules = import.meta.glob(
	"/content/components/*.mdx",
) as Record<string, ComponentModule>;

export interface DocSummary {
	slug: string;
	title: string;
	section: "Guides" | "Components";
	/** Fine-grained grouping, components only (e.g. "Layout", "Forms", "Overlays"). */
	category?: string;
	/** Hydration tier (1/2/3) per app/components/ui/island-utils.ts, components only. */
	hydration?: number;
}

export interface DocDetail extends DocSummary {
	/** Set for guides (content/docs/*.md), rendered via dangerouslySetInnerHTML. */
	html?: string;
	/** Set for components (content/components/*.mdx), rendered as JSX. */
	Component?: FC;
}

/** One sidenav group: collects every doc matching `section` and/or `category`. */
export interface DocsNavGroupConfig {
	label: string;
	section?: string;
	category?: string;
}

/** A plain link rendered at the bottom of the docs sidenav (e.g. the GitHub repo). */
export interface DocsNavLinkConfig {
	label: string;
	href: string;
}

/** Shape of the `DocsConfig` singleton (content/config/docs.json) — drives the
 * docs sidenav's grouping/ordering so it isn't hardcoded to any one collection. */
export interface DocsConfig {
	groups: DocsNavGroupConfig[];
	/** Label for docs that don't match any group above. Defaults to "Other". */
	fallbackLabel?: string;
	/** External links shown at the bottom of the sidenav, e.g. the GitHub repo. */
	links?: DocsNavLinkConfig[];
}

const EMPTY_DOCS_CONFIG: DocsConfig = { groups: [] };

const docsConfigModule = import.meta.glob("/content/config/docs.json", {
	import: "default",
}) as Record<string, () => Promise<DocsConfig>>;

function guideSlugFromPath(path: string): string {
	return path.replace("/content/docs/", "").replace(/\.md$/, "");
}

function componentSlugFromPath(path: string): string {
	return path.replace("/content/components/", "").replace(/\.mdx$/, "");
}

async function summarizeGuide(
	path: string,
	loader: () => Promise<string>,
): Promise<DocSummary> {
	const slug = guideSlugFromPath(path);
	const raw = await loader();
	const { data } = parseFrontmatter(raw);
	return {
		slug,
		title: (data.title as string) || slug,
		section: "Guides",
	};
}

async function summarizeComponent(
	path: string,
	loader: ComponentModule,
): Promise<DocSummary> {
	const slug = componentSlugFromPath(path);
	const mod = await loader();
	return {
		slug,
		title: mod.frontmatter?.title || slug,
		section: "Components",
		category: mod.frontmatter?.category,
		hydration: mod.frontmatter?.hydration,
	};
}

export async function loadDocs(): Promise<DocSummary[]> {
	const docs = await Promise.all([
		...Object.entries(guideModules).map(([path, loader]) =>
			summarizeGuide(path, loader),
		),
		...Object.entries(componentModules).map(([path, loader]) =>
			summarizeComponent(path, loader),
		),
	]);

	docs.sort((a, b) => a.slug.localeCompare(b.slug));
	return docs;
}

/** Loads the DocsConfig singleton that drives the docs sidenav's grouping. */
export async function loadDocsConfig(): Promise<DocsConfig> {
	const loader = docsConfigModule["/content/config/docs.json"];
	if (!loader) return EMPTY_DOCS_CONFIG;
	return loader();
}

/**
 * Search index entries for every doc, keyed on title/section/category.
 * Guide bodies are real text (stripped to a haystack like blog posts);
 * component bodies are compiled JSX, so those are scoped to name/category.
 */
export async function loadDocsSearchIndex(): Promise<SearchIndexEntry[]> {
	const docs = await loadDocs();
	return docs.map((doc) => ({
		key: doc.slug,
		href: `/docs/${doc.slug}`,
		title: doc.title,
		tags: [doc.section, doc.category].filter((tag): tag is string =>
			Boolean(tag),
		),
		haystack: buildHaystack([doc.title, doc.slug, doc.section, doc.category]),
	}));
}

/**
 * Loads a single doc by slug — checks the component collection first (the
 * common case), then guides. Returns undefined if the slug exists in
 * neither. Exactly one of `.html` / `.Component` is set on the result,
 * depending on which collection it came from.
 */
export async function loadDocBySlug(
	slug: string,
): Promise<DocDetail | undefined> {
	const componentLoader = componentModules[`/content/components/${slug}.mdx`];
	if (componentLoader) {
		const mod = await componentLoader();
		return {
			slug,
			title: mod.frontmatter?.title || slug,
			section: "Components",
			category: mod.frontmatter?.category,
			hydration: mod.frontmatter?.hydration,
			Component: mod.default,
		};
	}

	const guideLoader = guideModules[`/content/docs/${slug}.md`];
	if (guideLoader) {
		const raw = await guideLoader();
		const { data, content } = parseFrontmatter(raw);
		return {
			slug,
			title: (data.title as string) || slug,
			section: "Guides",
			html: markdownToHtml(content),
		};
	}

	return undefined;
}
