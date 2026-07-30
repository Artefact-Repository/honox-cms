// biome-ignore lint/style/useExportsLast: allow exporting props interface alongside component
import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { InteractiveCombobox } from "../components/ui/combobox-primitive";
import { Dialog } from "../components/ui/dialog";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { saveTaskField, TaskSaveError } from "../utils/task-save";

export interface TaskToSubtaskDialogProps {
	task: { slug: string; title: string };
	tasks: { label: string; value: string }[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function TaskToSubtaskDialog({
	task,
	tasks,
	open,
	onOpenChange,
}: TaskToSubtaskDialogProps) {
	const [selectedParentSlug, setSelectedParentSlug] = useState("");
	const [converting, setConverting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const close = () => {
		if (converting) return;
		onOpenChange(false);
		setError(null);
		setSelectedParentSlug("");
	};

	const handleConvert = async () => {
		if (!task) return;
		if (!selectedParentSlug) {
			setError("Please select a parent task.");
			return;
		}
		setConverting(true);
		setError(null);
		try {
			await saveTaskField(task.slug, (data) => {
				return {
					data: {
						...data,
						parentTask: selectedParentSlug,
					},
				};
			});
			toaster.success(`Converted "${task.title}" to subtask.`, {
				description: "Committed to main — live once the site rebuilds.",
			});
			onOpenChange(false);
			window.location.reload();
		} catch (err) {
			const message =
				err instanceof TaskSaveError || err instanceof Error
					? err.message
					: "Failed to convert task to subtask.";
			// Toasted (not just shown inline) so a failure — e.g. a 404 from a
			// git host permission gap — is never missed (see task-create-drawer's
			// same fix).
			toaster.error(message);
			setError(message);
		} finally {
			setConverting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next: boolean) => {
				if (!next) close();
			}}
			title={`Convert "${task.title}" to Subtask`}
			description="Select a parent task to nest this task under."
			body={
				<Stack
					direction="column"
					gap="4"
					class={css({ alignItems: "stretch", width: "full" })}
				>
					<div>
						<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
							Parent task
						</Text>
						<InteractiveCombobox
							items={tasks}
							value={selectedParentSlug}
							onValueChange={setSelectedParentSlug}
							placeholder="Search parent task..."
							allowClear
							size="sm"
						/>
					</div>

					{error && (
						<Text size="sm" class={css({ color: "fg.error" })}>
							{error}
						</Text>
					)}
				</Stack>
			}
			cancel={
				<button
					type="button"
					disabled={converting}
					class={cx(button({ variant: "outline", size: "sm" }))}
				>
					Cancel
				</button>
			}
			confirm={
				<button
					type="button"
					onClick={() => void handleConvert()}
					disabled={converting || !selectedParentSlug}
					class={cx(button({ variant: "solid", size: "sm" }))}
				>
					{converting ? "Converting..." : "Convert"}
				</button>
			}
		/>
	);
}
