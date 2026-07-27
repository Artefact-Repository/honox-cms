import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";

interface PageInfo {
	slug: string;
	json: string;
}

interface PlaygroundProps {
	pages: PageInfo[];
}

export default function PlaygroundIsland({ pages }: PlaygroundProps) {
	const [selectedSlug, setSelectedSlug] = useState(
		pages.length > 0 ? pages[0].slug : "",
	);
	const [jsonString, setJsonString] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);
	const [deviceWidth, setDeviceWidth] = useState<"100%" | "768px" | "375px">(
		"100%",
	);
	const [iframeReady, setIframeReady] = useState(false);
	const [isSynchronized, setIsSynchronized] = useState(false);

	// Load page JSON when selectedSlug changes
	useEffect(() => {
		const page = pages.find((p) => p.slug === selectedSlug);
		if (page) {
			setJsonString(page.json);
		}
	}, [selectedSlug, pages]);

	// Send message to update preview
	useEffect(() => {
		if (!jsonString) return;

		try {
			const parsed = JSON.parse(jsonString);
			setValidationError(null);

			// Persist to sessionStorage so reload/load recovers it
			try {
				sessionStorage.setItem(
					"playground_preview_json",
					JSON.stringify({ content: parsed.content || [] }),
				);
			} catch (e) {
				console.error("sessionStorage save error", e);
			}

			if (iframeReady) {
				const iframe = document.getElementById(
					"playground-iframe",
				) as HTMLIFrameElement | null;
				if (iframe?.contentWindow) {
					iframe.contentWindow.postMessage(
						{
							type: "update-preview",
							content: parsed.content || [],
						},
						"*",
					);
					setIsSynchronized(true);
				}
			} else {
				setIsSynchronized(false);
			}
		} catch (e: any) {
			setValidationError(e.message);
			setIsSynchronized(false);
		}
	}, [jsonString, iframeReady]);

	// Listen for preview-ready handshake from iframe
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data && event.data.type === "preview-ready") {
				setIframeReady(true);
			}
		};

		window.addEventListener("message", handleMessage);
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	const handleFormat = () => {
		try {
			const parsed = JSON.parse(jsonString);
			setJsonString(JSON.stringify(parsed, null, 2));
			setValidationError(null);
		} catch (e: any) {
			setValidationError(`Format failed: ${e.message}`);
		}
	};

	const handleReset = () => {
		const original = pages.find((p) => p.slug === selectedSlug);
		if (original) {
			setJsonString(original.json);
			setValidationError(null);
		}
	};

	const selectClass = css({
		px: "3",
		py: "1.5",
		borderRadius: "md",
		border: "1px solid",
		borderColor: "border",
		bg: "bg.default",
		color: "fg.default",
		fontSize: "sm",
		fontWeight: "semibold",
		cursor: "pointer",
		outline: "none",
		_focus: {
			borderColor: "purple.500",
		},
	});

	return (
		<div
			class={css({
				display: "grid",
				gridTemplateColumns: { base: "1fr", lg: "1fr 1fr" },
				gap: "6",
				minHeight: "calc(100vh - 120px)",
				maxWidth: "100%",
				px: { base: "4", md: "6" },
				py: "4",
			})}
		>
			{/* Left Column - Code Editor */}
			<div
				class={css({
					display: "flex",
					flexDirection: "column",
					gap: "4",
					bg: "bg.canvas",
					borderWidth: "1px",
					borderColor: "border",
					borderRadius: "xl",
					p: "5",
					boxShadow: "sm",
				})}
			>
				{/* Editor Toolbar */}
				<div
					class={css({
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "space-between",
						alignItems: "center",
						gap: "3",
						borderBottomWidth: "1px",
						borderColor: "border",
						pb: "4",
					})}
				>
					<div class={css({ display: "flex", alignItems: "center", gap: "2" })}>
						<label
							htmlFor="page-select"
							class={css({
								fontSize: "sm",
								fontWeight: "semibold",
								color: "fg.muted",
							})}
						>
							Page:
						</label>
						<select
							id="page-select"
							class={selectClass}
							value={selectedSlug}
							onChange={(e: any) => {
								setSelectedSlug(e.target.value);
								setIframeReady(false);
								const iframe = document.getElementById(
									"playground-iframe",
								) as HTMLIFrameElement | null;
								if (iframe) {
									iframe.src = "/playground/preview";
								}
							}}
						>
							{pages.map((p) => (
								<option key={p.slug} value={p.slug}>
									{p.slug}.json
								</option>
							))}
						</select>
					</div>

					<div class={css({ display: "flex", gap: "2" })}>
						<button
							type="button"
							class={cx(button({ variant: "outline", size: "sm" }))}
							onClick={handleFormat}
						>
							Format JSON
						</button>
						<button
							type="button"
							class={cx(
								button({ variant: "outline", size: "sm", colorPalette: "red" }),
							)}
							onClick={handleReset}
						>
							Reset Original
						</button>
					</div>
				</div>

				{/* Textarea Code Area */}
				<div
					class={css({
						flex: "1",
						display: "flex",
						flexDirection: "column",
						position: "relative",
					})}
				>
					<textarea
						value={jsonString}
						onInput={(e: any) => setJsonString(e.target.value)}
						class={css({
							width: "100%",
							minHeight: "500px",
							height: "100%",
							fontFamily: "monospace",
							fontSize: "13px",
							lineHeight: "1.6",
							p: "4",
							bg: "bg.default",
							color: "fg.default",
							borderWidth: "1px",
							borderColor: "border",
							borderRadius: "lg",
							outline: "none",
							resize: "vertical",
							whiteSpace: "pre",
							overflowWrap: "normal",
							overflowX: "auto",
							_focus: {
								borderColor: "purple.500",
								boxShadow: "0 0 0 1px var(--colors-purple-500)",
							},
						})}
						placeholder="Paste or write page configuration JSON here..."
					/>
				</div>

				{/* Error / Status Bar */}
				<div>
					{validationError ? (
						<div
							class={css({
								p: "3",
								borderRadius: "md",
								bg: "red.50",
								_dark: { bg: "red.950" },
								borderWidth: "1px",
								borderColor: "red.200",
								_dark: { borderColor: "red.800" },
								color: "red.600",
								_dark: { color: "red.400" },
								fontSize: "xs",
								fontFamily: "monospace",
								overflowWrap: "anywhere",
							})}
						>
							<strong>Invalid JSON:</strong> {validationError}
						</div>
					) : (
						<div
							class={css({
								display: "flex",
								alignItems: "center",
								gap: "2",
								fontSize: "sm",
								color: "green.600",
								_dark: { color: "green.400" },
							})}
						>
							<span
								class={css({
									width: "2.5",
									height: "2.5",
									borderRadius: "full",
									bg: "green.500",
								})}
							/>
							JSON is valid and synchronized with preview.
						</div>
					)}
				</div>
			</div>

			{/* Right Column - Device IFrame Preview */}
			<div
				class={css({
					display: "flex",
					flexDirection: "column",
					gap: "4",
					bg: "bg.canvas",
					borderWidth: "1px",
					borderColor: "border",
					borderRadius: "xl",
					p: "5",
					boxShadow: "sm",
				})}
			>
				{/* Preview Toolbar */}
				<div
					class={css({
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						borderBottomWidth: "1px",
						borderColor: "border",
						pb: "4",
					})}
				>
					<span class={css({ fontSize: "sm", fontWeight: "bold" })}>
						Live Preview
					</span>

					{/* Device Selector */}
					<div class={css({ display: "flex", gap: "1" })}>
						<button
							type="button"
							class={cx(
								button({
									variant: deviceWidth === "100%" ? "solid" : "outline",
									size: "xs",
								}),
							)}
							onClick={() => setDeviceWidth("100%")}
						>
							Desktop
						</button>
						<button
							type="button"
							class={cx(
								button({
									variant: deviceWidth === "768px" ? "solid" : "outline",
									size: "xs",
								}),
							)}
							onClick={() => setDeviceWidth("768px")}
						>
							Tablet
						</button>
						<button
							type="button"
							class={cx(
								button({
									variant: deviceWidth === "375px" ? "solid" : "outline",
									size: "xs",
								}),
							)}
							onClick={() => setDeviceWidth("375px")}
						>
							Mobile
						</button>
					</div>
				</div>

				{/* Preview Container Wrapper */}
				<div
					class={css({
						flex: "1",
						display: "flex",
						justifyContent: "center",
						alignItems: "stretch",
						bg: "bg.muted",
						borderRadius: "lg",
						p: "4",
						minHeight: "500px",
					})}
				>
					<div
						style={{ width: deviceWidth }}
						class={css({
							display: "flex",
							flexDirection: "column",
							bg: "bg.default",
							borderWidth: "1px",
							borderColor: "border",
							borderRadius: "lg",
							boxShadow: "md",
							transition: "width 0.3s ease-in-out",
							overflow: "hidden",
						})}
					>
						<iframe
							id="playground-iframe"
							src="/playground/preview"
							class={css({
								width: "100%",
								height: "100%",
								border: "none",
								flex: "1",
							})}
							title="Playground Preview"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
