// Per-field metadata for every /settings/<section> form — the single source
// for both each field's info-tooltip text (app/components/settings-field-info.tsx,
// used from the settings-*-form.tsx islands) and the settings search index
// (app/routes/api/settings/search.json.ts). Keeping both in one place means
// a field's description can't drift out of sync between what a user hovers
// and what a search match shows.
import { buildHaystack, type SearchIndexEntry } from "../utils/search";
import {
	loadAllSettingsSections,
	loadSettingsSection,
	type SettingsFieldOverride,
	type SettingsSectionSlug,
} from "./settings-sections";

export interface SettingsFieldMeta {
	/** Stable id, unique within its section — matches the field's key in the
	 * underlying config (e.g. "showAuthor"), used to build the search
	 * entry's `key` and its anchor (`#field-<id>`). */
	id: string;
	section: SettingsSectionSlug;
	label: string;
	description: string;
}

/** Built-in fallback label/description for every field — used whenever a
 * section's content/pages/settings/<slug>.json has no override for that
 * field's id (including if the file doesn't mention `fields` at all), so a
 * fresh checkout or a newly-added code field never shows a blank tooltip. */
export const DEFAULT_SETTINGS_FIELDS: SettingsFieldMeta[] = [
	// Homepage & Branding
	{
		id: "brandName",
		section: "home",
		label: "Brand name",
		description:
			"Shown next to the logo in the site header, on every page that renders a header.",
	},
	{
		id: "titleFallback",
		section: "home",
		label: "<title> fallback",
		description:
			"Used for the browser tab's <title> only when the homepage's own CMS content has no title set for the current locale.",
	},
	{
		id: "footerCopyright",
		section: "home",
		label: "Footer copyright",
		description: "The copyright line shown in the site footer.",
	},
	{
		id: "footerLinks",
		section: "home",
		label: "Footer links",
		description:
			"External links shown at the bottom of the footer (e.g. HonoX Docs, PandaCSS Docs) — each has a label, a URL, and an accent color.",
	},

	// Blog
	{
		id: "showAuthor",
		section: "blog",
		label: "Show author byline",
		description:
			"Shows the post author's name and avatar on blog post cards (/blog listing) and the article page. Turn off for a byline-free blog.",
	},
	{
		id: "showReadTime",
		section: "blog",
		label: "Show read time",
		description:
			'Shows the "X min read" estimate on post cards and the article page, computed from each post\'s word count.',
	},
	{
		id: "excludeUntranslatedFromSearch",
		section: "blog",
		label: "Exclude untranslated posts from search",
		description:
			"When on, this locale's blog search only returns posts that actually have a translation into it, instead of silently falling back to the English post. Turn on per-locale only once that locale's translation coverage is complete — otherwise search just returns fewer results than it should.",
	},
	{
		id: "newsletterHeading",
		section: "blog",
		label: "Newsletter heading",
		description: "Heading text for the newsletter signup widget on /blog.",
	},
	{
		id: "newsletterDescription",
		section: "blog",
		label: "Newsletter description",
		description: "Supporting copy shown under the newsletter heading.",
	},

	// Docs
	{
		id: "showHydrationTierBadge",
		section: "docs",
		label: "Show hydration tier badge",
		description:
			"Shows a doc's Tier 1/2/3 hydration badge next to its category badge on the doc page. This is an implementation detail (see the Hydration guide) — turn it off if your readers don't need to know it.",
	},
	{
		id: "fallbackLabel",
		section: "docs",
		label: "Fallback group label",
		description:
			"Sidenav group label used for any doc that doesn't match one of the configured groups (by section or category). Defaults to \"Other\".",
	},
	{
		id: "docOrder",
		section: "docs",
		label: "Explicit doc order",
		description:
			"Doc slugs, in the exact order they should appear within their sidenav group. Any doc not listed here keeps alphabetical order, appended after these.",
	},
	{
		id: "docsUiLabels",
		section: "docs",
		label: "Header / pager labels",
		description:
			"Button and pager copy on doc pages: the Edit/Admin buttons (deep-link into the CMS), the mobile menu disclosure toggle, and the Previous/Next doc pager at the bottom of each doc.",
	},

	// PMS
	{
		id: "subtasksExpandedByDefault",
		section: "pms",
		label: "Subtasks expanded by default",
		description:
			"Whether a task with subtasks starts expanded (showing its children) or collapsed when the /tasks table and a project's board first load.",
	},
	{
		id: "statusColors",
		section: "pms",
		label: "Task status colors",
		description:
			"Accent color for each task Status badge, wherever it renders: the /tasks table, a project's board, and task detail pages. Any status left unset keeps its built-in default color.",
	},
	{
		id: "priorityColors",
		section: "pms",
		label: "Task priority colors",
		description:
			"Accent color for each task Priority badge. Any priority left unset keeps its built-in default color.",
	},
	{
		id: "projectStatusColors",
		section: "pms",
		label: "Project status colors",
		description:
			"Accent color for each project Status badge on /projects and a project's own page. Any status left unset keeps its built-in default color.",
	},

	// CMS Admin
	{
		id: "backendName",
		section: "cms-admin",
		label: "Backend type",
		description:
			"Which git host the CMS admin and every direct-commit editor on this site (including these Settings forms) talk to: github, gitlab, or gitea.",
	},
	{
		id: "backendRepo",
		section: "cms-admin",
		label: "Repository",
		description:
			"The owner/repo every content change is committed to — the CMS admin, the task/project board, and this Settings page all write here.",
	},
	{
		id: "backendBranch",
		section: "cms-admin",
		label: "Branch",
		description: "The branch every direct commit is made against.",
	},
	{
		id: "backendBaseUrl",
		section: "cms-admin",
		label: "Base URL",
		description:
			"The OAuth proxy Worker URL used to authenticate into the CMS. Required for a self-hosted gitea/forgejo instance (no public default); optional for github/gitlab.",
	},
	{
		id: "i18nStructure",
		section: "cms-admin",
		label: "i18n structure",
		description:
			"How translated content files are laid out on disk — e.g. multiple_folders means each locale's files live in their own subfolder alongside the default-locale files. Changing this doesn't move any existing files, so pick this before translating content, not after.",
	},
	{
		id: "i18nLocales",
		section: "cms-admin",
		label: "Locales",
		description:
			"Every locale the CMS and site support, as language codes (en, zh, es, ...). Adding one here doesn't create its content — it just makes the CMS offer it as a translation target.",
	},
	{
		id: "i18nDefaultLocale",
		section: "cms-admin",
		label: "Default locale",
		description:
			"The locale whose content lives at the un-prefixed path (e.g. /docs, not /docs/zh) and that every other locale falls back to when a translation is missing.",
	},
	{
		id: "i18nOmitDefaultLocaleFromFilePath",
		section: "cms-admin",
		label: "Omit default locale from file path",
		description:
			"When on, the default locale's files skip the locale subfolder (content/docs/Intro.md instead of content/docs/en/Intro.md) while every other locale still gets one. Matches this site's actual content layout — turning it off without moving files would break the default locale's content lookup.",
	},
	{
		id: "mediaFolder",
		section: "cms-admin",
		label: "Media folder",
		description: "Where the CMS uploads media files to in the repo.",
	},
	{
		id: "publicFolder",
		section: "cms-admin",
		label: "Public folder",
		description:
			"The public URL path media files are served from once uploaded (e.g. /media).",
	},
];

