import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import type { ColorPalette } from "../components/ui/color-palette";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { TASK_STATUS_COLOR, type Task, type TaskStatus } from "../lib/tasks";
import { useGitToken } from "./git-token-banner";
import TaskCreateDrawer from "./task-create-drawer";

export interface TaskSubtasksProps {
	/** The task whose subtasks these are — the "+ Add subtask" drawer
	 * defaults to this task's project and pre-fills it as the parent. */
	task: Pick<Task, "slug" | "project" | "title">;
	subtasks: Task[];
	projects: { label: string; value: string }[];
	/** Candidate parent tasks for the create drawer's picker — every other
	 * task, so a subtask's parent can be changed away from the default. */
	tasks: { label: string; value: string }[];
	/** Merged configs.json `pms.statusColors` overrides — falls back to the
	 * built-in default when omitted. */
	statusColors?: Record<TaskStatus, ColorPalette>;
}

// Rendered directly on the task detail page (routes/tasks/[slug].tsx), not
// nested inside a Table, so — unlike TaskDetailsDrawer/TaskCloneAction/etc —
// there's no TableSortIsland DOM-cloning hazard here and this can just own
// its own "+ Add subtask" drawer state directly.
export default function TaskSubtasks({
	task,
	subtasks,
	projects,
	tasks,
	statusColors = TASK_STATUS_COLOR,
}: TaskSubtasksProps) {
	// Same "no token → no button" gate as PmsCreateMenu — creating a subtask is
	// a direct-commit write, and read-only visitors already get the subtask
	// list itself (below) with no editable affordance stripped from it.
	const { token } = useGitToken();
	const [open, setOpen] = useState(false);
	const done = subtasks.filter((subtask) => subtask.status === "Done").length;

	return (
		<div>
			<Stack align="center" justify="space-between" class={css({ mb: "3" })}>
				<Stack align="center" gap="2">
					<Text size="sm" class={css({ fontWeight: "semibold" })}>
						Subtasks
					</Text>
					{subtasks.length > 0 && (
						<Badge variant="subtle" size="sm" colorPalette="gray">
							{done}/{subtasks.length} done
						</Badge>
					)}
				</Stack>
				{token && (
					<button
						type="button"
						onClick={() => setOpen(true)}
						class={cx(button({ variant: "outline", size: "sm" }))}
					>
						+ Add subtask
					</button>
				)}
			</Stack>

			{subtasks.length === 0 ? (
				<Text size="sm" class={css({ color: "fg.muted" })}>
					No subtasks yet.
				</Text>
			) : (
				<Stack
					direction="column"
					gap="2"
					class={css({ alignItems: "stretch" })}
				>
					{subtasks.map((subtask) => (
						<Stack
							key={subtask.slug}
							align="center"
							justify="space-between"
							gap="3"
							class={css({
								borderWidth: "1px",
								borderColor: "border",
								borderRadius: "md",
								px: "3",
								py: "2",
							})}
						>
							<Stack align="center" gap="3" class={css({ minWidth: "0" })}>
								<Badge
									variant="subtle"
									size="sm"
									colorPalette={statusColors[subtask.status]}
								>
									{subtask.status}
								</Badge>
								<Anchor
									href={`/tasks/${subtask.slug}`}
									variant="plain"
									class={css({
										textStyle: "sm",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									})}
								>
									{subtask.title}
								</Anchor>
							</Stack>
							{subtask.assignee && <Avatar size="xs" name={subtask.assignee} />}
						</Stack>
					))}
				</Stack>
			)}

			<TaskCreateDrawer
				open={open}
				onOpenChange={setOpen}
				projects={projects}
				defaultProjectSlug={task.project}
				tasks={tasks}
				defaultParentTaskSlug={task.slug}
			/>
		</div>
	);
}
