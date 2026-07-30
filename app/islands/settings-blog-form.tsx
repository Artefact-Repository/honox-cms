import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { Switch } from "../components/ui/switch";
import { Text } from "../components/ui/text";
import { Textarea } from "../components/ui/textarea";
import { toaster } from "../components/ui/toast";
import { saveConfigsFields, SettingsSaveError } from "../utils/settings-save";
import { useGitToken } from "./git-token-banner";

export interface BlogSettingsFormProps {
	initial: {
		showAuthor: boolean;
		showReadTime: boolean;
		excludeUntranslatedFromSearch: boolean;
		newsletterHeading: string;
		newsletterDescription: string;
	};
}

export default function BlogSettingsForm({ initial }: BlogSettingsFormProps) {
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
					blog: {
						showAuthor: form.showAuthor,
						showReadTime: form.showReadTime,
						excludeUntranslatedFromSearch: form.excludeUntranslatedFromSearch,
						newsletterHeading: form.newsletterHeading.trim(),
						newsletterDescription: form.newsletterDescription.trim(),
					},
				},
				"Update blog settings",
			);
			toaster.success("Updated blog settings.", {
				description: "Committed to main — live once the site rebuilds.",
			});
		} catch (err) {
			const message =
				err instanceof SettingsSaveError || err instanceof Error
					? err.message
					: "Failed to save blog settings.";
			toaster.error(message);
			setError(message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Stack direction="column" gap="4" class={css({ alignItems: "stretch" })}>
			<Stack align="center" justify="space-between">
				<Text size="sm">Show author byline</Text>
				<Switch
					checked={form.showAuthor}
					onCheckedChange={(details: { checked: boolean }) =>
						setForm((f) => ({ ...f, showAuthor: details.checked }))
					}
					disabled={readOnly}
				/>
			</Stack>
			<Stack align="center" justify="space-between">
				<Text size="sm">Show read time</Text>
				<Switch
					checked={form.showReadTime}
					onCheckedChange={(details: { checked: boolean }) =>
						setForm((f) => ({ ...f, showReadTime: details.checked }))
					}
					disabled={readOnly}
				/>
			</Stack>
			<Stack align="center" justify="space-between">
				<Text size="sm">Exclude untranslated posts from search</Text>
				<Switch
					checked={form.excludeUntranslatedFromSearch}
					onCheckedChange={(details: { checked: boolean }) =>
						setForm((f) => ({
							...f,
							excludeUntranslatedFromSearch: details.checked,
						}))
					}
					disabled={readOnly}
				/>
			</Stack>

			<Field
				label="Newsletter heading"
				value={form.newsletterHeading}
				onValueChange={(value: string) =>
					setForm((f) => ({ ...f, newsletterHeading: value }))
				}
				disabled={readOnly}
			/>
			<Textarea
				label="Newsletter description"
				rows={3}
				value={form.newsletterDescription}
				onValueChange={(value: string) =>
					setForm((f) => ({ ...f, newsletterDescription: value }))
				}
				disabled={readOnly}
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
