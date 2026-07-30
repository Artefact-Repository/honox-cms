import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import type { ColorPalette } from "../components/ui/color-palette";
import { Drawer } from "../components/ui/drawer";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import {
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	type Task,
	type TaskPriority,
	type TaskStatus,
} from "../lib/tasks";
import { formatDate } from "../utils/date";

export interface TaskDetailsDrawerProps {
	tasks: Task[];
	projectTitleBySlug?: Record<string, string>;
	/** Merged configs.json `pms.statusColors`/`priorityColors` overrides —
	 * falls back to the built-in defaults when omitted. */
	statusColors?: Record<TaskStatus, ColorPalette>;
	priorityColors?: Record<TaskPriority, ColorPalette>;
}

// Mounted once for the whole tasks table (see hoverActions in
// routes/tasks/index.tsx), not once per row: the table wraps in
// TableSortIsland whenever a column is sortable, and that island hydrates by
// cloning already-rendered DOM back in rather than re-executing it (see its
// own comment) — a live island nested inside a table cell would have its
// hooks go dead the same way the Splitter panels[].content bug did. Instead
// each row only renders a static `[data-task-details-trigger]` button (or,
// for the title column, an `<a href="/tasks/[slug]">` kept as a no-JS
// fallback), and this island (rendered as a normal sibling, outside the
// table) delegates a single document click listener and looks the task up
// from its own props.
export default function TaskDetailsDrawer({
	tasks,
	projectTitleBySlug = {},
	statusColors = TASK_STATUS_COLOR,
	priorityColors = TASK_PRIORITY_COLOR,
}: TaskDetailsDrawerProps) {
	const [task, setTask] = useState<Task | null>(null);

	useEffect(() => {
		const bySlug = new Map(tasks.map((t) => [t.slug, t]));
		const onClick = (event: MouseEvent) => {
			const trigger = (event.target as HTMLElement)?.closest?.(
				"[data-task-details-trigger]",
			);
			if (!trigger) return;
			if (trigger.tagName === "A") {
				// Let ctrl/cmd/shift/middle-clicks fall through to the browser's
				// normal open-in-new-tab/window behavior; only intercept a plain
				// left-click to open the drawer instead of navigating.
				if (
					event.metaKey ||
					event.ctrlKey ||
					event.shiftKey ||
					event.altKey ||
					event.button !== 0
				) {
					return;
				}
				event.preventDefault();
			}
			const slug = trigger.getAttribute("data-task-slug");
			const found = slug ? bySlug.get(slug) : undefined;
			if (found) setTask(found);
		};
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, [tasks]);

	return (
		<Drawer
			open={task != null}
			onOpenChange={(next: boolean) => {
				if (!next) setTask(null);
			}}
			size="lg"
			title={task?.title ?? ""}
			description="Task details"
			footer={
				task ? (
					<Anchor
						href={`/tasks/${task.slug}`}
						class={cx(button({ variant: "outline", size: "sm" }))}
					>
						Open full page →
					</Anchor>
				) : undefined
			}
			// Passed as `body` (not `children`) — see task-create-drawer.tsx for
			// why: only the `<Body>` part gets the drawer recipe's `flex: 1` /
			// `overflow: auto` / bottom padding, so a long excerpt or tag list
			// scrolls instead of overflowing past the (absolutely-positioned)
			// footer.
			body={
				task ? (
					<Stack
						direction="column"
						gap="4"
						class={css({ alignItems: "stretch", width: "full" })}
					>
						<Stack gap="2" wrap="wrap">
							<Badge variant="subtle" colorPalette={statusColors[task.status]}>
								{task.status}
							</Badge>
							<Badge
								variant="subtle"
								colorPalette={priorityColors[task.priority]}
							>
								{task.priority}
							</Badge>
						</Stack>

						<Stack gap="4" wrap="wrap" align="center">
							{projectTitleBySlug[task.project] && (
								<Anchor
									href={`/projects/${task.project}`}
									variant="plain"
									class={css({ textStyle: "sm" })}
								>
									{projectTitleBySlug[task.project]}
								</Anchor>
							)}
							{task.assignee && (
								<Stack gap="2" align="center">
									<Avatar size="xs" name={task.assignee} />
									<Text size="sm">{task.assignee}</Text>
								</Stack>
							)}
							{task.dueDate && (
								<Text size="sm" class={css({ color: "fg.muted" })}>
									Due {formatDate(task.dueDate)}
								</Text>
							)}
						</Stack>

						{task.excerpt && (
							<Text size="sm" class={css({ color: "fg.muted" })}>
								{task.excerpt}
							</Text>
						)}

						{task.tags.length > 0 && (
							<Stack gap="2" wrap="wrap">
								{task.tags.map((tag) => (
									<Badge
										key={tag}
										variant="subtle"
										colorPalette="gray"
										size="sm"
									>
										{tag}
									</Badge>
								))}
							</Stack>
						)}
					</Stack>
				) : undefined
			}
		/>
	);
}
