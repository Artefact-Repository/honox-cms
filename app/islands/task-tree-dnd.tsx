import { css } from "design-system/css";
import type { PropsWithChildren } from "hono/jsx";
import { useEffect, useRef } from "hono/jsx";
import { toaster } from "../components/ui/toast";
import { TASK_ORDER_GAP } from "../lib/tasks";
import { fetchFile, updateFile } from "../utils/git-backend";
import { parseFrontmatter, stringifyFrontmatter } from "../utils/markdown";
import GitTokenBanner, { useGitToken } from "./git-token-banner";

const containerClass = css({
	"& tr[draggable]": { cursor: "grab" },
	'& tr[data-dragging="true"]': { opacity: "0.4" },
	'& tr[data-drop-zone="into"]': {
		boxShadow: "inset 0 0 0 2px var(--colors-blue-8)",
		bg: "blue.subtle.bg",
	},
	'& tr[data-drop-zone="before"]': {
		boxShadow: "inset 0 2px 0 0 var(--colors-blue-8)",
	},
	'& tr[data-drop-zone="after"]': {
		boxShadow: "inset 0 -2px 0 0 var(--colors-blue-8)",
	},
	// Fail closed: hides row hover actions (Edit/Clone/Delete/"...") and
	// drops the drag cursor whenever `data-can-write` (set pre-hydration in
	// routes/_renderer.tsx's boot script from the same token this island's
	// own `useGitToken()` reads) isn't "true" — these all need the write
	// access `onDragStart` below also gates on.
	':where(html:not([data-can-write="true"])) & tr[draggable]': {
		cursor: "default",
	},
	':where(html:not([data-can-write="true"])) & [data-hover-actions]': {
		display: "none",
	},
});

interface RowInfo {
	el: HTMLTableRowElement;
	slug: string;
	parentSlug: string | undefined;
	orderKey: number;
	depth: number;
	title: string;
}

function readRow(el: HTMLTableRowElement): RowInfo | null {
	const slug = el.getAttribute("data-task-slug");
	if (!slug) return null;
	return {
		el,
		slug,
		parentSlug: el.getAttribute("data-parent-slug") || undefined,
		orderKey: Number(el.getAttribute("data-order-key") ?? 0),
		depth: Number(el.getAttribute("data-depth") ?? 0),
		title: el.getAttribute("data-task-title") ?? slug,
	};
}

type Zone = "before" | "into" | "after";

/** Wraps the tasks table (like `TableSortIsland` wraps `TableBase` — see
 * that file for why `columns[].render` can't survive going through an
 * island boundary as a prop) to add drag-and-drop reparenting/reordering on
 * top of the tree `routes/tasks/index.tsx` already renders via
 * `buildTaskTree`. Reads every row's position from its own `data-*`
 * attributes (`data-task-slug`/`data-parent-slug`/`data-order-key`/
 * `data-depth`/`data-task-title`) rather than taking a `tasks` prop, so it
 * needs no data of its own beyond what's already baked into the DOM at SSR
 * time. Commits straight to the git host, same fetch→edit→write path as
 * every other direct-commit editor (see `task-save.ts`), then reloads the
 * page — unlike TaskBoard's status drag (a fully client-state-driven
 * island), this table's rows are static SSR markup, so there's no local
 * state to optimistically patch; a reload is the equivalent "show the
 * result now" step here.
 */
