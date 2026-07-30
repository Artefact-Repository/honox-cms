import type { ComponentBlock } from "../components/block-types";

// Pages content lives under content/pages/*.json for the default locale
// (en), and content/pages/<locale>/*.json for translations — matching the
// CMS's `structure: multiple_folders` (public/admin/config.yml) with
// `omit_default_locale_from_file_path: true`, same convention as app/lib/docs.ts.
const pageModules = (
	typeof import.meta.glob === "function"
		? import.meta.glob("/content/pages/**/*.json", { import: "default" })
		: {}
) as Record<string, () => Promise<unknown>>;

export interface PageData {
	title?: string;
	content?: ComponentBlock[];
	/** Optional custom-header slots — a page whose route renders its own
	 * header (rather than a shared one) can source it from here instead of
	 * hardcoding it. See content/pages/index.json and app/routes/index.tsx
	 * for the reference usage. */
	headerBrand?: ComponentBlock[];
	headerNav?: ComponentBlock[];
	headerActions?: ComponentBlock[];
	[key: string]: unknown;
}

function pagePath(slug: string, locale: string): string {
	return locale === "en"
		? `/content/pages/${slug}.json`
		: `/content/pages/${locale}/${slug}.json`;
}

/** Loads a page by slug, falling back to the default-locale file when no
 * translation exists for `locale`. Returns undefined if neither exists. */
export async function loadPage(
	slug: string,
	locale = "en",
): Promise<PageData | undefined> {
	const loader =
		pageModules[pagePath(slug, locale)] ??
		(locale !== "en" ? pageModules[pagePath(slug, "en")] : undefined);
	if (!loader) return undefined;
	return (await loader()) as PageData;
}

/** All default-locale page slugs, for ssgParams — translations reuse the
 * same slug under a locale-prefixed route, so they don't need their own params. */
export function listPageSlugs(): string[] {
	const slugs: string[] = [];
	for (const path of Object.keys(pageModules)) {
		const match = path.match(/^\/content\/pages\/([^/]+)\.json$/);
		if (match) slugs.push(match[1]);
	}
	return slugs;
}
