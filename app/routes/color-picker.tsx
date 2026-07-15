import { createRoute } from "honox/factory";
import { css } from "design-system/css";
import { Card, Heading, Stack, Text, ColorPicker } from "../components/ui";

const presets = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#06b6d4",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#64748b",
	"#1e293b",
	"#f8fafc",
	"#000000",
	"#ffffff",
	"#7c3aed",
];

export default createRoute((c) => {
	return c.render(
		<div class={css({ maxW: "5xl", mx: "auto", px: "4", py: "12" })}>
			<title>ColorPicker — hono/jsx</title>

			<Stack direction="column" gap="2" align="flex-start">
				<Heading as="h1" class={css({ fontSize: "3xl", fontWeight: "bold" })}>
					ColorPicker
				</Heading>
				<Text class={css({ color: "fg.muted", maxW: "2xl" })}>
					A production-ready port of the Park UI / Ark UI ColorPicker to
					hono/jsx — zero React. Drag the area, slide hue &amp; alpha, type a
					value, or pick from presets.
				</Text>
			</Stack>

			<div
				class={css({
					display: "grid",
					gridTemplateColumns: { base: "1fr", md: "1fr 1fr" },
					gap: "6",
					mt: "8",
				})}
			>
				<Card class={css({ p: "6" })}>
					<Heading as="h2" class={css({ fontSize: "lg", mb: "4" })}>
						Inline picker
					</Heading>
					<ColorPicker
						defaultValue="#7c3aed"
						name="brand"
						label="Brand colour"
						presets={presets}
					/>
				</Card>

				<Card class={css({ p: "6" })}>
					<Heading as="h2" class={css({ fontSize: "lg", mb: "4" })}>
						Trigger (popover)
					</Heading>
					<Stack direction="row" gap="3" align="center">
						<ColorPicker trigger defaultValue="#06b6d4" />
						<Text class={css({ color: "fg.muted" })}>
							Click the swatch to open.
						</Text>
					</Stack>
				</Card>
			</div>

			<Card class={css({ p: "6", mt: "6" })}>
				<Heading as="h2" class={css({ fontSize: "lg", mb: "4" })}>
					Trigger with alpha &amp; HSLA format
				</Heading>
				<ColorPicker
					defaultValue={{ h: 280, s: 70, v: 90, a: 0.6 }}
					format="hsla"
					label="Accent"
					trigger
				/>
			</Card>
		</div>,
	);
});
