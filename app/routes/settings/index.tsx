// /settings — sidenav shell (every section from the "settings" CMS
// collection, content/pages/settings/<slug>.json) defaulting to the
// "Homepage & Branding" section. Each section's actual editable values still
// live on the `configs` singleton (content/configs.json), saved straight to
// the git host via app/utils/settings-save.ts — same direct-commit path as
// the tasks/projects editors — see app/components/settings-section-form.tsx
// for the slug → form mapping shared with app/routes/settings/[section].tsx.
import { css } from "design-system/css";
import { createRoute } from "honox/factory";
import { PageRenderer } from "../../components/page-renderer";
import { renderSettingsSectionForm } from "../../components/settings-section-form";
import { Card, Layout, type LayoutProps, Search } from "../../components/ui";
import { Toaster } from "../../components/ui/toast";
import AuthStatus from "../../islands/auth-status";
import SettingsAuthBanner from "../../islands/settings-auth-banner";
import { loadPage } from "../../lib/pages";
import { loadAllSettingsSections } from "../../lib/settings-sections";

/** Flat list of every settings section — no groups needed (unlike docs'
 * sidenav), so this is much simpler than DocsSidenav. Duplicated (not
 * imported) into app/routes/settings/[section].tsx, matching this repo's
 * established preference for each settings/docs route staying fully
 * self-contained rather than sharing a nav shell component (see
 * app/routes/docs/index.tsx's module comment). */
function SettingsSidenav({
	sections,
	activeSlug,
}: {
	sections: { slug: string; title: string }[];
	activeSlug: string;
}) {
	return (
		<nav class={css({ display: "flex", flexDirection: "column", gap: "0.5" })}>
			{sections.map((section) => {
				const isActive = section.slug === activeSlug;
				const href =
					section.slug === "home" ? "/settings" : `/settings/${section.slug}`;
				return (
					<a
						key={section.slug}
						href={href}
						aria-current={isActive ? "page" : undefined}
						class={css({
							display: "block",
							px: "3",
							py: { base: "2.5", md: "1.5" },
							borderRadius: "md",
							fontSize: "sm",
							textDecoration: "none",
							color: isActive ? "fg" : "fg.muted",
							bg: isActive ? "blue.4" : "transparent",
							fontWeight: isActive ? "semibold" : "normal",
							_hover: { bg: isActive ? "blue.4" : "bg.subtle", color: "fg" },
						})}
					>
						{section.title}
					</a>
				);
			})}
		</nav>
	);
}

const settingsShellProps = {
	fullHeight: true,
	stickyHeader: true,
	stickySider: true,
	siderHideBelow: "md",
	mobileNav: true,
	mobileNavLabel: "Menu",
	class: css({ bg: "bg.canvas" }),
	headerClass: css({
		borderBottomWidth: "1px",
		borderColor: { _light: "white.a4", _dark: "black.a4" },
		bg: { _light: "white.a7", _dark: "black.a7" },
		backdropFilter: "blur(20px) saturate(180%)",
	}),
	bodyClass: css({
		maxWidth: "5xl",
		width: "full",
		mx: "auto",
		px: { base: "4", md: "6", lg: "8" },
		py: { base: "8", md: "12" },
		gap: "8",
	}),
	siderClass: css({ top: "20", maxH: "calc(100vh - 6rem)" }),
} satisfies Partial<LayoutProps>;

export default createRoute(async (c) => {
	const [sections, pageData, form] = await Promise.all([
		loadAllSettingsSections(),
		loadPage("settings", "en", { currentUrl: c.req.url }).then(
			(page) => page ?? { content: [] },
		),
		renderSettingsSectionForm("home"),
	]);
	const home = sections.find((s) => s.slug === "home");

	return c.render(
		<Layout
			{...settingsShellProps}
			header={
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
					<PageRenderer content={pageData.headerBrand ?? []} />
					<nav class={css({ display: "flex", gap: "6", alignItems: "center" })}>
						<PageRenderer content={pageData.headerNav ?? []} />
						<PageRenderer content={pageData.headerActions ?? []} />
						<AuthStatus />
					</nav>
				</div>
			}
			sider={
				<>
					<Search
						size="sm"
						src="/api/settings/search.json"
						placeholder="Search settings..."
						itemLabel="settings"
						showCount={false}
						syncUrl={false}
						class={css({ mb: "4" })}
					/>
					<SettingsSidenav sections={sections} activeSlug="home" />
				</>
			}
			mobileNavActions={<AuthStatus />}
			content={
				<>
					<title>{pageData.title ?? "Settings - Artefact"}</title>
					<Toaster />

					<PageRenderer content={pageData.content ?? []} />

					<SettingsAuthBanner />

					<Card
						variant="outline"
						title={home?.title ?? "Homepage & Branding"}
						description={home?.description}
						headerClass={css({ p: "5", pb: "3" })}
						bodyClass={css({ p: "5", pt: "0" })}
					>
						{form}
					</Card>
				</>
			}
		/>,
	);
});
