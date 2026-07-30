import { useEffect, useRef, useState } from "hono/jsx";
import { Dropdown } from "../components/ui/dropdown";
import { toaster } from "../components/ui/toast";
import {
	buildTaskTree,
	TASK_ORDER_GAP,
	type Task,
	type TaskTreeEntry,
} from "../lib/tasks";
import { saveTaskField, TaskSaveError } from "../utils/task-save";
import TaskToProject from "./task-to-project";

export interface TaskRowActionsMenuProps {
	tasks: Task[];
}

function siblingBucketKey(task: Task): string {
	return task.parentTask ?? "__top__";
}

interface MoveTarget {
	newParentSlug: string | undefined;
	newOrderKey: number;
}

/** Outdent — promotes a task to be its current parent's next sibling (one
 * level up). `null` when the task is already top-level (nothing to outdent
 * to). Mirrors the "after" math in `task-tree-dnd.tsx`'s drag-and-drop, just
 * computed from `buildTaskTree` entries instead of DOM attributes, since a
 * menu click already has the full `tasks` array to work with. */
function computeOutdent(
	entries: TaskTreeEntry[],
	slug: string,
): MoveTarget | null {
	const bySlug = new Map(entries.map((e) => [e.task.slug, e]));
	const current = bySlug.get(slug);
	if (!current?.task.parentTask) return null;
	const parent = bySlug.get(current.task.parentTask);
	if (!parent) return null;
	const parentSiblings = entries
		.filter((e) => siblingBucketKey(e.task) === siblingBucketKey(parent.task))
		.sort((a, b) => a.orderKey - b.orderKey);
	const parentIndex = parentSiblings.findIndex(
		(e) => e.task.slug === parent.task.slug,
	);
	const next = parentSiblings[parentIndex + 1];
	const newOrderKey = next
		? (parent.orderKey + next.orderKey) / 2
		: parent.orderKey + TASK_ORDER_GAP;
	return { newParentSlug: parent.task.parentTask, newOrderKey };
}

/** Indent — nests a task under the sibling immediately before it (one level
 * down), appended to the end of that sibling's existing children. `null`
 * when the task is already the first in its sibling group (nothing to nest
 * under). */
function computeIndent(
	entries: TaskTreeEntry[],
	slug: string,
): MoveTarget | null {
	const bySlug = new Map(entries.map((e) => [e.task.slug, e]));
	const current = bySlug.get(slug);
	if (!current) return null;
	const siblings = entries
		.filter((e) => siblingBucketKey(e.task) === siblingBucketKey(current.task))
		.sort((a, b) => a.orderKey - b.orderKey);
	const index = siblings.findIndex((e) => e.task.slug === slug);
	const prev = siblings[index - 1];
	if (!prev) return null;
	const children = entries.filter((e) => e.task.parentTask === prev.task.slug);
	const newOrderKey = children.length
		? Math.max(...children.map((c) => c.orderKey)) + TASK_ORDER_GAP
		: TASK_ORDER_GAP;
	return { newParentSlug: prev.task.slug, newOrderKey };
}

/**
 * Singleton "..." row menu for the tasks table — Edit + "Convert to..."
 * (Project / Parent / Children) only; Clone and Delete stay on their own
 * dedicated hover buttons (TaskCloneAction/TaskDeleteConfirm), unchanged.
 *
 * Same document-click delegation as those two islands (see
 * [[honox-table-hoveractions-no-nested-islands]]: a live island can't sit
 * directly in `hoverActions` once the table has a sortable column) — but a
 * *dropdown* can't just reuse their "look the task up and render a
 * centered dialog" trick, since it has to be anchored at the clicked
 * button's position, not the middle of the screen.
 *
 * `Dropdown`'s normal trigger-anchored placement (`overlay-position.ts`) is
 * relative CSS (`position: absolute; top: 100%`) computed off the trigger's
 * own position *in this island's own render tree* — it has no way to place
 * itself at an arbitrary point elsewhere in the page. Its "contextDropdown"
 * mode does support that (fixed, viewport-relative coordinates off the
 * triggering `MouseEvent`, for right-click menus) — so this renders one
 * always-present, invisible `context-trigger` div and, on every delegated
 * row click, synthesizes a `contextmenu` event at that button's own
 * `getBoundingClientRect()` and dispatches it there. The dispatch is
 * deferred to an effect keyed on `selectedSlug` (not fired inline in the
 * click handler) so it runs *after* the state update it depends on has
 * actually re-rendered `items` — dispatching synchronously would open the
 * menu with the *previous* row's items for one click.
 */
