import { css } from "design-system/css";
import { button, code } from "design-system/recipes";
import { useRef, useState } from "hono/jsx";
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

const JSON_EDIT_DEBOUNCE_MS = 500;

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
	const initialSlug = defaultSlug ?? pages[0]?.slug ?? "";
	const initialPage = pages.find((p) => p.slug === initialSlug) ?? pages[0];

	const [selectedSlug, setSelectedSlug] = useState(initialSlug);
	const [viewport, setViewport] = useState<Viewport>("desktop");
	const [copied, setCopied] = useState(false);
	const [jsonText, setJsonText] = useState(initialPage?.json ?? "");
	const [parseError, setParseError] = useState<string | null>(null);
	const [previewHtml, setPreviewHtml] = useState<string | null>(null);
	const [isRendering, setIsRendering] = useState(false);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const selected = pages.find((page) => page.slug === selectedSlug) ?? pages[0];

	if (!selected) {
		return <p>No CMS pages found under content/pages.</p>;
	}

	const renderLivePreview = async (text: string) => {
		let parsed: { title?: string; content?: unknown };
		try {
			parsed = JSON.parse(text);
		} catch (err) {
			setParseError(err instanceof Error ? err.message : "Invalid JSON");
			return;
		}
		setParseError(null);
		setIsRendering(true);
		try {
			const res = await fetch("/api/pages/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: parsed.title,
					content: parsed.content,
				}),
			});
			if (!res.ok) throw new Error(`Preview request failed (${res.status})`);
			setPreviewHtml(await res.text());
		} catch (err) {
			setParseError(
				err instanceof Error ? err.message : "Live preview unavailable",
			);
		} finally {
			setIsRendering(false);
		}
	};

	const handleSelectPage = (slug: string) => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		const page = pages.find((p) => p.slug === slug);
		setSelectedSlug(slug);
		setJsonText(page?.json ?? "");
		setParseError(null);
		setPreviewHtml(null);
	};

	const handleJsonInput = (value: string) => {
		setJsonText(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			renderLivePreview(value);
		}, JSON_EDIT_DEBOUNCE_MS);
	};

	const handleReset = () => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		setJsonText(selected.json);
		setParseError(null);
		setPreviewHtml(null);
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(jsonText);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// Clipboard API unavailable (e.g. insecure context) — ignore.
		}
	};

	const activeWidth =
		VIEWPORTS.find((v) => v.id === viewport)?.width ?? "100%";
	const isEdited = jsonText !== selected.json;

	const jsonPanelContent = (
		<div class={panelContentClass}>
			<div class={panelHeaderClass}>
				<span class={panelLabelClass}>content/pages/{selected.slug}.json</span>
				<div class={css({ display: "flex", alignItems: "center", gap: "2" })}>
					{isEdited && (
						<button
							type="button"
							class={button({ variant: "plain", size: "xs" })}
							onClick={handleReset}
						>
							Reset
						</button>
					)}
					<button
						type="button"
						class={button({ variant: "plain", size: "xs" })}
						onClick={handleCopy}
					>
						{copied ? "Copied!" : "Copy JSON"}
					</button>
				</div>
			</div>
			<textarea
				value={jsonText}
				onInput={(e) =>
					handleJsonInput((e.target as HTMLTextAreaElement).value)
				}
				spellcheck={false}
				autocomplete="off"
				class={css({
					m: "0",
					p: "0",
					flex: "1",
					minH: "0",
					resize: "none",
					borderWidth: "0",
					outline: "none",
					bg: "transparent",
					color: "inherit",
					fontFamily: "mono",
					fontSize: "xs",
					lineHeight: "1.6",
					overflow: "auto",
				})}
			/>
			{parseError && (
				<p
					class={css({
						color: { base: "red.9", _dark: "red.7" },
						fontSize: "xs",
						m: "0",
						flexShrink: "0",
					})}
				>
					{parseError}
				</p>
			)}
		</div>
	);

	const previewPanelContent = (
		<div class={panelContentClass}>
			<div class={panelHeaderClass}>
				<span class={panelLabelClass}>
					Preview{previewHtml ? " (edited draft)" : `: /pages/${selected.slug}`}
					{isRendering ? "…" : ""}
				</span>
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
					src={previewHtml ? undefined : `/pages/${selected.slug}`}
					srcdoc={previewHtml ?? undefined}
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
						onClick={() => handleSelectPage(page.slug)}
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
