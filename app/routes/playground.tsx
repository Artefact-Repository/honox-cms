import { css } from "design-system/css";
import { createRoute } from "honox/factory";
import PlaygroundIsland, {
	type PlaygroundPage,
} from "../islands/playground";
import { listPageSlugs, loadPage } from "../lib/pages";

export default createRoute(async (c) => {
	const slugs = listPageSlugs().sort((a, b) => a.localeCompare(b));

	const pages = (
		await Promise.all(
			slugs.map(async (slug): Promise<PlaygroundPage | undefined> => {
				const data = await loadPage(slug, "en");
				if (!data) return undefined;
				return {
					slug,
					title: typeof data.title === "string" ? data.title : slug,
					json: JSON.stringify(data, null, 2),
				};
			}),
		)
	).filter((page): page is PlaygroundPage => page !== undefined);

	return c.render(
		<div
			class={css({
				bg: "bg.canvas",
				minH: "screen",
				color: "fg.default",
				display: "flex",
				flexDirection: "column",
			})}
		>
			<title>Playground — Artefact UI</title>

			<header
				class={css({
					borderBottomWidth: "1px",
					borderColor: "border.default",
					bg: "bg.subtle",
				})}
			>
				<div
					class={css({
						maxW: "[120rem]",
						mx: "auto",
						px: "4",
						py: "3",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "4",
						flexWrap: "wrap",
					})}
				>
					<a
						href="/"
						class={css({ fontWeight: "600", flexShrink: "0" })}
					>
						Artefact UI
					</a>
					<span
						class={css({
							fontSize: "sm",
							color: "fg.muted",
						})}
					>
						Playground — pick a CMS page to see its JSON source next to the
						live render
					</span>
				</div>
			</header>

			<PlaygroundIsland
				pages={pages}
				defaultSlug={pages.some((p) => p.slug === "about") ? "about" : pages[0]?.slug}
			/>
		</div>,
	);
});
