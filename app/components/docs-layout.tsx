import { css } from "design-system/css";
import type { DocSummary } from "../lib/docs";
import { Text } from "./ui";

interface DocsLayoutProps {
	docs: DocSummary[];
	activeSlug?: string;
	children?: unknown;
}

const CATEGORY_ORDER: DocSummary["category"][] = ["Guides", "Components"];

export function DocsLayout({ docs, activeSlug, children }: DocsLayoutProps) {
	const groups = CATEGORY_ORDER.map((category) => ({
		category,
		items: docs.filter((doc) => doc.category === category),
	})).filter((group) => group.items.length > 0);

	return (
		<div class={css({ bg: "bg.canvas", minH: "screen" })}>
			<div
				class={css({
					maxWidth: "7xl",
					mx: "auto",
					px: { base: "4", md: "6", lg: "8" },
					py: { base: "8", md: "12" },
					display: "flex",
					alignItems: "flex-start",
					gap: "10",
				})}
			>
				<aside
					class={css({
						display: { base: "none", md: "block" },
						width: "64",
						flexShrink: "0",
						position: "sticky",
						top: "6",
						maxH: "calc(100vh - 3rem)",
						overflowY: "auto",
					})}
				>
					<nav
						class={css({
							display: "flex",
							flexDirection: "column",
							gap: "6",
						})}
					>
						{groups.map((group) => (
							<div key={group.category}>
								<Text
									size="xs"
									class={css({
										fontWeight: "semibold",
										textTransform: "uppercase",
										letterSpacing: "wide",
										color: "fg.muted",
										mb: "2",
										display: "block",
									})}
								>
									{group.category}
								</Text>
								<div
									class={css({
										display: "flex",
										flexDirection: "column",
										gap: "0.5",
									})}
								>
									{group.items.map((doc) => {
										const isActive = doc.slug === activeSlug;
										return (
											<a
												key={doc.slug}
												href={`/docs/${doc.slug}`}
												aria-current={isActive ? "page" : undefined}
												class={css({
													display: "block",
													px: "3",
													py: "1.5",
													borderRadius: "md",
													fontSize: "sm",
													textDecoration: "none",
													color: isActive ? "fg" : "fg.muted",
													bg: isActive ? "blue.4" : "transparent",
													fontWeight: isActive ? "semibold" : "normal",
													_hover: {
														bg: isActive ? "blue.4" : "bg.subtle",
														color: "fg",
													},
												})}
											>
												{doc.title}
											</a>
										);
									})}
								</div>
							</div>
						))}
					</nav>
				</aside>

				<main class={css({ flex: "1", minWidth: "0" })}>{children}</main>
			</div>
		</div>
	);
}
