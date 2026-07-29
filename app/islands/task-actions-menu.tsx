import { css } from "design-system/css";
import { useState } from "hono/jsx";
import { IconButton } from "../components/ui/button";
import { Dropdown } from "../components/ui/dropdown";
import { EllipsisIcon } from "../icons/ellipsis";
import TaskCloneDialog from "./task-clone-dialog";
import TaskDeleteDialog from "./task-delete-dialog";
import TaskToProject, { type TaskToProjectProps } from "./task-to-project";
import TaskToSubtask from "./task-to-subtask";

export interface TaskActionsMenuProps
	extends Omit<TaskToProjectProps, "open" | "onOpenChange"> {
	editHref: string;
	/** Candidate parents for "Convert to... Subtask" — every other task
	 * except this one and its own descendants. */
	tasks: { label: string; value: string }[];
}

export default function TaskActionsMenu(props: TaskActionsMenuProps) {
	const { editHref, tasks, ...taskProps } = props;
	const [convertToProjectOpen, setConvertToProjectOpen] = useState(false);
	const [convertToSubtaskOpen, setConvertToSubtaskOpen] = useState(false);
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
							{
								type: "item",
								label: "Project",
								value: "convert-to-project",
							},
							{
								type: "item",
								label: "Subtask",
								value: "convert-to-subtask",
							},
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
					if (value === "convert-to-project") setConvertToProjectOpen(true);
					if (value === "convert-to-subtask") setConvertToSubtaskOpen(true);
					if (value === "clone") setCloneOpen(true);
					if (value === "delete") setDeleteOpen(true);
				}}
			/>
			<TaskToProject
				{...taskProps}
				open={convertToProjectOpen}
				onOpenChange={setConvertToProjectOpen}
			/>
			<TaskToSubtask
				slug={taskProps.slug}
				title={taskProps.title}
				tasks={tasks}
				open={convertToSubtaskOpen}
				onOpenChange={setConvertToSubtaskOpen}
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
