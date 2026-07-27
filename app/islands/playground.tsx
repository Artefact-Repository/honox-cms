import { css } from "design-system/css";
import { button, code } from "design-system/recipes";
import { useState } from "hono/jsx";
import { InteractiveSplitter } from "../components/ui/splitter-primitive";

export interface PlaygroundPage {
	slug: string;
	title: string;
	json: string;
}

export interface PlaygroundIslandProps {
	pages: PlaygroundPage[];
	defaultSlug?: string;
}

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS: { id: Viewport; label: string; width: string }[] = [
	{ id: "desktop", label: "Desktop", width: "100%" },
	{ id: "tablet", label: "Tablet", width: "48rem" },
	{ id: "mobile", label: "Mobile", width: "24rem" },
];

const panelContentClass = css({
	display: "flex",
	flexDirection: "column",
	gap: "2",
	h: "full",
	minH: "0",
	minW: "0",
	w: "full",
});

const panelHeaderClass = css({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: "2",
	pb: "2",
	borderBottomWidth: "1px",
	borderStyle: "solid",
	borderColor: "border.default",
	flexShrink: "0",
});

const panelLabelClass = css({
	fontSize: "sm",
	fontWeight: "600",
	fontFamily: "mono",
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
});

export default function PlaygroundIsland({
	pages,
	defaultSlug,
}: PlaygroundIslandProps) {
	const [selectedSlug, setSelectedSlug] = useState(
		defaultSlug ?? pages[0]?.slug ?? "",
	);
	const [viewport, setViewport] = useState<Viewport>("desktop");
	const [copied, setCopied] = useState(false);

	const selected = pages.find((page) => page.slug === selectedSlug) ?? pages[0];

	if (!selected) {
		return <p>No CMS pages found under content/pages.</p>;
	}

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(selected.json);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// Clipboard API unavailable (e.g. insecure context) — ignore.
		}
	};

	const activeWidth =
		VIEWPORTS.find((v) => v.id === viewport)?.width ?? "100%";

	const jsonPanelContent = (
		<div class={panelContentClass}>
			<div class={panelHeaderClass}>
				<span class={panelLabelClass}>content/pages/{selected.slug}.json</span>
				<button
					type="button"
					class={button({ variant: "plain", size: "xs" })}
					onClick={handleCopy}
				>
					{copied ? "Copied!" : "Copy JSON"}
				</button>
			</div>
			<pre
				class={css({
					m: "0",
					overflow: "auto",
					flex: "1",
					minH: "0",
					fontSize: "xs",
					lineHeight: "1.6",
				})}
			>
				<code class={code({ variant: "plain" })}>{selected.json}</code>
			</pre>
		</div>
	);

	const previewPanelContent = (
		<div class={panelContentClass}>
			<div class={panelHeaderClass}>
				<span class={panelLabelClass}>Preview: /pages/{selected.slug}</span>
				<div class={css({ display: "flex", alignItems: "center", gap: "1" })}>
					{VIEWPORTS.map((v) => (
						<button
							type="button"
							class={button({
								variant: viewport === v.id ? "solid" : "plain",
								size: "xs",
							})}
							onClick={() => setViewport(v.id)}
						>
							{v.label}
						</button>
					))}
					<a
						href={`/pages/${selected.slug}`}
						target="_blank"
						rel="noreferrer"
						class={button({ variant: "plain", size: "xs" })}
					>
						Open ↗
					</a>
				</div>
			</div>
			<div
				class={css({
					flex: "1",
					minH: "0",
					overflow: "auto",
					bg: { base: "gray.100", _dark: "gray.900" },
					borderRadius: "l2",
					display: "flex",
					justifyContent: "center",
				})}
			>
				<iframe
					key={selected.slug}
					src={`/pages/${selected.slug}`}
					title={`Preview of ${selected.title}`}
					class={css({ border: "none", h: "full", bg: "white" })}
					style={{ width: activeWidth, flexShrink: "0" }}
				/>
			</div>
		</div>
	);

	return (
		<div
			class={css({
				display: "flex",
				flexDirection: "column",
				gap: "4",
				px: "4",
				py: "6",
				maxW: "[120rem]",
				mx: "auto",
				w: "full",
				flex: "1",
				minH: "0",
			})}
		>
			<div class={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
				{pages.map((page) => (
					<button
						type="button"
						class={button({
							variant: page.slug === selected.slug ? "solid" : "outline",
							size: "sm",
						})}
						onClick={() => setSelectedSlug(page.slug)}
					>
						{page.title}
					</button>
				))}
			</div>

			<InteractiveSplitter
				orientation="horizontal"
				style={{ height: "75vh" }}
				panels={[
					{ id: "source", content: jsonPanelContent },
					{ id: "preview", content: previewPanelContent },
				]}
				defaultSize={[
					{ id: "source", size: 45 },
					{ id: "preview", size: 55 },
				]}
			/>
		</div>
	);
}
