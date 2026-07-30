// Sidenav title/description copy for each /settings/<slug> section page —
// content/pages/settings/<slug>.json, the "settings" CMS collection
// (public/admin/config.yml). Separate from app/lib/pages.ts's generic pages
// loader (which globs content/pages/**/*.json for i18n reasons and would
// treat this folder's "settings" segment as a bogus locale) even though the
// files live in a similarly-named place — this is its own small, flat,
// non-i18n collection, same reasoning as tasks/projects.
const sectionModules = (
	typeof import.meta.glob === "function"
		? import.meta.glob("/content/pages/settings/*.json", {
				import: "default",
			})
		: {}
) as Record<string, () => Promise<{ title: string; description: string }>>;

/** Fixed, code-defined order — each slug corresponds to one hardcoded form
 * island in app/routes/settings/[section].tsx, so adding a 6th section needs
 * a code change here (and a form/route to match) regardless of the CMS. */
export const SETTINGS_SECTION_SLUGS = [
	"home",
	"blog",
	"docs",
	"pms",
	"cms-admin",
] as const;

export type SettingsSectionSlug = (typeof SETTINGS_SECTION_SLUGS)[number];

export interface SettingsSectionMeta {
	slug: SettingsSectionSlug;
	title: string;
	description: string;
}

const FALLBACK_TITLE: Record<SettingsSectionSlug, string> = {
	home: "Homepage & Branding",
	blog: "Blog",
	docs: "Docs",
	pms: "PMS (Projects & Tasks)",
	"cms-admin": "CMS Admin",
};

/** Loads one section's title/description, falling back to a hardcoded title
 * (and empty description) if its content/pages/settings/<slug>.json is
 * missing — same degrade-gracefully precedent as data-sources.ts. */
export async function loadSettingsSection(
	slug: SettingsSectionSlug,
): Promise<SettingsSectionMeta> {
	const loader = sectionModules[`/content/pages/settings/${slug}.json`];
	if (!loader) {
		return { slug, title: FALLBACK_TITLE[slug], description: "" };
	}
	const data = await loader();
	return {
		slug,
		title: data.title || FALLBACK_TITLE[slug],
		description: data.description ?? "",
	};
}

/** Every section's meta, in the fixed sidenav order. */
export async function loadAllSettingsSections(): Promise<
	SettingsSectionMeta[]
> {
	return Promise.all(SETTINGS_SECTION_SLUGS.map(loadSettingsSection));
}
