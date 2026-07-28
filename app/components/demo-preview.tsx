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

export interface DemoPreviewProps extends PropsWithChildren {
	/**
	 * Explicit source to show in the code panel, for cases where the MDX
	 * source next to <DemoPreview> either doesn't exist or isn't what should
	 * be displayed (e.g. a simplified snippet vs. the full CMS JSON below
	 * it). Takes priority over an auto-detected fenced code block.
	 */
	sourceCode?: string;
	/** `language-*` class on the code panel's <code> when using sourceCode. */
	language?: string;
}

/**
 * Wraps a live, actually-rendered component example in docs pages — as
 * opposed to the static code sample next to it. Renders server-side like
 * everything else on the site, so it reflects real output, not a mock-up.
 *
 * A remark plugin (remarkDemoPreviewCodeMerge, run at MDX compile time)
 * folds an immediately-following fenced code block into this component's
 * children as a trailing <pre>, so most content/*.mdx files need no changes
 * at all to get the side-by-side layout below. `sourceCode` is there for the
 * remaining cases that need an explicit override.
 *
 * Rendered `interactive={false}` on the Splitter: panel content here is
 * often itself a hydrating island (e.g. Carousel) nested inside DemoPreview.
 * HonoX islands can't safely carry another island as serializable prop data,
 * so an interactive (client re-rendering) Splitter would drop that nested
 * island's markup on hydration — see splitter usage in page-registry.tsx for
 * the same constraint. The resize handle is therefore static, not draggable.
 */
export function DemoPreview({
	children,
	sourceCode,
	language,
}: DemoPreviewProps) {
	const items = (Array.isArray(children) ? children : [children]) as Child[];
	const last = items[items.length - 1];
	const hasPairedCode =
		items.length > 1 && isValidElement(last) && last.tag === "pre";

	const codeContent =
		sourceCode !== undefined ? (
			<pre>
				<code class={language ? `language-${language}` : undefined}>
					{sourceCode}
				</code>
			</pre>
		) : hasPairedCode ? (
			last
		) : undefined;

	if (codeContent) {
		const preview = hasPairedCode ? items.slice(0, -1) : items;
		return (
			<Splitter
				orientation="horizontal"
				interactive={false}
				class={css({ mb: "6" })}
				style={{ minHeight: "18rem" }}
				panels={[
					{ id: "code", content: codeContent, class: unstyledPanelClass },
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
