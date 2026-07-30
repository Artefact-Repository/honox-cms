// /settings/<slug> — same sidenav shell as app/routes/settings/index.tsx
// (intentionally duplicated, not imported — see that file's module comment),
// showing whichever section the URL names instead of always "home".
import { css } from "design-system/css";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { PageRenderer } from "../../components/page-renderer";
import { renderSettingsSectionForm } from "../../components/settings-section-form";
import { Card, Layout, type LayoutProps, Search } from "../../components/ui";
import { Toaster } from "../../components/ui/toast";
import AuthStatus from "../../islands/auth-status";
import SettingsAuthBanner from "../../islands/settings-auth-banner";
import { loadPage } from "../../lib/pages";
import {
	loadAllSettingsSections,
	SETTINGS_SECTION_SLUGS,
	type SettingsSectionSlug,
} from "../../lib/settings-sections";

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

function isSettingsSection(value: string): value is SettingsSectionSlug {
	return (SETTINGS_SECTION_SLUGS as readonly string[]).includes(value);
}

export default createRoute(
	ssgParams(() =>
		SETTINGS_SECTION_SLUGS.filter((slug) => slug !== "home").map((section) => ({
			section,
		})),
	),
	async (c) => {
		const sectionParam = c.req.param("section");
		if (!isSettingsSection(sectionParam)) return c.notFound();

		const [sections, pageData, form] = await Promise.all([
			loadAllSettingsSections(),
			loadPage("settings", "en", { currentUrl: c.req.url }).then(
				(page) => page ?? { content: [] },
			),
			renderSettingsSectionForm(sectionParam),
		]);
		const active = sections.find((s) => s.slug === sectionParam);

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
						<nav
							class={css({ display: "flex", gap: "6", alignItems: "center" })}
						>
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
						<SettingsSidenav sections={sections} activeSlug={sectionParam} />
					</>
				}
				mobileNavActions={<AuthStatus />}
				content={
					<>
						<title>
							{active
								? `${active.title} Settings - Artefact`
								: "Settings - Artefact"}
						</title>
						<Toaster />

						<SettingsAuthBanner />

						<Card
							variant="outline"
							title={active?.title ?? sectionParam}
							description={active?.description}
							headerClass={css({ p: "5", pb: "3" })}
							bodyClass={css({ p: "5", pt: "0" })}
						>
							{form}
						</Card>
					</>
				}
			/>,
		);
	},
);