export default function TaskRowActionsMenu({ tasks }: TaskRowActionsMenuProps) {
	const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
	const [projectOpen, setProjectOpen] = useState(false);
	const contextTriggerRef = useRef<HTMLDivElement | null>(null);
	const pendingPointRef = useRef<{
		x: number;
		y: number;
		yBottom: number;
	} | null>(null);
	const forcedRowRef = useRef<HTMLElement | null>(null);

	const selectedTask = tasks.find((t) => t.slug === selectedSlug) ?? null;
	const entries = buildTaskTree(tasks);
	const outdent = selectedSlug ? computeOutdent(entries, selectedSlug) : null;
	const indent = selectedSlug ? computeIndent(entries, selectedSlug) : null;

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			const trigger = (event.target as HTMLElement)?.closest?.(
				"[data-task-row-actions-trigger]",
			) as HTMLElement | null;
			if (!trigger) return;
			const slug = trigger.getAttribute("data-task-slug");
			if (!slug) return;
			const rect = trigger.getBoundingClientRect();
			// `y` is the anchor's *top* edge — see `data-open-upward` below — so
			// the menu prefers opening above the row instead of covering the
			// ones under it; `yBottom` lets the primitive flip to opening below
			// instead when there isn't enough room above (e.g. the first row).
			pendingPointRef.current = {
				x: rect.left,
				y: rect.top,
				yBottom: rect.bottom,
			};
			setSelectedSlug(slug);
		};
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, []);

	useEffect(() => {
		const point = pendingPointRef.current;
		const target = contextTriggerRef.current;
		if (!selectedSlug || !point || !target) return;
		pendingPointRef.current = null;
		target.setAttribute("data-anchor-bottom", String(point.yBottom));
		target.dispatchEvent(
			new MouseEvent("contextmenu", {
				bubbles: true,
				cancelable: true,
				clientX: point.x,
				clientY: point.y,
			}),
		);
	}, [selectedSlug]);

	const applyMove = async (target: MoveTarget) => {
		if (!selectedTask) return;
		try {
			await saveTaskField(selectedTask.slug, (data) => ({
				data: {
					...data,
					parentTask: target.newParentSlug,
					order: target.newOrderKey,
				},
			}));
			toaster.success(`Moved "${selectedTask.title}".`, {
				description: "Committed to main — reloading to show the new order.",
			});
			window.location.reload();
		} catch (error) {
			toaster.error(
				error instanceof TaskSaveError || error instanceof Error
					? error.message
					: "Failed to move the task.",
			);
		}
	};

	// Keeps the row's hover-actions bar visible for as long as its dropdown is
	// open — see the `data-force-visible` rule in table.ts for why `:hover` /
	// `:focus-within` alone aren't enough here.
	const handleOpenChange = (open: boolean) => {
		if (!open) {
			forcedRowRef.current?.removeAttribute("data-force-visible");
			forcedRowRef.current = null;
			return;
		}
		const trigger = document.querySelector<HTMLElement>(
			`[data-task-row-actions-trigger][data-task-slug="${CSS.escape(selectedSlug ?? "")}"]`,
		);
		const row = trigger?.closest<HTMLElement>("tr");
		if (!row) return;
		row.setAttribute("data-force-visible", "");
		forcedRowRef.current = row;
	};

	const handleSelect = (value: string) => {
		if (value === "convert-to-project") setProjectOpen(true);
		if (value === "convert-to-parent" && outdent) void applyMove(outdent);
		if (value === "convert-to-children" && indent) void applyMove(indent);
	};

	return (
		<>
			<Dropdown
				triggerMode="contextDropdown"
				onOpenChange={handleOpenChange}
				trigger={
					// Never clicked directly — a fixed point the click delegation
					// above fires a synthetic `contextmenu` at, so this can just sit
					// inert at the origin.
					<div
						ref={(el) => {
							contextTriggerRef.current = el as HTMLDivElement | null;
						}}
						data-open-upward
						style={{ position: "fixed", top: "0px", left: "0px" }}
					/>
				}
				items={
					selectedTask
						? [
								{
									type: "item",
									label: "Edit in CMS",
									value: "edit",
									href: `/admin/#/collections/tasks/entries/${selectedTask.slug}`,
								},
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
											label: "Parent",
											value: "convert-to-parent",
											disabled: !outdent,
										},
										{
											type: "item",
											label: "Children",
											value: "convert-to-children",
											disabled: !indent,
										},
									],
								},
							]
						: []
				}
				onSelect={handleSelect}
			/>
			{selectedTask && (
				<TaskToProject
					slug={selectedTask.slug}
					title={selectedTask.title}
					excerpt={selectedTask.excerpt}
					priority={selectedTask.priority}
					assignee={selectedTask.assignee}
					dueDate={selectedTask.dueDate}
					tags={selectedTask.tags}
					open={projectOpen}
					onOpenChange={setProjectOpen}
				/>
			)}
		</>
	);
}
