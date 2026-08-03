import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Dialog } from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { cloneProject, ProjectSaveError } from "../utils/project-save";

export interface ProjectCloneDialogProps {
	project: { slug: string; title: string } | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCloned?: (newSlug: string) => void;
}

/**
 * Controlled clone dialog shared by ProjectRowActionsMenu (the projects list page's
 * click-delegated trigger) and the project detail page's "..." menu — both just
 * need to hand it a `{ slug, title }` and let it own the copy-name prompt and
 * the actual clone call.
 */
export default function ProjectCloneDialog({
	project,
	open,
	onOpenChange,
	onCloned,
}: ProjectCloneDialogProps) {
	const [title, setTitle] = useState("");
	const [cloning, setCloning] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (project) {
			setTitle(`${project.title} (Copy)`);
			setError(null);
		}
	}, [project]);

	const close = () => {
		if (cloning) return;
		onOpenChange(false);
		setError(null);
	};

	const handleClone = async () => {
		if (!project) return;
		const trimmed = title.trim();
		if (!trimmed) {
			setError("Enter a name for the copy.");
			return;
		}
		setCloning(true);
		setError(null);
		try {
			const newSlug = await cloneProject(project.slug, trimmed);
			toaster.success(`Cloned "${project.title}" as "${trimmed}".`, {
				description: "Committed to main — live once the site rebuilds.",
			});
			onOpenChange(false);
			if (onCloned) {
				onCloned(newSlug);
			}
		} catch (err) {
			const message =
				err instanceof ProjectSaveError || err instanceof Error
					? err.message
					: "Failed to clone the project.";
			// Toasted so a failure is never missed
			toaster.error(message);
			setError(message);
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
			title={project ? `Clone "${project.title}"` : "Clone project"}
			description="Creates a new project file with the same fields and commits it straight to main."
			body={
				<Stack
					direction="column"
					gap="4"
					class={css({ alignItems: "stretch", width: "full" })}
				>
					<Field
						label="New project name"
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
