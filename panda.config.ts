import { defineConfig } from "@pandacss/dev";
import * as theme from "./app/theme";

export default defineConfig({
	// Whether to use css reset
	preflight: true,

	// Where to look for your css declarations
	include: ["./app/**/*.{js,jsx,ts,tsx}"],

	// Files to exclude
	exclude: [],

	// Useful for theme customisation
	theme: { extend: { ...theme.config } },

	// The output directory for your css system
	outdir: "design-system",

	staticCss: {
		// Forces generation of the plain `colorPalette` utility class (sets the
		// `--colors-color-palette-*` scope vars) for every real palette name, so
		// components can apply it themselves via `css({ colorPalette })` instead
		// of each recipe re-declaring its own `colorPalette` variant. Needed
		// because values come from CMS content at runtime, never literal JSX, so
		// Panda's static extractor can't discover them on its own — see the
		// `recipes` comment below for the same limitation. Aliases like
		// "success"/"error"/"warning" are normalised to a real palette name in
		// `app/components/ui/color-palette.ts` before reaching `css()`, so they
		// don't need entries here.
		css: [
			{
				properties: {
					colorPalette: [
						"gray",
						"blue",
						"green",
						"red",
						"orange",
						"purple",
						"cyan",
						"amber",
					],
				},
			},
			// The categorical slice of the CMS block `style`-string vocabulary
			// (content/pages/**/*.json) — measured, enumerated, and validated
			// against exactly this list in app/components/block-style.ts's
			// `CATEGORICAL_VALIDATORS`/`resolveStyleString`. Same reasoning as
			// `colorPalette` above: these values come from CMS content at
			// runtime, never literal JSX, so Panda's static extractor can't
			// discover them on its own. Keep this enumeration and the
			// validators in block-style.ts in lockstep — the two are meant to
			// be kept in sync by scripts/check-cms-style-vocab.mjs, which fails
			// CI if new content introduces a validated pair missing here.
			// NOTE: verifying this enumeration against generated CSS requires a
			// real rebuild — `bunx panda codegen` only regenerates the `css`/
			// `tokens`/`patterns`/`recipes` *functions*, not `design-system/
			// styles.css` (that's a separate, easily-stale artifact). Use
			// `bunx panda cssgen --clean -o design-system/styles.css` to check
			// what's actually pre-generated.
			{
				properties: {
					textAlign: ["left", "center", "right", "justify", "start", "end"],
					// Kept as strings (not numbers) — `resolveStyleString` always
					// produces string values, parsed straight out of CSS text, and
					// the enumeration here has to match exactly what the runtime
					// `css()` call in `cmsCategoricalClass` actually passes.
					fontWeight: ["600", "bold"],
					textTransform: ["uppercase"],
					textDecoration: ["none"],
					justifyContent: ["flex-end"],
					flexWrap: ["wrap"],
					flexShrink: ["0"],
					letterSpacing: ["0.05em"],
					borderRadius: ["9999px"],
					color: ["var(--colors-fg-muted)"],
					borderBottom: ["1px solid var(--colors-border)"],
					borderTop: ["1px solid var(--colors-border)"],
				},
			},
		],

		// Every recipe here must keep `["*"]`: none of them (aside from alert,
		// button, skeleton, input) declare a `jsx: [...]` mapping in their recipe
		// definition, so Panda's static extractor cannot associate `<Foo size="sm">`
		// JSX usage with the recipe at all — it only sees `recipe(variantProps)`
		// calls inside the primitive files, always with a runtime-destructured
		// object, never literal args. Verified empirically: dropping force-generation
		// for e.g. `code` silently removed every non-default size/variant class
		// (`code--size_sm/lg/xl`, `code--variant_solid/surface/outline/plain`) even
		// though app/routes/index.tsx uses them all literally. A real reduction here
		// would require adding `jsx: [...]` to each recipe first — a separate,
		// larger change — not just trimming this list.
		recipes: {
			datePicker: ["*"],
			select: ["*"],
			search: ["*"],
			pagination: ["*"],
			absoluteCenter: ["*"],
			avatar: ["*"],
			alert: ["*"],
			badge: ["*"],
			breadcrumb: ["*"],
			button: ["*"],
			card: ["*"],
			carousel: ["*"],
			checkbox: ["*"],
			clipboard: ["*"],
			code: ["*"],
			collapsible: ["*"],
			colorPicker: ["*"],
			combobox: ["*"],
			dialog: ["*"],
			drawer: ["*"],
			editable: ["*"],
			field: ["*"],
			fieldset: ["*"],
			fileUpload: ["*"],
			group: ["*"],
			heading: ["*"],
			hoverCard: ["*"],
			icon: ["*"],
			input: ["*"],
			layout: ["*"],
			anchor: ["*"],
			dropdown: ["*"],
			pinField: ["*"],
			popover: ["*"],
			progress: ["*"],
			radioCardGroup: ["*"],
			ratingGroup: ["*"],
			segmentGroup: ["*"],
			skeleton: ["*"],
			slider: ["*"],
			spinner: ["*"],
			splitter: ["*"],
			switchRecipe: ["*"],
			table: ["*"],
			tagsField: ["*"],
			text: ["*"],
			textarea: ["*"],
			toast: ["*"],
			toggleGroup: ["*"],
			tooltip: ["*"],
			gridRow: ["*"],
			gridCol: ["*"],
		},
		patterns: {
			stack: ["*"],
			grid: [
				{
					properties: { columns: [1, 2, 3] },
					responsive: true,
				},
			],
		},
	},

	// Disable JSX framework (using Hono JSX instead)
	jsxFramework: undefined,

	plugins: [
		{
			name: "Remove Panda Preset Colors",
			hooks: {
				"preset:resolved": ({ utils, preset, name }) =>
					name === "@pandacss/preset-panda"
						? utils.omit(preset, [
								"theme.tokens.colors",
								"theme.semanticTokens.colors",
							])
						: preset,
			},
		},
	],

	globalCss: theme.globalCss,
	conditions: theme.conditions,
});
