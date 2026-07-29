import { css } from "design-system/css";
import { useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import { InteractiveCombobox } from "../components/ui/combobox-primitive";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { saveTaskField } from "../utils/task-save";

export interface TaskProjectEditorProps {
	value: string;
	projects: { label: string; value: string }[];
	editHref: string;
	slug: string;
}

// Same nested-island trap as the other task editors: `InteractiveCombobox` is
// imported straight from combobox-primitive, not the `Combobox` wrapper in
// components/ui (which would hydrate as its own separate island). Saves via
// the same saveTaskField direct-commit path as TaskEditableText, falling
// back to the same "local draft, link to the CMS" messaging if no token is
// connected or the request fails.
export default function TaskProjectEditor(props: TaskProjectEditorProps) {
	const [value, setValue] = useState(props.value);
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);

	return (
		<div class={css({ minWidth: "48" })}>
			<InteractiveCombobox
				items={props.projects}
				value={value}
				onValueChange={(next: string) => {
					setValue(next);
					if (next === props.value) return;
					setSaving(true);
					saveTaskField(props.slug, (data) => ({
						data: { ...data, project: next },
					}))
						.then(() => {
							toaster.success("Saved.", {
								description: "Committed to main — live once the site rebuilds.",
							});
						})
						.catch((error: unknown) => {
							setDirty(true);
							toaster.error(
								error instanceof Error ? error.message : "Failed to save.",
							);
						})
						.finally(() => setSaving(false));
				}}
				placeholder="Search projects..."
				allowClear
				size="sm"
			/>

			{saving && (
				<Text size="sm" class={css({ color: "fg.muted", mt: "1" })}>
					Saving…
				</Text>
			)}

			{!saving && dirty && (
				<Text size="sm" class={css({ color: "fg.muted", mt: "1" })}>
					Edited locally — not saved.{" "}
					<Anchor href={props.editHref} target="_blank" variant="plain">
						Edit in the CMS
					</Anchor>{" "}
					to make it permanent.
				</Text>
			)}
		</div>
	);
}
