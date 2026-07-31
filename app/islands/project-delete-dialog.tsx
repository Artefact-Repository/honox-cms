import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { colorPaletteClass } from "../components/ui/color-palette";
import { Dialog } from "../components/ui/dialog";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { deleteProject, ProjectSaveError } from "../utils/project-save";

export interface ProjectDeleteDialogProps {
	project: { slug: string; title: string } | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called after the file is actually deleted, so each caller can update
	 * its own view — removing a project card vs. navigating away from the project's
	 * own detail page. */
	onDeleted?: (slug: string) => void;
}

/**
 * Controlled delete-confirmation dialog shared by ProjectRowActionsMenu (the
 * projects listing's click-delegated trigger) and the project detail page's "..."
 * menu — both just hand it a `{ slug, title }` and let it own the confirm
 * prompt and the actual delete call.
 */
export default function ProjectDeleteDialog({
	project,
	open,
	onOpenChange,
	onDeleted,
}: ProjectDeleteDialogProps) {
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const close = () => {
		if (deleting) return;
		onOpenChange(false);
		setError(null);
	};

	const handleDelete = async () => {
		if (!project) return;
		setDeleting(true);
		setError(null);
		try {
			await deleteProject(project.slug);
			toaster.success(`Deleted "${project.title}".`, {
				description: "Committed to main — live once the site rebuilds.",
			});
			onOpenChange(false);
			onDeleted?.(project.slug);
		} catch (err) {
			const message =
				err instanceof ProjectSaveError || err instanceof Error
					? err.message
					: "Failed to delete the project.";
			toaster.error(message);
			setError(message);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next: boolean) => {
				if (!next) close();
			}}
			role="alertdialog"
			title={project ? `Delete "${project.title}"?` : "Delete project?"}
			description="This removes the project file and commits straight to main — it can't be undone from here."
			body={
				error ? (
					<Text size="sm" class={css({ color: "fg.error" })}>
						{error}
					</Text>
				) : undefined
			}
			cancel={
				<button
					type="button"
					disabled={deleting}
					class={cx(button({ variant: "outline", size: "sm" }))}
				>
					Cancel
				</button>
			}
			confirm={
				<button
					type="button"
					onClick={() => void handleDelete()}
					disabled={deleting}
					class={cx(
						button({ variant: "solid", size: "sm" }),
						colorPaletteClass("red"),
					)}
				>
					{deleting ? "Deleting..." : "Delete"}
				</button>
			}
		/>
	);
}
