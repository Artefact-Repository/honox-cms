// Editable overview of every site-wide setting stored on the `configs`
// singleton (content/configs.json) — homepage/branding, blog, docs, and PMS
// (projects/tasks) behavior. Each card below is a client island that saves
// straight to the git host via app/utils/settings-save.ts (same direct-commit
// path as the tasks/projects editors) — no separate backend, same as every
// other collection. The singleton is also still fully editable through the
// CMS itself (public/admin/config.yml's `singletons: configs`); this page
// exists so these specific, frequently-tweaked values don't require opening
// the full CMS entry.
import { readFileSync } from "node:fs";
import path from "node:path";
import { css } from "design-system/css";
import { createRoute } from "honox/factory";
import { parseDocument } from "yaml";
import { Anchor, Card, Heading, Text } from "../../components/ui";
import { Toaster } from "../../components/ui/toast";
import AuthStatus from "../../islands/auth-status";
import BlogSettingsForm from "../../islands/settings-blog-form";
import CmsAdminSettingsForm from "../../islands/settings-cms-admin-form";
import DocsSettingsForm from "../../islands/settings-docs-form";
import HomeSettingsForm from "../../islands/settings-home-form";
import PmsSettingsForm from "../../islands/settings-pms-form";
import { loadDocsConfig } from "../../lib/configs";
import { mergeColorOverrides } from "../../lib/pms-config";
import { PROJECT_STATUS_COLOR } from "../../lib/projects";
import { TASK_PRIORITY_COLOR, TASK_STATUS_COLOR } from "../../lib/tasks";

const CMS_ADMIN_HREF = "/admin/";

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
		backend?: { name?: string; repo?: string; branch?: string; base_url?: string };
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

export default createRoute(async (c) => {
	const config = await loadDocsConfig("en");
	const cmsAdmin = loadCmsAdminSettingsFromDisk();
	const home = config.home ?? {};
	const blog = config.blog ?? {};
	const docsUi = config.docsUi ?? {};
	const docsCfg = config.docs ?? {};
	const pms = config.pms ?? {};

	const statusColor = mergeColorOverrides(
		TASK_STATUS_COLOR,
		pms.statusColors,
		"status",
	);
	const priorityColor = mergeColorOverrides(
		TASK_PRIORITY_COLOR,
		pms.priorityColors,
		"priority",
	);
	const projectStatusColor = mergeColorOverrides(
		PROJECT_STATUS_COLOR,
		pms.projectStatusColors,
		"status",
	);
	const groupsSummary =
		config.groups.length > 0
			? config.groups.map((g) => g.label).join(", ")
			: "—";

	return c.render(
		<>
			<title>Settings - Artefact</title>
			<Toaster />

			<header
				class={css({
					borderBottomWidth: "1px",
					borderColor: { _light: "white.a4", _dark: "black.a4" },
					bg: { _light: "white.a7", _dark: "black.a7" },
					backdropFilter: "blur(20px) saturate(180%)",
					position: "sticky",
					top: "0",
					zIndex: "10",
				})}
			>
				<div
					class={css({
						maxWidth: "5xl",
						mx: "auto",
						px: { base: "4", md: "6", lg: "8" },
						py: "4",
						display: "flex",
						flexWrap: "wrap",
						rowGap: "3",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "4",
					})}
				>
					<Anchor
						href="/"
						variant="plain"
						class={css({ textDecoration: "none", flexShrink: "0" })}
					>
						<Heading
							as="span"
							class={css({ fontSize: "lg", fontWeight: "bold", tracking: "tight" })}
						>
							Artefact UI
						</Heading>
					</Anchor>

					<nav class={css({ display: "flex", gap: "6", alignItems: "center" })}>
						<Anchor
							href="/projects"
							variant="plain"
							class={css({
								textStyle: "sm",
								fontWeight: "medium",
								color: "fg.muted",
								textDecoration: "none",
								_hover: { color: "fg" },
							})}
						>
							Projects
						</Anchor>
						<Anchor
							href="/tasks"
							variant="plain"
							class={css({
								textStyle: "sm",
								fontWeight: "medium",
								color: "fg.muted",
								textDecoration: "none",
								_hover: { color: "fg" },
							})}
						>
							Tasks
						</Anchor>
						<Anchor
							href="/settings"
							variant="plain"
							class={css({
								textStyle: "sm",
								fontWeight: "semibold",
								color: "fg",
								textDecoration: "none",
							})}
						>
							Settings
						</Anchor>
						<AuthStatus />
					</nav>
				</div>
			</header>

			<div
				class={css({
					py: { base: "8", md: "12" },
					px: { base: "4", md: "6", lg: "8" },
					maxWidth: "5xl",
					mx: "auto",
					display: "flex",
					flexDirection: "column",
					gap: "6",
				})}
			>
				<div>
					<Heading as="h1" size="3xl" class={css({ mb: "2" })}>
						Settings
					</Heading>
					<Text class={css({ color: "fg.muted" })}>
						Every site-wide setting, read from the{" "}
						<Text as="span" class={css({ fontWeight: "medium", color: "fg" })}>
							Configs
						</Text>{" "}
						singleton (
						<Text as="span" class={css({ fontFamily: "mono", fontSize: "xs" })}>
							content/configs.json
						</Text>
						). "Save changes" below commits straight to the repo — same as
						editing it in{" "}
						<Anchor href={CMS_ADMIN_HREF} variant="plain">
							/admin
						</Anchor>
						.
					</Text>
				</div>

				<Card
					variant="outline"
					title="Homepage & Branding"
					description="Header brand name, <title> fallback, and footer content shown across the site."
					headerClass={css({ p: "5", pb: "3" })}
					bodyClass={css({ p: "5", pt: "0" })}
				>
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
				</Card>

				<Card
					variant="outline"
					title="Blog"
					description="Post byline display and the /blog newsletter widget's copy."
					headerClass={css({ p: "5", pb: "3" })}
					bodyClass={css({ p: "5", pt: "0" })}
				>
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
				</Card>

				<Card
					variant="outline"
					title="Docs"
					description="Sidenav grouping and doc-page chrome for the /docs section."
					headerClass={css({ p: "5", pb: "3" })}
					bodyClass={css({ p: "5", pt: "0" })}
				>
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
				</Card>

				<Card
					variant="outline"
					title="PMS (Projects & Tasks)"
					description="Accent colors for status/priority badges across /tasks and /projects, and the subtask tree's default state."
					headerClass={css({ p: "5", pb: "3" })}
					bodyClass={css({ p: "5", pt: "0" })}
				>
					<PmsSettingsForm
						initial={{
							subtasksExpandedByDefault: pms.subtasksExpandedByDefault !== false,
							statusColors: statusColor,
							priorityColors: priorityColor,
							projectStatusColors: projectStatusColor,
						}}
					/>
				</Card>

				<Card
					variant="outline"
					title="CMS Admin"
					description="Sveltia CMS's own bootstrap config (public/admin/config.yml) — backend connection, i18n locales, and media storage paths."
					headerClass={css({ p: "5", pb: "3" })}
					bodyClass={css({ p: "5", pt: "0" })}
				>
					<CmsAdminSettingsForm initial={cmsAdmin} />
				</Card>
			</div>
		</>,
	);
});
