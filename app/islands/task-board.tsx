import { css } from "design-system/css";
import { useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import type { ColorPalette } from "../components/ui/color-palette";
import {
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
	type Task,
	type TaskPriority,
	type TaskStatus,
} from "../lib/tasks";
import { formatDate } from "../utils/date";
import { fetchFile, updateFile } from "../utils/git-backend";
import { parseFrontmatter, stringifyFrontmatter } from "../utils/markdown";
import GitTokenBanner, { useGitToken } from "./git-token-banner";

export interface TaskBoardProps {
	tasks: Task[];
	/** Merged configs.json `pms.statusColors`/`priorityColors` overrides —
	 * falls back to the built-in defaults when omitted. */
	statusColors?: Record<TaskStatus, ColorPalette>;
	priorityColors?: Record<TaskPriority, ColorPalette>;
}

export default function TaskBoard({
	tasks: initialTasks,
	statusColors = TASK_STATUS_COLOR,
	priorityColors = TASK_PRIORITY_COLOR,
}: TaskBoardProps) {
	const [tasks, setTasks] = useState<Task[]>(initialTasks);
	const { token, tokenSource, connect, disconnect } = useGitToken();
	const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
	const [savingSlug, setSavingSlug] = useState<string | null>(null);
	const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

	const handleDrop = async (newStatus: TaskStatus) => {
		const slug = draggingSlug;
		setDraggingSlug(null);
		if (!slug) return;
		const task = tasks.find((t) => t.slug === slug);
		if (!task || task.status === newStatus) return;

		if (!token) {
			toaster.error("Connect a git host token first.");
			return;
		}

		const previousStatus = task.status;
		setTasks((prev) =>
			prev.map((t) => (t.slug === slug ? { ...t, status: newStatus } : t)),
		);
		setSavingSlug(slug);

		try {
			const path = `content/tasks/${slug}.md`;
			const file = await fetchFile(path, token);
			const { data, content } = parseFrontmatter(file.content);
			data.status = newStatus;
			const newFileContent = stringifyFrontmatter(data, content);
			await updateFile(
				path,
				newFileContent,
				file.sha,
				`Move "${task.title}" to ${newStatus}`,
				token,
			);
			toaster.success(`Moved "${task.title}" to ${newStatus}.`, {
				description: "Committed to main — live once the site rebuilds.",
			});
		} catch (error) {
			setTasks((prev) =>
				prev.map((t) =>
					t.slug === slug ? { ...t, status: previousStatus } : t,
				),
			);
			toaster.error(error instanceof Error ? error.message : "Failed to save.");
		} finally {
			setSavingSlug(null);
		}
	};

	return (
		<div>
			<GitTokenBanner
				token={token}
				tokenSource={tokenSource}
				onConnect={(value) => {
					if (connect(value)) {
						toaster.success("Connected — drag a card to move it.");
					}
				}}
				onDisconnect={disconnect}
				connectedHint="drag a card to move it."
				promptSuffix=" to drag tasks between columns:"
			/>

			<div
				class={css({
					display: "grid",
					gridTemplateColumns: {
						base: "1fr",
						sm: "repeat(2, 1fr)",
						lg: "repeat(4, 1fr)",
					},
					gap: "4",
					alignItems: "start",
				})}
			>
				{TASK_STATUSES.map((status) => {
					const columnTasks = tasks.filter((task) => task.status === status);
					return (
						// biome-ignore lint/a11y/noStaticElementInteractions: native HTML5 drag-and-drop drop zone; there's no keyboard-accessible equivalent interaction to route through a semantic role yet
						<div
							key={status}
							onDragOver={(e: DragEvent) => {
								e.preventDefault();
								setDragOverStatus(status);
							}}
							onDragLeave={() =>
								setDragOverStatus((prev) => (prev === status ? null : prev))
							}
							onDrop={(e: DragEvent) => {
								e.preventDefault();
								setDragOverStatus(null);
								handleDrop(status);
							}}
							class={css({
								borderRadius: "md",
								p: "1",
								minHeight: "12",
								transition: "background-color 0.15s",
								bg: dragOverStatus === status ? "blue.subtle.bg" : undefined,
							})}
						>
							<Stack
								align="center"
								justify="space-between"
								class={css({ mb: "3" })}
							>
								<Text
									size="xs"
									class={css({
										fontWeight: "semibold",
										textTransform: "uppercase",
										letterSpacing: "wide",
										color: "fg.muted",
									})}
								>
									{status}
								</Text>
								<Badge
									variant="subtle"
									size="sm"
									colorPalette={statusColors[status]}
								>
									{columnTasks.length}
								</Badge>
							</Stack>
							<Stack direction="vertical" gap="3">
								{columnTasks.map((task) => (
									// biome-ignore lint/a11y/noStaticElementInteractions: native HTML5 drag-and-drop draggable item; same no-keyboard-equivalent gap as the column drop zone above
									<div
										key={task.slug}
										draggable
										onDragStart={() => setDraggingSlug(task.slug)}
										onDragEnd={() => setDraggingSlug(null)}
										class={css({
											cursor: token ? "grab" : "default",
											opacity: savingSlug === task.slug ? "0.5" : "1",
											transition: "opacity 0.15s",
										})}
									>
										<Card
											variant="outline"
											colorPalette={priorityColors[task.priority]}
											bodyClass={css({ p: "3" })}
										>
											<Anchor
												href={`/tasks/${task.slug}`}
												variant="plain"
												class={css({
													display: "block",
													textDecoration: "none",
												})}
											>
												<Text
													size="sm"
													class={css({
														fontWeight: "medium",
														mb: task.parentTask ? "0.5" : "2",
													})}
												>
													{task.title}
												</Text>
											</Anchor>
											{task.parentTask &&
												tasks.find((t) => t.slug === task.parentTask) && (
													<Text
														size="xs"
														class={css({ color: "fg.muted", mb: "2" })}
													>
														↳{" "}
														{
															tasks.find((t) => t.slug === task.parentTask)
																?.title
														}
													</Text>
												)}
											<Stack align="center" justify="space-between">
												<Badge
													variant="subtle"
													size="sm"
													colorPalette={priorityColors[task.priority]}
												>
													{task.priority}
												</Badge>
												{task.assignee && (
													<Avatar size="xs" name={task.assignee} />
												)}
											</Stack>
											{task.dueDate && (
												<Text
													size="xs"
													class={css({ color: "fg.muted", mt: "2" })}
												>
													Due {formatDate(task.dueDate)}
												</Text>
											)}
										</Card>
									</div>
								))}
							</Stack>
						</div>
					);
				})}
			</div>
		</div>
	);
}
