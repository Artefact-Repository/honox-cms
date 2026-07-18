import { css } from "design-system/css";
import type { PropsWithChildren } from "hono/jsx";

/**
 * Wraps a live, actually-rendered component example in docs pages — as
 * opposed to the static code sample next to it. Renders server-side like
 * everything else on the site, so it reflects real output, not a mock-up.
 */
export function DemoPreview({ children }: PropsWithChildren) {
	return (
		<div
			class={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: "3",
				flexWrap: "wrap",
				p: "8",
				mb: "6",
				borderWidth: "1px",
				borderColor: "border",
				borderRadius: "xl",
				bg: "bg.subtle",
			})}
		>
			{children}
		</div>
	);
}
