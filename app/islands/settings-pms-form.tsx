import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { Badge } from "../components/ui/badge";
import { Collapsible } from "../components/ui/collapsible";
import { InteractiveCombobox } from "../components/ui/combobox-primitive";
import { Grid } from "../components/ui/grid";
import { Stack } from "../components/ui/stack";
import { Switch } from "../components/ui/switch";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { ChevronDownIcon } from "../icons/chevron-down";
import { PROJECT_COLOR_PALETTES } from "../lib/projects";
import { saveConfigsFields, SettingsSaveError } from "../utils/settings-save";
import { useGitToken } from "./git-token-banner";

const colorItems = PROJECT_COLOR_PALETTES.map((c) => ({ label: c, value: c }));

export interface PmsSettingsFormProps {
	initial: {
		subtasksExpandedByDefault: boolean;
		/** Every key (task status/priority/project status) present, each
		 * mapped to its current effective color — defaults already merged in
		 * by the server, so every row has a value to show. */
		statusColors: Record<string, string>;
		priorityColors: Record<string, string>;
		projectStatusColors: Record<string, string>;
	};
}

const labelClass = css({ fontWeight: "medium", mb: "1.5" });

function ColorMapEditor({
	entries,
	onChange,
	disabled,
}: {
	entries: Record<string, string>;
	onChange: (key: string, colorPalette: string) => void;
	disabled?: boolean;
}) {
	return (
		<Stack direction="column" gap="2" class={css({ alignItems: "stretch" })}>
			{Object.entries(entries).map(([key, colorPalette]) => (
				<Stack key={key} align="center" justify="space-between" gap="3">
					<Badge variant="subtle" size="sm" colorPalette={colorPalette}>
						{key}
					</Badge>
					<div class={css({ width: "36" })}>
						<InteractiveCombobox
							items={colorItems}
							value={colorPalette}
							onValueChange={(value: string) => onChange(key, value)}
							size="sm"
							disabled={disabled}
						/>
					</div>
				</Stack>
			))}
		</Stack>
	);
}

export default function PmsSettingsForm({ initial }: PmsSettingsFormProps) {
	const [form, setForm] = useState(initial);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { token } = useGitToken();
	const readOnly = !token;

	const handleSave = async () => {
		setSaving(true);
		setError(null);
		try {
			await saveConfigsFields(
				{
					pms: {
						subtasksExpandedByDefault: form.subtasksExpandedByDefault,
						statusColors: Object.entries(form.statusColors).map(
							([status, colorPalette]) => ({ status, colorPalette }),
						),
						priorityColors: Object.entries(form.priorityColors).map(
							([priority, colorPalette]) => ({ priority, colorPalette }),
						),
						projectStatusColors: Object.entries(
							form.projectStatusColors,
						).map(([status, colorPalette]) => ({ status, colorPalette })),
					},
				},
				"Update PMS settings",
			);
			toaster.success("Updated PMS settings.", {
				description: "Committed to main — live once the site rebuilds.",
			});
		} catch (err) {
			const message =
				err instanceof SettingsSaveError || err instanceof Error
					? err.message
					: "Failed to save PMS settings.";
			toaster.error(message);
			setError(message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Stack direction="column" gap="5" class={css({ alignItems: "stretch" })}>
			<Stack align="center" justify="space-between">
				<Text size="sm">Subtasks expanded by default</Text>
				<Switch
					checked={form.subtasksExpandedByDefault}
					onCheckedChange={(details: { checked: boolean }) =>
						setForm((f) => ({
							...f,
							subtasksExpandedByDefault: details.checked,
						}))
					}
					disabled={readOnly}
				/>
			</Stack>

			<Collapsible
				interactive
				defaultOpen={false}
				trigger={
					<button
						type="button"
						class={css({
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							width: "full",
						})}
					>
						<Text size="sm" class={css({ fontWeight: "medium" })}>
							Advanced theming settings
						</Text>
					</button>
				}
				indicator={
					<ChevronDownIcon
						width="14"
						height="14"
						class={css({
							color: "fg.muted",
							transition: "transform 0.2s",
							"[data-state=open] &": { transform: "rotate(180deg)" },
						})}
					/>
				}
				contentClass={css({ pt: "4" })}
				content={
					<Grid columns={{ base: 1, md: 3 }} gap="5">
						<div>
							<Text size="sm" class={labelClass}>
								Task status colors
							</Text>
							<ColorMapEditor
								entries={form.statusColors}
								onChange={(key, colorPalette) =>
									setForm((f) => ({
										...f,
										statusColors: { ...f.statusColors, [key]: colorPalette },
									}))
								}
								disabled={readOnly}
							/>
						</div>

						<div>
							<Text size="sm" class={labelClass}>
								Task priority colors
							</Text>
							<ColorMapEditor
								entries={form.priorityColors}
								onChange={(key, colorPalette) =>
									setForm((f) => ({
										...f,
										priorityColors: {
											...f.priorityColors,
											[key]: colorPalette,
										},
									}))
								}
								disabled={readOnly}
							/>
						</div>

						<div>
							<Text size="sm" class={labelClass}>
								Project status colors
							</Text>
							<ColorMapEditor
								entries={form.projectStatusColors}
								onChange={(key, colorPalette) =>
									setForm((f) => ({
										...f,
										projectStatusColors: {
											...f.projectStatusColors,
											[key]: colorPalette,
										},
									}))
								}
								disabled={readOnly}
							/>
						</div>
					</Grid>
				}
			/>

			{error && (
				<Text size="sm" class={css({ color: "fg.error" })}>
					{error}
				</Text>
			)}

			<Stack align="center" justify="end" gap="3">
				{readOnly && (
					<Text size="xs" class={css({ color: "fg.muted" })}>
						Connect a git host token above to edit.
					</Text>
				)}
				<button
					type="button"
					onClick={() => void handleSave()}
					disabled={saving || readOnly}
					class={cx(button({ variant: "solid", size: "sm" }))}
				>
					{saving ? "Saving..." : "Save changes"}
				</button>
			</Stack>
		</Stack>
	);
}
