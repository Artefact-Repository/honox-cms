import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import {
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
	type Task,
	type TaskStatus,
} from "../lib/tasks";
import {
	clearStoredToken,
	fetchFile,
	resolveToken,
	setStoredToken,
	updateFile,
} from "../utils/git-backend";
import { parseFrontmatter, stringifyFrontmatter } from "../utils/markdown";

function formatDate(value?: string) {
	if (!value) return undefined;
	return new Date(value).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export interface TaskBoardProps {
	tasks: Task[];
}

export default function TaskBoard({ tasks: initialTasks }: TaskBoardProps) {
	const [tasks, setTasks] = useState<Task[]>(initialTasks);
	const [token, setToken] = useState<string | null>(null);
	const [tokenSource, setTokenSource] = useState<"sveltia" | "manual" | null>(
		null,
	);
	const [tokenInput, setTokenInput] = useState("");
	const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
	const [savingSlug, setSavingSlug] = useState<string | null>(null);
	const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

	// localStorage only exists client-side, so the connect state can't be
	// known during SSR — read it once after hydration.
	useEffect(() => {
		const resolved = resolveToken();
		setToken(resolved.token);
		setTokenSource(resolved.source);
	}, []);

	const handleConnect = (event: Event) => {
		event.preventDefault();
		if (!tokenInput.trim()) return;
		setStoredToken(tokenInput.trim());
		setToken(tokenInput.trim());
		setTokenSource("manual");
		setTokenInput("");
		toaster.success("Connected — drag a card to move it.");
	};

	const handleDisconnect = () => {
		clearStoredToken();
		setToken(null);
		setTokenSource(null);
	};

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
			{token ? (
				<Stack
					align="center"
					gap="2"
					class={css({ mb: "4", color: "fg.muted" })}
				>
					<Text size="xs">
						{tokenSource === "sveltia"
							? "Using your CMS login — drag a card to move it."
							: "Connected — drag a card to move it."}
					</Text>
					{tokenSource === "manual" && (
						<button
							type="button"
							onClick={handleDisconnect}
							class={css({
								all: "unset",
								cursor: "pointer",
								fontSize: "xs",
								textDecoration: "underline",
							})}
						>
							Disconnect
						</button>
					)}
				</Stack>
			) : (
				<form
					onSubmit={handleConnect}
					class={css({
						display: "flex",
						flexWrap: "wrap",
						alignItems: "center",
						gap: "2",
						mb: "4",
						p: "3",
						borderWidth: "1px",
						borderColor: "border",
						borderRadius: "md",
						bg: "gray.subtle.bg",
					})}
				>
					<Text size="sm" class={css({ color: "fg.muted" })}>
						Connect a personal access token (repo contents read/write access) to
						drag tasks between columns:
					</Text>
					<input
						type="password"
						value={tokenInput}
						placeholder="Personal access token"
						onInput={(e: Event) =>
							setTokenInput((e.target as HTMLInputElement).value)
						}
						class={css({
							borderWidth: "1px",
							borderColor: "border",
							borderRadius: "sm",
							px: "2",
							py: "1",
							fontSize: "sm",
							minWidth: "200px",
						})}
					/>
					<button
						type="submit"
						class={cx(button({ variant: "outline", size: "sm" }))}
					>
						Connect
					</button>
				</form>
			)}

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
									colorPalette={TASK_STATUS_COLOR[status]}
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
											colorPalette={TASK_PRIORITY_COLOR[task.priority]}
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
													class={css({ fontWeight: "medium", mb: "2" })}
												>
													{task.title}
												</Text>
											</Anchor>
											<Stack align="center" justify="space-between">
												<Badge
													variant="subtle"
													size="sm"
													colorPalette={TASK_PRIORITY_COLOR[task.priority]}
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
