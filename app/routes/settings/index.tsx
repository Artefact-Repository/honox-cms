// A read-only overview of every site-wide setting stored on the `configs`
// singleton (content/configs.json) — homepage/branding, blog, docs, and PMS
// (projects/tasks) behavior. This page doesn't write anything itself: the
// singleton is already a full Sveltia CMS entry (public/admin/config.yml's
// `singletons: configs`), so editing happens there, git-backed, same as
// every other collection. This page exists to give a single place to see
// what's currently configured across sections that otherwise live scattered
// across unrelated routes, plus a shortcut into the CMS to change them.
import { css } from "design-system/css";
import { createRoute } from "honox/factory";
import {
	Anchor,
	Badge,
	Card,
	Heading,
	Stack,
	Table,
	Text,
} from "../../components/ui";
import AuthStatus from "../../islands/auth-status";
import { loadDocsConfig } from "../../lib/configs";
import { mergeColorOverrides } from "../../lib/pms-config";
import { PROJECT_STATUS_COLOR } from "../../lib/projects";
import { TASK_PRIORITY_COLOR, TASK_STATUS_COLOR } from "../../lib/tasks";

const CMS_ADMIN_HREF = "/admin/";

interface SettingRow {
	setting: string;
	value: JSX.Element | string;
}

function BoolBadge({ value }: { value: boolean }) {
	return (
		<Badge variant="subtle" size="sm" colorPalette={value ? "green" : "gray"}>
			{value ? "On" : "Off"}
		</Badge>
	);
}

function ColorSwatches({
	entries,
}: {
	entries: [label: string, colorPalette: string][];
}) {
	return (
		<Stack gap="1.5" wrap="wrap">
			{entries.map(([label, colorPalette]) => (
				<Badge key={label} variant="subtle" size="sm" colorPalette={colorPalette}>
					{label}
				</Badge>
			))}
		</Stack>
	);
}

function SettingsCard({
	title,
	description,
	rows,
}: {
	title: string;
	description: string;
	rows: SettingRow[];
}) {
	return (
		<Card
			variant="outline"
			title={title}
			description={description}
			headerClass={css({ p: "5", pb: "3" })}
			bodyClass={css({ p: "0" })}
		>
			<Table
				variant="plain"
				columns={[
					{
						header: "Setting",
						key: "setting",
						class: css({ width: "44%", color: "fg.muted" }),
						render: (row: SettingRow) => (
							<Text size="sm" class={css({ color: "fg.muted" })}>
								{row.setting}
							</Text>
						),
					},
					{
						header: "Value",
						key: "value",
						render: (row: SettingRow) =>
							typeof row.value === "string" ? (
								<Text size="sm">{row.value}</Text>
							) : (
								row.value
							),
					},
				]}
				rows={rows}
			/>
		</Card>
	);
}

export default createRoute(async (c) => {
	const config = await loadDocsConfig("en");
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

	return c.render(
		<>
			<title>Settings - Artefact</title>

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
						). Changes are made in the CMS, git-backed like everything else —{" "}
						<Anchor href={CMS_ADMIN_HREF} variant="plain">
							open the Configs entry in /admin →
						</Anchor>
					</Text>
				</div>

				<SettingsCard
					title="Homepage & Branding"
					description="Header brand name, <title> fallback, and footer content shown across the site."
					rows={[
						{ setting: "Brand name", value: home.brandName || "—" },
						{
							setting: "<title> fallback",
							value: home.titleFallback || "—",
						},
						{
							setting: "Footer copyright",
							value: home.footerCopyright || "—",
						},
						{
							setting: "Footer links",
							value:
								home.footerLinks && home.footerLinks.length > 0 ? (
									<Stack gap="1.5" wrap="wrap">
										{home.footerLinks.map((link) => (
											<Badge
												key={link.href}
												variant="subtle"
												size="sm"
												colorPalette={link.colorPalette || "gray"}
											>
												{link.label}
											</Badge>
										))}
									</Stack>
								) : (
									"—"
								),
						},
					]}
				/>

				<SettingsCard
					title="Blog"
					description="Post byline display and the /blog newsletter widget's copy."
					rows={[
						{
							setting: "Show author byline",
							value: <BoolBadge value={blog.showAuthor !== false} />,
						},
						{
							setting: "Show read time",
							value: <BoolBadge value={blog.showReadTime !== false} />,
						},
						{
							setting: "Exclude untranslated posts from search",
							value: (
								<BoolBadge value={blog.excludeUntranslatedFromSearch === true} />
							),
						},
						{
							setting: "Newsletter heading",
							value: blog.newsletterHeading || "—",
						},
						{
							setting: "Newsletter description",
							value: blog.newsletterDescription || "—",
						},
					]}
				/>

				<SettingsCard
					title="Docs"
					description="Sidenav grouping and doc-page chrome for the /docs section."
					rows={[
						{
							setting: "Show hydration tier badge",
							value: (
								<BoolBadge value={docsCfg.showHydrationTierBadge !== false} />
							),
						},
						{
							setting: "Fallback group label",
							value: config.fallbackLabel || "Other",
						},
						{
							setting: "Explicit doc order",
							value:
								config.docOrder && config.docOrder.length > 0
									? config.docOrder.join(", ")
									: "Alphabetical (none set)",
						},
						{
							setting: "Sidenav groups",
							value:
								config.groups.length > 0
									? config.groups.map((g) => g.label).join(", ")
									: "—",
						},
						{
							setting: "Header/pager labels",
							value: `Edit="${docsUi.edit ?? "Edit"}", Admin="${
								docsUi.admin ?? "Admin"
							}", Menu="${docsUi.menu ?? "Menu"}", Previous="${
								docsUi.previous ?? "Previous"
							}", Next="${docsUi.next ?? "Next"}"`,
						},
					]}
				/>

				<SettingsCard
					title="PMS (Projects & Tasks)"
					description="Accent colors for status/priority badges across /tasks and /projects, and the subtask tree's default state."
					rows={[
						{
							setting: "Subtasks expanded by default",
							value: (
								<BoolBadge value={pms.subtasksExpandedByDefault !== false} />
							),
						},
						{
							setting: "Task status colors",
							value: (
								<ColorSwatches
									entries={Object.entries(statusColor) as [string, string][]}
								/>
							),
						},
						{
							setting: "Task priority colors",
							value: (
								<ColorSwatches
									entries={Object.entries(priorityColor) as [string, string][]}
								/>
							),
						},
						{
							setting: "Project status colors",
							value: (
								<ColorSwatches
									entries={
										Object.entries(projectStatusColor) as [string, string][]
									}
								/>
							),
						},
					]}
				/>
			</div>
		</>,
	);
});
