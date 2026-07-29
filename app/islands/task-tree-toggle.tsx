import { useEffect } from "hono/jsx";

function recomputeVisibility(table: HTMLTableElement) {
	const rows = Array.from(
		table.querySelectorAll<HTMLTableRowElement>("tbody > tr[data-task-slug]"),
	);
	const collapsedSlugs = new Set(
		Array.from(
			table.querySelectorAll<HTMLElement>(
				'[data-subtask-toggle][data-expanded="false"]',
			),
		).map((toggle) => toggle.getAttribute("data-task-slug")),
	);
	const parentBySlug = new Map(
		rows.map((row) => [
			row.getAttribute("data-task-slug"),
			row.getAttribute("data-parent-slug"),
		]),
	);

	for (const row of rows) {
		let slug: string | null | undefined = row.getAttribute("data-task-slug");
		let hidden = false;
		// Bounded by row count: a well-formed tree can't have a parent chain
		// longer than the number of rows, and buildTaskTree already breaks any
		// cycle a hand-edited frontmatter file could introduce.
		for (let i = 0; slug && i < rows.length; i++) {
			const parentSlug = parentBySlug.get(slug);
			if (!parentSlug) break;
			if (collapsedSlugs.has(parentSlug)) {
				hidden = true;
				break;
			}
			slug = parentSlug;
		}
		if (hidden) row.setAttribute("data-tree-hidden", "true");
		else row.removeAttribute("data-tree-hidden");
	}
}

// Singleton, document-level click delegation — same reasoning as
// TaskDetailsDrawer/TaskCloneAction/TaskDeleteConfirm: a live island can't
// sit directly in a `column.render`/`hoverActions` cell once the table has a
// sortable column (TableSortIsland physically moves the existing `<tr>` DOM
// nodes on sort rather than re-rendering them, so — unlike those other
// islands — the toggle state below actually survives a re-sort for free).
// Visibility is recomputed from each row's `data-parent-slug` chain rather
// than DOM position, so it doesn't care what order TableSortIsland leaves
// the rows in either.
export default function TaskTreeToggle() {
	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			const toggle = (event.target as HTMLElement)?.closest?.(
				"[data-subtask-toggle]",
			);
			if (!toggle) return;
			const table = toggle.closest("table");
			if (!table) return;
			const expanded = toggle.getAttribute("data-expanded") !== "false";
			const next = expanded ? "false" : "true";
			toggle.setAttribute("data-expanded", next);
			toggle.setAttribute("aria-expanded", next);
			recomputeVisibility(table);
		};
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, []);

	return null;
}
