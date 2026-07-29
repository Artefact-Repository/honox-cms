import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Dialog } from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { cloneTask, TaskSaveError } from "../utils/task-save";

export interface TaskCloneDialogProps {
	task: { slug: string; title: string } | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Controlled clone dialog shared by TaskCloneAction (the tasks table's
 * click-delegated trigger) and the task detail page's "..." menu — both just
 * need to hand it a `{ slug, title }` and let it own the copy-name prompt and
 * the actual clone call.
 */
export default function TaskCloneDialog({
	task,
	open,
	onOpenChange,
}: TaskCloneDialogProps) {
	const [title, setTitle] = useState("");
	const [cloning, setCloning] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (task) {
			setTitle(`${task.title} (Copy)`);
			setError(null);
		}
	}, [task]);

	const close = () => {
		if (cloning) return;
		onOpenChange(false);
		setError(null);
	};

	const handleClone = async () => {
		if (!task) return;
		const trimmed = title.trim();
		if (!trimmed) {
			setError("Enter a name for the copy.");
			return;
		}
		setCloning(true);
		setError(null);
		try {
			await cloneTask(task.slug, trimmed);
			toaster.success(`Cloned "${task.title}" as "${trimmed}".`, {
				description: "Committed to main — live once the site rebuilds.",
			});
			onOpenChange(false);
		} catch (err) {
			setError(
				err instanceof TaskSaveError || err instanceof Error
					? err.message
					: "Failed to clone the task.",
			);
		} finally {
			setCloning(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next: boolean) => {
				if (!next) close();
			}}
			title={task ? `Clone "${task.title}"` : "Clone task"}
			description="Creates a new task file with the same fields and commits it straight to main."
			// Passed as `body`/`cancel`/`confirm` (not `children`) — Dialog only
			// applies the recipe's padding and the footer's top border/divider
			// to those dedicated slots; bare `children` renders unstyled between
			// them (see task-details-drawer.tsx for the same fix).
			body={
				<Stack
					direction="column"
					gap="4"
					class={css({ alignItems: "stretch", width: "full" })}
				>
					<Field
						label="New task name"
						value={title}
						onValueChange={setTitle}
						required
					/>

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
					disabled={cloning}
					class={cx(button({ variant: "outline", size: "sm" }))}
				>
					Cancel
				</button>
			}
			confirm={
				<button
					type="button"
					onClick={() => void handleClone()}
					disabled={cloning || !title.trim()}
					class={cx(button({ variant: "solid", size: "sm" }))}
				>
					{cloning ? "Cloning..." : "Clone"}
				</button>
			}
		/>
	);
}
