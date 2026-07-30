import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { InteractiveCombobox } from "../components/ui/combobox-primitive";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { PROJECT_COLOR_PALETTES } from "../lib/projects";
import { saveConfigsFields, SettingsSaveError } from "../utils/settings-save";

const colorItems = PROJECT_COLOR_PALETTES.map((c) => ({ label: c, value: c }));

export interface FooterLink {
	label: string;
	href: string;
	colorPalette: string;
}

export interface HomeSettingsFormProps {
	initial: {
		brandName: string;
		titleFallback: string;
		footerCopyright: string;
		footerLinks: FooterLink[];
	};
}

const labelClass = css({ fontWeight: "medium", mb: "1.5" });

export default function HomeSettingsForm({ initial }: HomeSettingsFormProps) {
	const [form, setForm] = useState(initial);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateLink = (index: number, patch: Partial<FooterLink>) => {
		setForm((f) => ({
			...f,
			footerLinks: f.footerLinks.map((link, i) =>
				i === index ? { ...link, ...patch } : link,
			),
		}));
	};

	const removeLink = (index: number) => {
		setForm((f) => ({
			...f,
			footerLinks: f.footerLinks.filter((_, i) => i !== index),
		}));
	};

	const addLink = () => {
		setForm((f) => ({
			...f,
			footerLinks: [...f.footerLinks, { label: "", href: "", colorPalette: "gray" }],
		}));
	};

	const handleSave = async () => {
		setSaving(true);
		setError(null);
		try {
			await saveConfigsFields(
				{
					home: {
						brandName: form.brandName.trim(),
						titleFallback: form.titleFallback.trim(),
						footerCopyright: form.footerCopyright.trim(),
						footerLinks: form.footerLinks.filter(
							(link) => link.label.trim() && link.href.trim(),
						),
					},
				},
				"Update homepage settings",
			);
			toaster.success("Updated homepage settings.", {
				description: "Committed to main — live once the site rebuilds.",
			});
		} catch (err) {
			const message =
				err instanceof SettingsSaveError || err instanceof Error
					? err.message
					: "Failed to save homepage settings.";
			toaster.error(message);
			setError(message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Stack direction="column" gap="4" class={css({ alignItems: "stretch" })}>
			<Field
				label="Brand name"
				value={form.brandName}
				onValueChange={(value: string) =>
					setForm((f) => ({ ...f, brandName: value }))
				}
			/>
			<Field
				label="<title> fallback"
				value={form.titleFallback}
				onValueChange={(value: string) =>
					setForm((f) => ({ ...f, titleFallback: value }))
				}
			/>
			<Field
				label="Footer copyright"
				value={form.footerCopyright}
				onValueChange={(value: string) =>
					setForm((f) => ({ ...f, footerCopyright: value }))
				}
			/>

			<div>
				<Text size="sm" class={labelClass}>
					Footer links
				</Text>
				<Stack direction="column" gap="3" class={css({ alignItems: "stretch" })}>
					{form.footerLinks.map((link, index) => (
						<Stack
							key={index}
							gap="2"
							wrap="wrap"
							align="end"
							class={css({
								p: "2",
								borderWidth: "1px",
								borderColor: "border",
								borderRadius: "sm",
							})}
						>
							<div class={css({ flex: "1", minWidth: "28" })}>
								<Field
									label="Label"
									value={link.label}
									onValueChange={(value: string) =>
										updateLink(index, { label: value })
									}
								/>
							</div>
							<div class={css({ flex: "2", minWidth: "36" })}>
								<Field
									label="URL"
									value={link.href}
									onValueChange={(value: string) =>
										updateLink(index, { href: value })
									}
								/>
							</div>
							<div class={css({ flex: "1", minWidth: "28" })}>
								<Text size="xs" class={css({ fontWeight: "medium", mb: "1" })}>
									Color
								</Text>
								<InteractiveCombobox
									items={colorItems}
									value={link.colorPalette}
									onValueChange={(value: string) =>
										updateLink(index, { colorPalette: value })
									}
									size="sm"
								/>
							</div>
							<button
								type="button"
								onClick={() => removeLink(index)}
								class={cx(button({ variant: "outline", size: "sm" }))}
							>
								Remove
							</button>
						</Stack>
					))}
				</Stack>
				<button
					type="button"
					onClick={addLink}
					class={cx(
						button({ variant: "outline", size: "sm" }),
						css({ mt: "2" }),
					)}
				>
					+ Add link
				</button>
			</div>

			{error && (
				<Text size="sm" class={css({ color: "fg.error" })}>
					{error}
				</Text>
			)}

			<Stack justify="end">
				<button
					type="button"
					onClick={() => void handleSave()}
					disabled={saving}
					class={cx(button({ variant: "solid", size: "sm" }))}
				>
					{saving ? "Saving..." : "Save changes"}
				</button>
			</Stack>
		</Stack>
	);
}