function defaultsForSection(section: SettingsSectionSlug): SettingsFieldMeta[] {
	return DEFAULT_SETTINGS_FIELDS.filter((field) => field.section === section);
}

/** Merges one section's CMS field overrides (content/pages/settings/<slug>.json's
 * `fields` array — see SettingsFieldOverride) onto the built-in defaults for
 * that section, keyed by id. An override for an id that doesn't match any
 * default field is just ignored (same reasoning as an unrecognized PMS color
 * key) rather than added as a phantom field nothing renders a tooltip for. */
function mergeFieldOverrides(
	section: SettingsSectionSlug,
	overrides: SettingsFieldOverride[],
): SettingsFieldMeta[] {
	const overrideById = new Map(overrides.map((o) => [o.id, o]));
	return defaultsForSection(section).map((field) => {
		const override = overrideById.get(field.id);
		if (!override) return field;
		return {
			...field,
			label: override.label || field.label,
			description: override.description || field.description,
		};
	});
}

/** This section's fields (label + description), CMS overrides merged over
 * the built-in defaults. The only thing the settings-*-form.tsx islands
 * need — they can't call import.meta.glob themselves (that's build-time-only
 * and these islands hydrate in the browser), so a route/the shared
 * app/components/settings-section-form.tsx loads this server-side and passes
 * it down as a plain `descriptions` prop. */
export async function loadSectionFields(
	section: SettingsSectionSlug,
): Promise<SettingsFieldMeta[]> {
	const sectionMeta = await loadSettingsSection(section);
	return mergeFieldOverrides(section, sectionMeta.fields);
}

/** `{ [fieldId]: description }` for one section — the shape the form islands
 * actually consume (see settings-*-form.tsx's `descriptions` prop). */
export async function loadSectionFieldDescriptions(
	section: SettingsSectionSlug,
): Promise<Record<string, string>> {
	const fields = await loadSectionFields(section);
	return Object.fromEntries(fields.map((f) => [f.id, f.description]));
}

/** One SearchIndexEntry per field across every section, for
 * /api/settings/search.json — each entry's href lands on that field's
 * section page (no in-page anchor/scroll yet, just the right page). */
export async function buildSettingsSearchIndex(): Promise<SearchIndexEntry[]> {
	const sections = await loadAllSettingsSections();
	const entries: SearchIndexEntry[] = [];
	for (const section of sections) {
		const fields = mergeFieldOverrides(section.slug, section.fields);
		const href = section.slug === "home" ? "/settings" : `/settings/${section.slug}`;
		for (const field of fields) {
			entries.push({
				key: `${section.slug}-${field.id}`,
				href,
				title: field.label,
				description: field.description,
				tags: [section.title],
				haystack: buildHaystack([field.label, field.description, section.title]),
			});
		}
	}
	return entries;
}