export default function TaskTreeDnd({ children }: PropsWithChildren) {
	const { token, tokenSource, connect, disconnect } = useGitToken();
	const tokenRef = useRef(token);
	tokenRef.current = token;
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		const tbody = container?.querySelector("tbody");
		if (!container || !tbody) return;

		let draggingSlug: string | null = null;
		let hoveredRow: HTMLTableRowElement | null = null;

		const clearZone = () => {
			hoveredRow?.removeAttribute("data-drop-zone");
			hoveredRow = null;
		};

		const clearDragging = () => {
			for (const el of Array.from(
				tbody.querySelectorAll('tr[data-dragging="true"]'),
			)) {
				el.removeAttribute("data-dragging");
			}
		};

		// Walks `candidateSlug`'s own parent chain looking for `ancestorSlug`,
		// rather than assuming rows are still in the pre-order buildTaskTree
		// produced — a column-sort click physically reorders `<tr>`s (see
		// TableSortIsland), so DOM order can't be trusted here once that's
		// happened. Bounded by row count as a cycle guard.
		const isDescendant = (
			ancestorSlug: string,
			candidateSlug: string,
			allRows: RowInfo[],
		): boolean => {
			const bySlug = new Map(allRows.map((r) => [r.slug, r]));
			let current = bySlug.get(candidateSlug);
			const seen = new Set<string>();
			for (let i = 0; current?.parentSlug && i < allRows.length; i++) {
				if (current.parentSlug === ancestorSlug) return true;
				if (seen.has(current.parentSlug)) return false;
				seen.add(current.parentSlug);
				current = bySlug.get(current.parentSlug);
			}
			return false;
		};

		const onDragStart = (e: DragEvent) => {
			// Gate reordering/reparenting on write access up front — cancels the
			// browser's native drag entirely (rather than letting the user drag
			// through drop-zone indicators and only failing at drop, which is
			// what the `onDrop` check below used to be the sole guard against).
			if (!tokenRef.current) {
				e.preventDefault();
				return;
			}
			const row = (e.target as HTMLElement)?.closest?.(
				"tr[data-task-slug]",
			) as HTMLTableRowElement | null;
			if (!row) return;
			draggingSlug = row.getAttribute("data-task-slug");
			row.setAttribute("data-dragging", "true");
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = "move";
				e.dataTransfer.setData("text/plain", draggingSlug ?? "");
			}
		};

		const onDragOver = (e: DragEvent) => {
			if (!draggingSlug) return;
			const row = (e.target as HTMLElement)?.closest?.(
				"tr[data-task-slug]",
			) as HTMLTableRowElement | null;
			if (!row || row.getAttribute("data-task-slug") === draggingSlug) {
				clearZone();
				return;
			}
			e.preventDefault();
			const rect = row.getBoundingClientRect();
			const ratio = (e.clientY - rect.top) / rect.height;
			const zone: Zone =
				ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "into";
			if (hoveredRow && hoveredRow !== row) clearZone();
			hoveredRow = row;
			row.setAttribute("data-drop-zone", zone);
		};

		const onDragLeave = (e: DragEvent) => {
			const related = e.relatedTarget as Node | null;
			if (hoveredRow && (!related || !hoveredRow.contains(related))) {
				clearZone();
			}
		};

		const onDrop = async (e: DragEvent) => {
			e.preventDefault();
			const targetRow = hoveredRow;
			const zone = targetRow?.getAttribute("data-drop-zone") as Zone | null;
			clearZone();
			const slug = draggingSlug;
			draggingSlug = null;
			clearDragging();
			if (!slug || !targetRow || !zone) return;

			const allRows = Array.from(
				tbody.querySelectorAll<HTMLTableRowElement>("tr[data-task-slug]"),
			)
				.map(readRow)
				.filter((r): r is RowInfo => r !== null);
			const dragged = allRows.find((r) => r.slug === slug);
			const target = allRows.find((r) => r.el === targetRow);
			if (!dragged || !target || dragged.slug === target.slug) return;

			if (isDescendant(dragged.slug, target.slug, allRows)) {
				toaster.error("Can't move a task into its own subtask.");
				return;
			}

			if (!tokenRef.current) {
				toaster.error("Connect a git host token first.");
				return;
			}

			let newParentSlug: string | undefined;
			let newOrderKey: number;

			if (zone === "into") {
				newParentSlug = target.slug;
				const children = allRows.filter(
					(r) => r.parentSlug === target.slug && r.slug !== dragged.slug,
				);
				newOrderKey = children.length
					? Math.max(...children.map((c) => c.orderKey)) + TASK_ORDER_GAP
					: TASK_ORDER_GAP;
			} else {
				newParentSlug = target.parentSlug;
				// Sorted by orderKey, not DOM order — a prior column sort leaves
				// rows in an unrelated order (see isDescendant's comment above).
				const siblings = allRows
					.filter(
						(r) => r.parentSlug === newParentSlug && r.slug !== dragged.slug,
					)
					.sort((a, b) => a.orderKey - b.orderKey);
				const targetIndex = siblings.findIndex((r) => r.slug === target.slug);
				if (zone === "before") {
					const prev = siblings[targetIndex - 1];
					newOrderKey = prev
						? (prev.orderKey + target.orderKey) / 2
						: target.orderKey - TASK_ORDER_GAP;
				} else {
					const next = siblings[targetIndex + 1];
					newOrderKey = next
						? (target.orderKey + next.orderKey) / 2
						: target.orderKey + TASK_ORDER_GAP;
				}
			}

			const commitMessage =
				zone === "into"
					? `Move "${dragged.title}" under "${target.title}"`
					: `Reorder "${dragged.title}" ${zone} "${target.title}"`;

			try {
				const path = `content/tasks/${dragged.slug}.md`;
				const file = await fetchFile(path, tokenRef.current);
				const { data, content } = parseFrontmatter(file.content);
				data.parentTask = newParentSlug;
				data.order = newOrderKey;
				const newFileContent = stringifyFrontmatter(data, content);
				await updateFile(
					path,
					newFileContent,
					file.sha,
					commitMessage,
					tokenRef.current,
				);
				toaster.success(`Moved "${dragged.title}".`, {
					description: "Committed to main — reloading to show the new order.",
				});
				window.location.reload();
			} catch (error) {
				toaster.error(
					error instanceof Error ? error.message : "Failed to move the task.",
				);
			}
		};

		const onDragEnd = () => {
			draggingSlug = null;
			clearZone();
			clearDragging();
		};

		container.addEventListener("dragstart", onDragStart);
		container.addEventListener("dragover", onDragOver);
		container.addEventListener("dragleave", onDragLeave);
		container.addEventListener("drop", onDrop);
		container.addEventListener("dragend", onDragEnd);
		return () => {
			container.removeEventListener("dragstart", onDragStart);
			container.removeEventListener("dragover", onDragOver);
			container.removeEventListener("dragleave", onDragLeave);
			container.removeEventListener("drop", onDrop);
			container.removeEventListener("dragend", onDragEnd);
		};
	}, []);

	return (
		<div>
			<GitTokenBanner
				token={token}
				tokenSource={tokenSource}
				onConnect={(value) => {
					if (connect(value)) {
						toaster.success(
							"Connected — drag a row onto another to nest it, or between two rows to reorder.",
						);
					}
				}}
				onDisconnect={disconnect}
				connectedHint="drag a row onto another to nest it, or between two rows to reorder."
				promptSuffix=" to drag tasks in the table:"
			/>
			<div
				ref={(el) => {
					containerRef.current = el as HTMLDivElement | null;
				}}
				class={containerClass}
			>
				{children}
			</div>
		</div>
	);
}
