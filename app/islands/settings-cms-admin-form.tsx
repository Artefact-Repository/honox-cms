import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { Alert } from "../components/ui/alert";
import { InteractiveCombobox } from "../components/ui/combobox-primitive";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { Switch } from "../components/ui/switch";
import { TagsField } from "../components/ui/tags-field";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import {
	type CmsAdminSettings,
	CmsConfigSaveError,
	saveCmsAdminSettings,
} from "../utils/cms-config-save";
import { useGitToken } from "./git-token-banner";

const backendItems = [
	{ label: "github", value: "github" },
	{ label: "gitlab", value: "gitlab" },
	{ label: "gitea", value: "gitea" },
];

const labelClass = css({ fontWeight: "medium", mb: "1.5" });

export interface CmsAdminSettingsFormProps {
	initial: CmsAdminSettings;
}

export default function CmsAdminSettingsForm({
	initial,
}: CmsAdminSettingsFormProps) {
	const [form, setForm] = useState(initial);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { token } = useGitToken();
	const readOnly = !token;

	const localeItems = form.i18n.locales.map((l) => ({ label: l, value: l }));

	const handleSave = async () => {
		setSaving(true);
		setError(null);
		try {
			await saveCmsAdminSettings({
				backend: {
					name: form.backend.name.trim() || "github",
					repo: form.backend.repo.trim(),
					branch: form.backend.branch.trim() || "main",
					baseUrl: form.backend.baseUrl.trim(),
				},
				i18n: {
					structure: form.i18n.structure.trim() || "multiple_folders",
					locales: form.i18n.locales,
					defaultLocale: form.i18n.defaultLocale.trim() || "en",
					omitDefaultLocaleFromFilePath:
						form.i18n.omitDefaultLocaleFromFilePath,
				},
				media: {
					mediaFolder: form.media.mediaFolder.trim(),
					publicFolder: form.media.publicFolder.trim(),
				},
			});
			toaster.success("Updated CMS admin settings.", {
				description: "Committed to main — live once the site rebuilds.",
			});
		} catch (err) {
			const message =
				err instanceof CmsConfigSaveError || err instanceof Error
					? err.message
					: "Failed to save CMS admin settings.";
			toaster.error(message);
			setError(message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Stack direction="column" gap="4" class={css({ alignItems: "stretch" })}>
			<Alert
				status="warning"
				title="Handle with care"
				description="These control where the CMS admin and every git-backed editor on this site (including this page) read from and commit to. A wrong repo, branch, or malformed value can lock everyone out of /admin until it's fixed directly in git."
			/>

			<div>
				<Text size="sm" class={labelClass}>
					Backend type
				</Text>
				<InteractiveCombobox
					items={backendItems}
					value={form.backend.name}
					onValueChange={(value: string) =>
						setForm((f) => ({ ...f, backend: { ...f.backend, name: value } }))
					}
					size="sm"
					disabled={readOnly}
				/>
			</div>

			<Field
				label="Repository (owner/repo)"
				value={form.backend.repo}
				onValueChange={(value: string) =>
					setForm((f) => ({ ...f, backend: { ...f.backend, repo: value } }))
				}
				disabled={readOnly}
			/>
			<Field
				label="Branch"
				value={form.backend.branch}
				onValueChange={(value: string) =>
					setForm((f) => ({ ...f, backend: { ...f.backend, branch: value } }))
				}
				disabled={readOnly}
			/>
			<Field
				label="Base URL (OAuth proxy — required for gitea/forgejo, optional otherwise)"
				value={form.backend.baseUrl}
				onValueChange={(value: string) =>
					setForm((f) => ({
						...f,
						backend: { ...f.backend, baseUrl: value },
					}))
				}
				disabled={readOnly}
			/>

			<Field
				label="i18n structure"
				helperText="e.g. multiple_folders — see sveltiacms.app/en/docs/config-i18n for valid values"
				value={form.i18n.structure}
				onValueChange={(value: string) =>
					setForm((f) => ({ ...f, i18n: { ...f.i18n, structure: value } }))
				}
				disabled={readOnly}
			/>

			<TagsField
				label="Locales"
				helperText="Locale codes, e.g. en, zh — press Enter to add one"
				value={form.i18n.locales}
				onValueChange={(details: { value: string[] }) =>
					setForm((f) => ({
						...f,
						i18n: { ...f.i18n, locales: details.value },
					}))
				}
				disabled={readOnly}
			/>

			<div>
				<Text size="sm" class={labelClass}>
					Default locale
				</Text>
				<InteractiveCombobox
					items={localeItems}
					value={form.i18n.defaultLocale}
					onValueChange={(value: string) =>
						setForm((f) => ({
							...f,
							i18n: { ...f.i18n, defaultLocale: value },
						}))
					}
					size="sm"
					disabled={readOnly}
				/>
			</div>

			<Stack align="center" justify="space-between">
				<Text size="sm">Omit default locale from file path</Text>
				<Switch
					checked={form.i18n.omitDefaultLocaleFromFilePath}
					onCheckedChange={(details: { checked: boolean }) =>
						setForm((f) => ({
							...f,
							i18n: {
								...f.i18n,
								omitDefaultLocaleFromFilePath: details.checked,
							},
						}))
					}
					disabled={readOnly}
				/>
			</Stack>

			<Field
				label="Media folder"
				value={form.media.mediaFolder}
				onValueChange={(value: string) =>
					setForm((f) => ({
						...f,
						media: { ...f.media, mediaFolder: value },
					}))
				}
				disabled={readOnly}
			/>
			<Field
				label="Public folder"
				value={form.media.publicFolder}
				onValueChange={(value: string) =>
					setForm((f) => ({
						...f,
						media: { ...f.media, publicFolder: value },
					}))
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
