/**
 * Typed shape of the `configs` singleton at `content/configs.json`, plus the
 * loader that reads it. The singleton drives the docs sidenav's grouping and
 * ordering and the blog header copy, so none of it is hardcoded to any one
 * collection.
 */

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

/** Metadata for one content/<folder> collection: how it's labeled in the
 * sidenav/nav filters, and which CMS collection its "Edit" link should point
 * at. Both fall back to the raw folder name when omitted, so a new
 * content/<folder> collection works with zero config changes. */
export interface DocsCollectionConfig {
	folder: string;
	label?: string;
	cmsCollection?: string;
}

/** Site copy for the /blog section (configs singleton's `blog` field). */
export interface BlogSiteConfig {
	title?: string;
	description?: string;
	newsletterHeading?: string;
	newsletterDescription?: string;
}

/** Shape of the `DocsConfig` singleton (content/configs.json) — drives
 * collection labeling plus the docs sidenav's grouping/ordering, so none of
 * it is hardcoded to any one collection. */
export interface DocsConfig {
	collections?: DocsCollectionConfig[];
	groups: DocsNavGroupConfig[];
	/** Label for docs that don't match any group above. Defaults to "Other". */
	fallbackLabel?: string;
	/** External links shown at the bottom of the sidenav, e.g. the GitHub repo. */
	links?: DocsNavLinkConfig[];
	/** Plain links shown in the header nav (e.g. Blog, Home), before the
	 * per-doc Edit link and the GitHub icon. */
	headerLinks?: DocsNavLinkConfig[];
	/** Site copy for the /blog section. */
	blog?: BlogSiteConfig;
}

const EMPTY_DOCS_CONFIG: DocsConfig = { groups: [] };

// Singleton i18n uses the `{{locale}}` file-path placeholder (see the
// `configs` entry in public/admin/config.yml), not the `structure` option —
// that only applies to folder-based entry collections. Resolves to
// content/configs.json (en, default) and content/configs.zh.json /
// content/configs.es.json (translations).
const docsConfigModule = import.meta.glob(
	["/content/configs.json", "/content/configs.*.json"],
	{ import: "default" },
) as Record<string, () => Promise<DocsConfig>>;

/** Loads the DocsConfig singleton that drives the docs sidenav's grouping.
 * Falls back to the English default if the requested locale has no
 * translated configs.<locale>.json yet. */
export async function loadDocsConfig(locale = "en"): Promise<DocsConfig> {
	const path =
		locale === "en"
			? "/content/configs.json"
			: `/content/configs.${locale}.json`;
	const loader = docsConfigModule[path] ?? docsConfigModule["/content/configs.json"];
	if (!loader) return EMPTY_DOCS_CONFIG;
	return loader();
}
