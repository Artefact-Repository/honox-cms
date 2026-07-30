import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { Switch } from "../components/ui/switch";
import { TagsField } from "../components/ui/tags-field";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { saveConfigsFields, SettingsSaveError } from "../utils/settings-save";
import { useGitToken } from "./git-token-banner";

export interface DocsSettingsFormProps {
	initial: {
		showHydrationTierBadge: boolean;
		fallbackLabel: string;
		docOrder: string[];
		docsUi: {
			edit: string;
			admin: string;
			menu: string;
			previous: string;
			next: string;
		};
	};
	/** Read-only summary of the sidenav groups — restructuring groups is a
	 * content change, not a simple setting, so it's shown but not editable
	 * here (manage it in the CMS's Configs entry instead). */
	groupsSummary: string;
}

const labelClass = css({ fontWeight: "medium", mb: "1.5" });

export default function DocsSettingsForm({
	initial,
	groupsSummary,
}: DocsSettingsFormProps) {
	const [form, setForm] = useState(initial);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { token } = useGitToken();
	const readOnly = !token;

	const setDocsUi = (patch: Partial<typeof initial.docsUi>) =>
		setForm((f) => ({ ...f, docsUi: { ...f.docsUi, ...patch } }));

	const handleSave = async () => {
		setSaving(true);
		setError(null);
		try {
			await saveConfigsFields(
				{
					docs: { showHydrationTierBadge: form.showHydrationTierBadge },
					fallbackLabel: form.fallbackLabel.trim() || "Other",
					docOrder: form.docOrder,
					docsUi: {
						edit: form.docsUi.edit.trim() || "Edit",
						admin: form.docsUi.admin.trim() || "Admin",
						menu: form.docsUi.menu.trim() || "Menu",
						previous: form.docsUi.previous.trim() || "Previous",
						next: form.docsUi.next.trim() || "Next",
					},
				},
				"Update docs settings",
			);
			toaster.success("Updated docs settings.", {
				description: "Committed to main — live once the site rebuilds.",
			});
		} catch (err) {
			const message =
				err instanceof SettingsSaveError || err instanceof Error
					? err.message
					: "Failed to save docs settings.";
			toaster.error(message);
			setError(message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Stack direction="column" gap="4" class={css({ alignItems: "stretch" })}>
			<Stack align="center" justify="space-between">
				<Text size="sm">Show hydration tier badge</Text>
				<Switch
					checked={form.showHydrationTierBadge}
					onCheckedChange={(details: { checked: boolean }) =>
						setForm((f) => ({
							...f,
							showHydrationTierBadge: details.checked,
						}))
					}
					disabled={readOnly}
				/>
			</Stack>

			<Field
				label="Fallback group label"
				value={form.fallbackLabel}
				onValueChange={(value: string) =>
					setForm((f) => ({ ...f, fallbackLabel: value }))
				}
				disabled={readOnly}
			/>

			<TagsField
				label="Explicit doc order"
				helperText="Doc slugs, in sidenav order — press Enter to add one. Docs not listed keep alphabetical order, appended after these."
				value={form.docOrder}
				onValueChange={(details: { value: string[] }) =>
					setForm((f) => ({ ...f, docOrder: details.value }))
				}
				disabled={readOnly}
			/>

			<div>
				<Text size="sm" class={labelClass}>
					Header / pager labels
				</Text>
				<Stack gap="3" wrap="wrap">
					<div class={css({ flex: "1", minWidth: "24" })}>
						<Field
							label="Edit button"
							value={form.docsUi.edit}
							onValueChange={(value: string) => setDocsUi({ edit: value })}
							disabled={readOnly}
						/>
					</div>
					<div class={css({ flex: "1", minWidth: "24" })}>
						<Field
							label="Admin button"
							value={form.docsUi.admin}
							onValueChange={(value: string) => setDocsUi({ admin: value })}
							disabled={readOnly}
						/>
					</div>
					<div class={css({ flex: "1", minWidth: "24" })}>
						<Field
							label="Mobile menu toggle"
							value={form.docsUi.menu}
							onValueChange={(value: string) => setDocsUi({ menu: value })}
							disabled={readOnly}
						/>
					</div>
					<div class={css({ flex: "1", minWidth: "24" })}>
						<Field
							label="Previous doc label"
							value={form.docsUi.previous}
							onValueChange={(value: string) => setDocsUi({ previous: value })}
							disabled={readOnly}
						/>
					</div>
					<div class={css({ flex: "1", minWidth: "24" })}>
						<Field
							label="Next doc label"
							value={form.docsUi.next}
							onValueChange={(value: string) => setDocsUi({ next: value })}
							disabled={readOnly}
						/>
					</div>
				</Stack>
			</div>

			<div>
				<Text size="sm" class={labelClass}>
					Sidenav groups
				</Text>
				<Text size="sm" class={css({ color: "fg.muted" })}>
					{groupsSummary} — restructure groups in the CMS's Configs entry.
				</Text>
			</div>

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
