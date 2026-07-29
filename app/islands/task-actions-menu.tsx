// biome-ignore lint/style/useExportsLast: allow exporting props interface alongside component
import { css } from "design-system/css";
import { useState } from "hono/jsx";
import { IconButton } from "../components/ui/button";
import { Dropdown } from "../components/ui/dropdown";
import { EllipsisIcon } from "../icons/ellipsis";
import TaskCloneDialog from "./task-clone-dialog";
import TaskDeleteDialog from "./task-delete-dialog";
import TaskToProject, { type TaskToProjectProps } from "./task-to-project";
import TaskToSubtaskDialog from "./task-to-subtask-dialog";

export interface TaskActionsMenuProps
	extends Omit<TaskToProjectProps, "open" | "onOpenChange"> {
	editHref: string;
	tasks: { label: string; value: string }[];
}

export default function TaskActionsMenu(props: TaskActionsMenuProps) {
	const { editHref, tasks, ...taskProps } = props;
	const [convertOpen, setConvertOpen] = useState(false);
	const [subtaskOpen, setSubtaskOpen] = useState(false);
	const [cloneOpen, setCloneOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	return (
		<>
			<Dropdown
				trigger={
					<IconButton variant="outline" size="sm" aria-label="More actions">
						<EllipsisIcon width="16" height="16" />
					</IconButton>
				}
				placement="bottomRight"
				contentClass={css({ minWidth: "48", whiteSpace: "nowrap" })}
				items={[
					{ type: "item", label: "Edit", value: "edit", href: editHref },
					{ type: "item", label: "Clone", value: "clone" },
					{
						type: "submenu",
						label: "Convert to...",
						items: [
							{ type: "item", label: "Project", value: "convert-to-project" },
							{ type: "item", label: "Subtask", value: "convert-to-subtask" },
						],
					},
					{ type: "separator" },
					{
						type: "item",
						label: "Delete",
						value: "delete",
						class: css({ color: "fg.error" }),
					},
				]}
				onSelect={(value) => {
					if (value === "convert-to-project") setConvertOpen(true);
					if (value === "convert-to-subtask") setSubtaskOpen(true);
					if (value === "clone") setCloneOpen(true);
					if (value === "delete") setDeleteOpen(true);
				}}
			/>
			<TaskToProject
				{...taskProps}
				open={convertOpen}
				onOpenChange={setConvertOpen}
			/>
			<TaskToSubtaskDialog
				task={{ slug: taskProps.slug, title: taskProps.title }}
				tasks={tasks}
				open={subtaskOpen}
				onOpenChange={setSubtaskOpen}
			/>
			<TaskCloneDialog
				task={{ slug: taskProps.slug, title: taskProps.title }}
				open={cloneOpen}
				onOpenChange={setCloneOpen}
			/>
			<TaskDeleteDialog
				task={{ slug: taskProps.slug, title: taskProps.title }}
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onDeleted={() => {
					window.location.href = "/tasks";
				}}
			/>
		</>
	);
}
