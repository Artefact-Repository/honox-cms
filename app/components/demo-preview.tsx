import { css, cx } from "design-system/css";
import type { Child, PropsWithChildren } from "hono/jsx";
import { isValidElement } from "hono/jsx";
import { Splitter } from "./ui/splitter";

const previewBoxClass = css({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	gap: "3",
	flexWrap: "wrap",
	p: "8",
	borderWidth: "1px",
	borderColor: "border",
	borderRadius: "xl",
	bg: "bg.subtle",
	width: "full",
});

const unstyledPanelClass = css({
	p: "0",
	borderWidth: "0",
	background: "transparent",
	borderRadius: "0",
});

/**
 * Wraps a live, actually-rendered component example in docs pages — as
 * opposed to the static code sample next to it. Renders server-side like
 * everything else on the site, so it reflects real output, not a mock-up.
 *
 * A remark plugin (remarkDemoPreviewCodeMerge, run at MDX compile time)
 * folds an immediately-following fenced code block into this component's
 * children as a trailing <pre>. When that's present, show code and preview
 * side-by-side in a Splitter instead of just the plain box.
 */
export function DemoPreview({ children }: PropsWithChildren) {
	const items = (Array.isArray(children) ? children : [children]) as Child[];
	const last = items[items.length - 1];
	const hasPairedCode =
		items.length > 1 && isValidElement(last) && last.tag === "pre";

	if (hasPairedCode) {
		const preview = items.slice(0, -1);
		return (
			<Splitter
				orientation="horizontal"
				class={css({ mb: "6" })}
				style={{ minHeight: "18rem" }}
				panels={[
					{ id: "code", content: last, class: unstyledPanelClass },
					{
						id: "preview",
						content: <div class={previewBoxClass}>{preview}</div>,
						class: unstyledPanelClass,
					},
				]}
				defaultSize={[
					{ id: "code", size: 45 },
					{ id: "preview", size: 55 },
				]}
			/>
		);
	}

	return <div class={cx(previewBoxClass, css({ mb: "6" }))}>{children}</div>;
}
