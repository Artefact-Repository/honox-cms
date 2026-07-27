import { css } from "design-system/css";
import { createRoute } from "honox/factory";
import PlaygroundIsland from "../../islands/playground";
import { listPageSlugs, loadPage } from "../../lib/pages";

export default createRoute(async (c) => {
	const slugs = listPageSlugs();
	const pages = await Promise.all(
		slugs.map(async (slug) => {
			const data = await loadPage(slug);
			return {
				slug,
				json: JSON.stringify(data, null, 2),
			};
		}),
	);

	// Sort pages so 'about' is first as requested, then alphabetical
	pages.sort((a, b) => {
		if (a.slug === "about") return -1;
		if (b.slug === "about") return 1;
		return a.slug.localeCompare(b.slug);
	});

	return c.render(
		<div
			class={css({
				bg: "bg.canvas",
				minH: "screen",
				color: "fg.default",
			})}
		>
			<title>Playground — Artefact UI</title>

			{/* Clean Header */}
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
					<a
						href="/"
						class={css({
							display: "flex",
							alignItems: "center",
							gap: "2",
							fontWeight: "bold",
							fontSize: "lg",
						})}
					>
						Artefact UI Playground
					</a>
					<a
						href="/"
						class={css({
							fontSize: "sm",
							fontWeight: "medium",
							color: "fg.muted",
							_hover: { color: "fg.default" },
						})}
					>
						Back to Home
					</a>
				</div>
			</header>

			{/* Main Editor Component */}
			<main>
				<PlaygroundIsland pages={pages} />
			</main>
		</div>,
	);
});
