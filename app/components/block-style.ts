import { css } from "design-system/css";

// Validated inline styling for CMS-authored layout blocks (Stack/Grid/Layout).
//
// PandaCSS's `css()` only extracts values it can see statically in source,
// so it can't read content/pages/*.json directly. Rather than bypassing
// Panda with a raw inline `style` string, this follows Panda's own guidance
// for runtime values (https://panda-css.com/docs/guides/dynamic-styling):
// a single *static* `css()` call below — visible to Panda's extractor at
// build time, so it's a real generated/shared/purge-safe class — whose
// declarations read from `var(--cms-*, initial)` custom properties. The
// actual per-instance values are then injected only as those custom
// properties via the `style` prop, which every layout component already
// spreads onto its root element via `...rest`.
//
// Structured fields are validated against an allowlist pattern before
// reaching the DOM, since (unlike the rest of the CMS schema) these values
// are free-text and this is the only place they're checked.

const layoutStyleClass = css({
	margin: "var(--cms-margin, initial)",
	padding: "var(--cms-padding, initial)",
	maxWidth: "var(--cms-max-width, initial)",
	borderRadius: "var(--cms-border-radius, initial)",
	backgroundColor: "var(--cms-bg-color, initial)",
	backgroundImage: {
		_dark: "var(--cms-bg-image, initial)",
		_light: "var(--cms-bg-image-light, var(--cms-bg-image, initial))",
	},
	backgroundSize: "var(--cms-bg-fit, initial)",
	backgroundPosition: "center",
	backgroundRepeat: "no-repeat",
	textAlign: "var(--cms-text-align, initial)",
	opacity: "var(--cms-opacity, initial)",
	boxShadow: "var(--cms-box-shadow, initial)",
});

const SPACING =
	/^(-?\d+(\.\d+)?(px|rem|em|%)|0|auto)(\s+(-?\d+(\.\d+)?(px|rem|em|%)|0|auto)){0,3}$/;
const LENGTH = /^(-?\d+(\.\d+)?(px|rem|em|%|vw|vh)|0|none)$/;
const COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d.,%\s]+\)|[a-zA-Z]+)$/;
// https:// for externally-hosted images, or a root-relative path for ones
// uploaded through the CMS media picker (media_folder -> public_folder: /media).
const SAFE_URL = /^(https:\/\/|\/)[^\s"'()]+$/;
const FIT_VALUES = new Set(["cover", "contain", "auto"]);
const TEXT_ALIGN_VALUES = new Set([
	"left",
	"center",
	"right",
	"justify",
	"start",
	"end",
]);
// Real design-system shadow tokens (design-system/tokens) — a select, not
// freeform CSS, since box-shadow syntax is too complex to safely allowlist
// with a regex. This also gets box-shadow the token consistency margin/
// padding don't have: an editor can only ever pick a real design-system value.
const SHADOW_TOKENS: Record<string, string> = {
	none: "none",
	"2xs": "var(--shadows-2xs)",
	xs: "var(--shadows-xs)",
	sm: "var(--shadows-sm)",
	md: "var(--shadows-md)",
	lg: "var(--shadows-lg)",
	xl: "var(--shadows-xl)",
	"2xl": "var(--shadows-2xl)",
};

function safe(value: unknown, pattern: RegExp): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed !== "" && pattern.test(trimmed) ? trimmed : undefined;
}

function safeOpacity(value: unknown): string | undefined {
	const num = typeof value === "number" ? value : Number(value);
	if (typeof value !== "number" && typeof value !== "string") return undefined;
	if (Number.isNaN(num) || num < 0 || num > 1) return undefined;
	return String(num);
}

const STYLE_KEYS = [
	"margin",
	"padding",
	"maxWidth",
	"borderRadius",
	"backgroundColor",
	"backgroundImage",
	"backgroundImageLight",
	"backgroundFit",
	"textAlign",
	"opacity",
	"boxShadow",
] as const;

export interface ExtractedLayoutStyle {
	/** The static Panda class to add — only set when there's a var to back it. */
	class?: string;
	/** Inline `--cms-*` custom-property assignments, plus any manual `style`. */
	style?: string;
}

/**
 * Pulls the structured style fields out of `props` (so they don't leak onto
 * the DOM as unknown attributes) and returns the shared Panda class plus a
 * validated inline `style` of `--cms-*` custom properties, composed from
 * them, plus any raw hand-authored `style` value. Values that fail
 * validation are silently dropped rather than thrown — a bad CMS entry
 * shouldn't take the page down.
 */
export function extractLayoutStyle(
	props: Record<string, unknown>,
): ExtractedLayoutStyle {
	const vars: string[] = [];

	const margin = safe(props.margin, SPACING);
	if (margin) vars.push(`--cms-margin: ${margin}`);

	const padding = safe(props.padding, SPACING);
	if (padding) vars.push(`--cms-padding: ${padding}`);

	const maxWidth = safe(props.maxWidth, LENGTH);
	if (maxWidth) vars.push(`--cms-max-width: ${maxWidth}`);

	const borderRadius = safe(props.borderRadius, LENGTH);
	if (borderRadius) vars.push(`--cms-border-radius: ${borderRadius}`);

	const backgroundColor = safe(props.backgroundColor, COLOR);
	if (backgroundColor) vars.push(`--cms-bg-color: ${backgroundColor}`);

	const backgroundImage = safe(props.backgroundImage, SAFE_URL);
	if (backgroundImage) vars.push(`--cms-bg-image: url("${backgroundImage}")`);

	// Optional light-theme override — falls back to `backgroundImage` above
	// when omitted, so existing content with only one image is unaffected.
	const backgroundImageLight = safe(props.backgroundImageLight, SAFE_URL);
	if (backgroundImageLight) {
		vars.push(`--cms-bg-image-light: url("${backgroundImageLight}")`);
	}

	if (backgroundImage || backgroundImageLight) {
		const fit =
			typeof props.backgroundFit === "string" &&
			FIT_VALUES.has(props.backgroundFit)
				? props.backgroundFit
				: "cover";
		vars.push(`--cms-bg-fit: ${fit}`);
	}

	if (
		typeof props.textAlign === "string" &&
		TEXT_ALIGN_VALUES.has(props.textAlign)
	) {
		vars.push(`--cms-text-align: ${props.textAlign}`);
	}

	const opacity = safeOpacity(props.opacity);
	if (opacity) vars.push(`--cms-opacity: ${opacity}`);

	if (typeof props.boxShadow === "string" && props.boxShadow in SHADOW_TOKENS) {
		vars.push(`--cms-box-shadow: ${SHADOW_TOKENS[props.boxShadow]}`);
	}

	for (const key of STYLE_KEYS) {
		delete props[key];
	}

	const manual = typeof props.style === "string" ? props.style : undefined;
	delete props.style;

	const varsStyle = vars.join("; ");
	const style =
		varsStyle && manual ? `${varsStyle}; ${manual}` : varsStyle || manual;

	return {
		class: varsStyle ? layoutStyleClass : undefined,
		style,
	};
}
