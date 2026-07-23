import { css } from "design-system/css";
import { createRoute } from "honox/factory";
import { PageRenderer } from "../components/page-renderer";
import { renderBlocks } from "../components/page-registry";
import { Anchor, Avatar, Stack, Text } from "../components/ui";
import { loadDocsConfig } from "../lib/configs";
import { detectLocale } from "../lib/i18n";
import { loadPage } from "../lib/pages";

export default createRoute(async (c) => {
	const currentPath = c.req.path;
	const currentLocale = detectLocale(currentPath);

	const [data, config] = await Promise.all([
		loadPage("index", currentLocale).then((page) => page ?? { content: [] }),
		loadDocsConfig(currentLocale),
	]);
	const home = config.home ?? {};

	return c.render(
		<div class={css({ bg: "bg.canvas", minH: "screen", color: "fg.default" })}>
			<title>
				{data.title ?? home.titleFallback ?? "Artefact — Modern UI Suite"}
			</title>

			{/* Beautiful Header */}
			<header
				class={css({
					borderBottomWidth: "1px",
					borderColor: { _light: "white.a4", _dark: "black.a4" },
					bg: { _light: "white.a7", _dark: "black.a7" },
					backdropFilter: "blur(20px) saturate(180%)",
					boxShadow: {
						_light:
							"inset 0 1px 0 0 rgba(255, 255, 255, 0.5), 0 4px 30px rgba(0, 0, 0, 0.03)",
						_dark:
							"inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 4px 30px rgba(0, 0, 0, 0.2)",
					},
					position: "sticky",
					top: "0",
					zIndex: "10",
				})}
			>
				<div
					class={css({
						maxW: "6xl",
						mx: "auto",
						px: "6",
						py: "4",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					})}
				>
					<PageRenderer content={data.headerBrand ?? []} />

					<nav
						class={css({
							display: "flex",
							gap: { base: "3", md: "6" },
							alignItems: "center",
						})}
					>
						<PageRenderer content={data.headerNav ?? []} />
						{/* Appearance popover + language dropdown live once in
						`config.headerItems` and are reused here — everything
						else in that list (Blog/Docs/Product links) is already
						covered by `data.headerNav` above. */}
						{renderBlocks(
							config.headerItems?.filter(
								(item) => item.type === "popover" || item.type === "dropdown",
							),
							{ locale: currentLocale, currentPath },
						)}
						<PageRenderer content={data.headerActions ?? []} />
					</nav>
				</div>
			</header>

			{/* CMS-driven body — content/pages/index.json, edit via /admin */}
			<div
				class={css({
					maxWidth: "5xl",
					mx: "auto",
					px: "4",
					py: "12",
					display: "flex",
					flexDirection: "column",
					gap: "10",
				})}
			>
				<PageRenderer content={data.content} />
			</div>

			{/* Beautiful Footer */}
			<footer
				class={css({
					bg: "bg.canvas",
					borderTopWidth: "1px",
					borderColor: "border",
					py: "12",
					px: "6",
				})}
			>
				<div
					class={css({
						maxW: "6xl",
						mx: "auto",
						display: "flex",
						flexDirection: { base: "column", md: "row" },
						justify: "space-between",
						align: "center",
						gap: "6",
					})}
				>
					<Stack direction="horizontal" gap="3" align="center">
						<Avatar
							name={home.brandName ?? "Artefact UI"}
							size="xs"
							variant="solid"
							colorPalette="blue"
						/>
						<Text size="sm" class={css({ fontWeight: "semibold" })}>
							{home.footerCopyright ??
								"© 2025 Artefact UI Suite. All rights reserved."}
						</Text>
					</Stack>

					<Stack direction="horizontal" gap="6">
						{(home.footerLinks ?? []).map((link) => (
							<Anchor
								href={link.href}
								target="_blank"
								variant="underline"
								colorPalette={(link.colorPalette ?? "gray") as any}
								class={css({ textStyle: "sm" })}
							>
								{link.label}
							</Anchor>
						))}
					</Stack>
				</div>
			</footer>
		</div>,
	);
});
