import { css } from "design-system/css";
import { button, code } from "design-system/recipes";
import { useRef, useState } from "hono/jsx";
import type { ComponentBlock } from "../components/block-types";
import { PageRenderer } from "../components/page-renderer";
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

const JSON_EDIT_DEBOUNCE_MS = 300;

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

interface Draft {
	title?: string;
	content: ComponentBlock[];
}

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
	const [draft, setDraft] = useState<Draft | null>(null);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const selected = pages.find((page) => page.slug === selectedSlug) ?? pages[0];

	if (!selected) {
		return <p>No CMS pages found under content/pages.</p>;
	}

	// Re-renders the edited draft entirely client-side via the same
	// PageRenderer/block-registry the real /pages/:slug route uses server-side
	// — this app deploys as a static export (GitHub Pages, see
	// .github/workflows/deploy.yml), so there is no server to round-trip an
	// edited draft through at request time; the block tree has to be rendered
	// in-browser instead. Safe to call directly (not through the SSR→hydration
	// island boundary) because it runs inside this already-mounted island: no
	// prop-serialization, so nested components' own hooks/state work normally.
	const applyDraft = (text: string) => {
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch (err) {
			setParseError(err instanceof Error ? err.message : "Invalid JSON");
			return;
		}
		if (
			typeof parsed !== "object" ||
			parsed === null ||
			!Array.isArray((parsed as { content?: unknown }).content)
		) {
			setParseError('Expected an object with a "content" array');
			return;
		}
		setParseError(null);
		setDraft(parsed as Draft);
	};

	const handleSelectPage = (slug: string) => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		const page = pages.find((p) => p.slug === slug);
		setSelectedSlug(slug);
		setJsonText(page?.json ?? "");
		setParseError(null);
		setDraft(null);
	};

	const handleJsonInput = (value: string) => {
		setJsonText(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			applyDraft(value);
		}, JSON_EDIT_DEBOUNCE_MS);
	};

	const handleReset = () => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		setJsonText(selected.json);
		setParseError(null);
		setDraft(null);
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
					Preview{draft ? " (edited draft)" : `: /pages/${selected.slug}`}
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
				{draft ? (
					<div
						class={css({
							bg: "bg.canvas",
							color: "fg.default",
							minH: "full",
							flexShrink: "0",
							px: "4",
							py: "8",
							display: "flex",
							flexDirection: "column",
							gap: "6",
						})}
						style={{ width: activeWidth }}
					>
						<PageRenderer
							content={draft.content}
							locale="en"
							currentPath="/playground"
						/>
					</div>
				) : (
					<iframe
						key={selected.slug}
						src={`/pages/${selected.slug}`}
						title={`Preview of ${selected.title}`}
						class={css({ border: "none", h: "full", bg: "white" })}
						style={{ width: activeWidth, flexShrink: "0" }}
					/>
				)}
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
