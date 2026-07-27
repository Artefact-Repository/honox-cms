import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { css } from "design-system/css";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
	// Locate and read CMS pages
	const pagesDir = join(process.cwd(), "content", "pages");
	const pageFiles = ["about.json", "contact.json", "product-landing.json", "wisp.json", "test.json"];
	const pagesData: Record<string, string> = {};

	for (const filename of pageFiles) {
		try {
			const filepath = join(pagesDir, filename);
			const content = readFileSync(filepath, "utf-8");
			const key = filename.replace(".json", "");
			pagesData[key] = content;
		} catch (err) {
			console.error(`Error reading ${filename} for playground:`, err);
		}
	}

	return c.render(
		<div
			class={css({
				bg: "bg.canvas",
				minH: "screen",
				color: "fg.default",
				display: "flex",
				flexDirection: "column",
				fontFamily: "sans-serif",
			})}
		>
			<title>Artefact UI Playground</title>

			{/* Simple, gorgeous sticky header */}
			<header
				class={css({
					borderBottomWidth: "1px",
					borderColor: "border",
					bg: { _light: "white.a7", _dark: "black.a7" },
					backdropFilter: "blur(20px) saturate(180%)",
					position: "sticky",
					top: "0",
					zIndex: "10",
					px: "6",
					py: "3",
				})}
			>
				<div
					class={css({
						maxW: "8rem",
						mx: "auto",
						width: "100%",
						maxWidth: "1400px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "4",
					})}
				>
					<div class={css({ display: "flex", alignItems: "center", gap: "3" })}>
						<a
							href="/"
							class={css({
								fontWeight: "bold",
								fontSize: "lg",
								textDecoration: "none",
								color: "fg.default",
								_hover: { color: "accent.default" },
							})}
						>
							Artefact UI
						</a>
						<span
							class={css({
								px: "2",
								py: "0.5",
								bg: "purple.a2",
								color: "purple.muted",
								borderRadius: "md",
								fontSize: "xs",
								fontWeight: "semibold",
							})}
						>
							Playground
						</span>
					</div>

					<div class={css({ display: "flex", alignItems: "center", gap: "3" })}>
						<label
							htmlFor="page-select"
							class={css({
								fontSize: "sm",
								fontWeight: "medium",
								color: "fg.muted",
							})}
						>
							Select Page:
						</label>
						<select
							id="page-select"
							class={css({
								px: "3",
								py: "1.5",
								bg: "bg.default",
								borderWidth: "1px",
								borderColor: "border",
								borderRadius: "md",
								fontSize: "sm",
								fontWeight: "medium",
								color: "fg.default",
								cursor: "pointer",
								outline: "none",
								_focus: { borderColor: "purple.muted" },
							})}
						>
							<option value="about">About Page (about.json)</option>
							<option value="product-landing">Product Landing (product-landing.json)</option>
							<option value="contact">Contact Us (contact.json)</option>
							<option value="wisp">Wisp Blog (wisp.json)</option>
							<option value="test">Test Components (test.json)</option>
						</select>
					</div>
				</div>
			</header>

			{/* Main Split-Screen Container */}
			<main
				class={css({
					flex: "1",
					display: "grid",
					gridTemplateColumns: { base: "1fr", lg: "1fr 1.2fr" },
					gap: "4",
					p: "4",
					maxW: "1400px",
					mx: "auto",
					width: "100%",
					height: "calc(100vh - 65px)",
					minHeight: "500px",
					boxSizing: "border-box",
				})}
			>
				{/* Left Column: Code Editor */}
				<div
					class={css({
						display: "flex",
						flexDirection: "column",
						bg: "bg.default",
						borderRadius: "xl",
						borderWidth: "1px",
						borderColor: "border",
						overflow: "hidden",
						boxShadow: "sm",
					})}
				>
					{/* Editor Header */}
					<div
						class={css({
							px: "4",
							py: "3",
							borderBottomWidth: "1px",
							borderColor: "border",
							bg: "bg.canvas",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						})}
					>
						<span class={css({ fontSize: "sm", fontWeight: "semibold", color: "fg.muted" })}>
							Source Code (JSON)
						</span>
						<div class={css({ display: "flex", gap: "2" })}>
							<button
								type="button"
								id="btn-reset"
								class={css({
									px: "3",
									py: "1.5",
									fontSize: "xs",
									fontWeight: "medium",
									borderRadius: "md",
									borderWidth: "1px",
									borderColor: "border",
									bg: "bg.default",
									color: "fg.default",
									cursor: "pointer",
									_hover: { bg: "bg.canvas" },
								})}
							>
								Reset to Default
							</button>
							<button
								type="button"
								id="btn-update"
								class={css({
									px: "3",
									py: "1.5",
									fontSize: "xs",
									fontWeight: "semibold",
									borderRadius: "md",
									bg: "purple.muted",
									color: "white",
									border: "none",
									cursor: "pointer",
									_hover: { opacity: 0.9 },
								})}
							>
								Update Preview
							</button>
						</div>
					</div>

					{/* Editor Textarea */}
					<div class={css({ flex: "1", position: "relative" })}>
						<textarea
							id="json-textarea"
							spellcheck={false}
							autocomplete="off"
							class={css({
								width: "100%",
								height: "100%",
								border: "none",
								p: "4",
								fontFamily: "monospace",
								fontSize: "13px",
								lineHeight: "1.6",
								bg: "bg.default",
								color: "fg.default",
								resize: "none",
								outline: "none",
								boxSizing: "border-box",
							})}
						/>
					</div>
				</div>

				{/* Right Column: Preview Pane */}
				<div
					class={css({
						display: "flex",
						flexDirection: "column",
						bg: "bg.default",
						borderRadius: "xl",
						borderWidth: "1px",
						borderColor: "border",
						overflow: "hidden",
						boxShadow: "sm",
					})}
				>
					{/* Mock Browser Title Bar */}
					<div
						class={css({
							px: "4",
							py: "3",
							borderBottomWidth: "1px",
							borderColor: "border",
							bg: "bg.canvas",
							display: "flex",
							alignItems: "center",
							gap: "3",
						})}
					>
						{/* Simulated Browser Buttons */}
						<div class={css({ display: "flex", gap: "1.5" })}>
							<span class={css({ w: "3", h: "3", borderRadius: "full", bg: "red.500", display: "inline-block" })} />
							<span class={css({ w: "3", h: "3", borderRadius: "full", bg: "amber.500", display: "inline-block" })} />
							<span class={css({ w: "3", h: "3", borderRadius: "full", bg: "green.500", display: "inline-block" })} />
						</div>

						{/* Mock Address Bar */}
						<div
							class={css({
								flex: "1",
								bg: "bg.default",
								borderWidth: "1px",
								borderColor: "border",
								borderRadius: "md",
								px: "3",
								py: "1",
								fontSize: "xs",
								color: "fg.muted",
								display: "flex",
								alignItems: "center",
								gap: "2",
								userSelect: "none",
							})}
						>
							<span class={css({ color: "green.muted" })}>HTTPS</span>
							<span>localhost:3000/preview</span>
						</div>
					</div>

					{/* Iframe Viewport */}
					<div class={css({ flex: "1", bg: "white", position: "relative" })}>
						<iframe
							id="preview-iframe"
							name="preview-frame"
							title="Live Page Preview"
							class={css({
								width: "100%",
								height: "100%",
								border: "none",
								bg: "white",
							})}
						/>
					</div>
				</div>
			</main>

			{/* Hidden form to post the JSON content to the preview iframe */}
			<form
				id="preview-form"
				action="/playground/preview"
				method="POST"
				target="preview-frame"
				class={css({ display: "none" })}
			>
				<input type="hidden" name="json" id="form-json-input" />
			</form>

			{/* Inline Script to manage state without server-side hydration lag */}
			<script
				dangerouslySetInnerHTML={{
					__html: `
						(function() {
							const PAGES_DATA = ${JSON.stringify(pagesData)};
							const select = document.getElementById('page-select');
							const textarea = document.getElementById('json-textarea');
							const form = document.getElementById('preview-form');
							const formInput = document.getElementById('form-json-input');
							const btnUpdate = document.getElementById('btn-update');
							const btnReset = document.getElementById('btn-reset');

							function updatePreview() {
								formInput.value = textarea.value;
								form.submit();
							}

							function loadPage(pageKey) {
								const defaultJson = PAGES_DATA[pageKey] || '{}';
								textarea.value = defaultJson;
								updatePreview();
							}

							select.addEventListener('change', function(e) {
								loadPage(e.target.value);
							});

							btnUpdate.addEventListener('click', function() {
								updatePreview();
							});

							btnReset.addEventListener('click', function() {
								const pageKey = select.value;
								loadPage(pageKey);
							});

							// Initial page load
							loadPage(select.value);
						})();
					`,
				}}
			/>
		</div>,
	);
});
