// Loads whichever data one /settings/<slug> section's form needs and
// returns just that form element — shared by app/routes/settings/index.tsx
// (which shows this for the default "home" section) and
// app/routes/settings/[section].tsx (every other section), so the "which
// section needs which config slice" mapping lives in exactly one place
// rather than being copied into both route files.
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import BlogSettingsForm from "../islands/settings-blog-form";
import CmsAdminSettingsForm from "../islands/settings-cms-admin-form";
import DocsSettingsForm from "../islands/settings-docs-form";
import HomeSettingsForm from "../islands/settings-home-form";
import PmsSettingsForm from "../islands/settings-pms-form";
import { loadDocsConfig } from "../lib/configs";
import { mergeColorOverrides } from "../lib/pms-config";
import { PROJECT_STATUS_COLOR } from "../lib/projects";
import type { SettingsSectionSlug } from "../lib/settings-sections";
import { TASK_PRIORITY_COLOR, TASK_STATUS_COLOR } from "../lib/tasks";

/** Reads public/admin/config.yml straight off disk — this only ever runs at
 * build time (every route handler here executes once per static page during
 * `vite build`, see app/lib/configs.ts's module comment on the SSG model),
 * never in the deployed static site, so plain Node fs access is safe. Vite's
 * `import.meta.glob` can't reach this file since it lives under `public/`,
 * which Vite deliberately excludes from its module graph (that's the whole
 * reason this file has to be read as YAML off disk instead of imported like
 * content/configs.json). `maxAliasCount: -1` disables the parser's default
 * anti-DoS alias limit (100) — this file's page-builder component schema
 * reuses far more anchors than that (same reason git-backend.ts's
 * getRepoConfig needs the same option to read this file client-side). */
function loadCmsAdminSettingsFromDisk() {
	const filePath = path.join(process.cwd(), "public/admin/config.yml");
	const raw = readFileSync(filePath, "utf-8");
	const doc = parseDocument(raw, { maxAliasCount: -1 });
	// `maxAliasCount` on parseDocument only bounds the parse step — toJS()
	// re-checks it independently when resolving aliases into plain values,
	// so it has to be passed here too or this throws on this exact file.
	const data = doc.toJS({ maxAliasCount: -1 }) as {
		backend?: {
			name?: string;
			repo?: string;
			branch?: string;
			base_url?: string;
		};
		i18n?: {
			structure?: string;
			locales?: string[];
			default_locale?: string;
			omit_default_locale_from_file_path?: boolean;
		};
		media_folder?: string;
		public_folder?: string;
	};
	return {
		backend: {
			name: data.backend?.name ?? "github",
			repo: data.backend?.repo ?? "",
			branch: data.backend?.branch ?? "main",
			baseUrl: data.backend?.base_url ?? "",
		},
		i18n: {
			structure: data.i18n?.structure ?? "multiple_folders",
			locales: data.i18n?.locales ?? ["en"],
			defaultLocale: data.i18n?.default_locale ?? "en",
			omitDefaultLocaleFromFilePath:
				data.i18n?.omit_default_locale_from_file_path ?? true,
		},
		media: {
			mediaFolder: data.media_folder ?? "/public/media",
			publicFolder: data.public_folder ?? "/media",
		},
	};
}

export async function renderSettingsSectionForm(slug: SettingsSectionSlug) {
	const config = await loadDocsConfig("en");

	switch (slug) {
		case "home": {
			const home = config.home ?? {};
			return (
				<HomeSettingsForm
					initial={{
						brandName: home.brandName ?? "",
						titleFallback: home.titleFallback ?? "",
						footerCopyright: home.footerCopyright ?? "",
						footerLinks: (home.footerLinks ?? []).map((link) => ({
							label: link.label,
							href: link.href,
							colorPalette: link.colorPalette || "gray",
						})),
					}}
				/>
			);
		}
		case "blog": {
			const blog = config.blog ?? {};
			return (
				<BlogSettingsForm
					initial={{
						showAuthor: blog.showAuthor !== false,
						showReadTime: blog.showReadTime !== false,
						excludeUntranslatedFromSearch:
							blog.excludeUntranslatedFromSearch === true,
						newsletterHeading: blog.newsletterHeading ?? "",
						newsletterDescription: blog.newsletterDescription ?? "",
					}}
				/>
			);
		}
		case "docs": {
			const docsUi = config.docsUi ?? {};
			const docsCfg = config.docs ?? {};
			const groupsSummary =
				config.groups.length > 0
					? config.groups.map((g) => g.label).join(", ")
					: "—";
			return (
				<DocsSettingsForm
					initial={{
						showHydrationTierBadge: docsCfg.showHydrationTierBadge !== false,
						fallbackLabel: config.fallbackLabel || "Other",
						docOrder: config.docOrder ?? [],
						docsUi: {
							edit: docsUi.edit ?? "Edit",
							admin: docsUi.admin ?? "Admin",
							menu: docsUi.menu ?? "Menu",
							previous: docsUi.previous ?? "Previous",
							next: docsUi.next ?? "Next",
						},
					}}
					groupsSummary={groupsSummary}
				/>
			);
		}
		case "pms": {
			const pms = config.pms ?? {};
			return (
				<PmsSettingsForm
					initial={{
						subtasksExpandedByDefault: pms.subtasksExpandedByDefault !== false,
						statusColors: mergeColorOverrides(
							TASK_STATUS_COLOR,
							pms.statusColors,
							"status",
						),
						priorityColors: mergeColorOverrides(
							TASK_PRIORITY_COLOR,
							pms.priorityColors,
							"priority",
						),
						projectStatusColors: mergeColorOverrides(
							PROJECT_STATUS_COLOR,
							pms.projectStatusColors,
							"status",
						),
					}}
				/>
			);
		}
		case "cms-admin": {
			return <CmsAdminSettingsForm initial={loadCmsAdminSettingsFromDisk()} />;
		}
	}
}
