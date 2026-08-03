import { cx } from "design-system/css";
import { pagination } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { ChevronLeftIcon } from "../icons/chevron-left";
import { ChevronRightIcon } from "../icons/chevron-right";

interface TaskPaginationProps {
	totalPages: number;
	pageSize: number;
}

const FILTER_HIDDEN_ATTRS = [
	"data-status-hidden",
	"data-priority-hidden",
	"data-assignee-hidden",
	"data-project-hidden",
];

function isFilteredOut(row: HTMLTableRowElement): boolean {
	return FILTER_HIDDEN_ATTRS.some((attr) => row.getAttribute(attr) === "true");
}

/** Re-derives page membership from whichever root tasks are *currently*
 * visible under the independent status/priority/assignee filter islands —
 * not from a page number computed once server-side — so e.g. filtering 51
 * root tasks down to 12 collapses 3 pages into 1, instead of leaving stale
 * page boundaries sized for the unfiltered set. Keyed by each row's
 * `data-root-index` (stamped by `computeTaskTreePages` in app/lib/tasks.ts)
 * rather than DOM position, since a sortable column can reorder rows without
 * changing which subtree they belong to. */
function computePageByRootIndex(pageSize: number): {
	pageByRootIndex: Map<number, number>;
	totalPages: number;
} {
	const roots = Array.from(
		document.querySelectorAll<HTMLTableRowElement>(
			'tr[data-task-slug][data-depth="0"]',
		),
	).sort(
		(a, b) =>
			Number(a.getAttribute("data-root-index")) -
			Number(b.getAttribute("data-root-index")),
	);
	const visibleRootIndices = roots
		.filter((row) => !isFilteredOut(row))
		.map((row) => Number(row.getAttribute("data-root-index") ?? "0"));

	const pageByRootIndex = new Map<number, number>();
	visibleRootIndices.forEach((rootIndex, position) => {
		pageByRootIndex.set(rootIndex, Math.floor(position / pageSize) + 1);
	});

	return {
		pageByRootIndex,
		totalPages: Math.max(1, Math.ceil(visibleRootIndices.length / pageSize)),
	};
}

function applyPageVisibility(
	page: number | null,
	pageByRootIndex: Map<number, number>,
) {
	for (const row of document.querySelectorAll<HTMLTableRowElement>(
		"tr[data-task-slug]",
	)) {
		if (page === null) {
			row.removeAttribute("data-page-hidden");
			continue;
		}
		const rootIndex = Number(row.getAttribute("data-root-index") ?? "0");
		if (pageByRootIndex.get(rootIndex) === page) {
			row.removeAttribute("data-page-hidden");
		} else {
			row.setAttribute("data-page-hidden", "true");
		}
	}
}

// Static builds prerender with no query string, so pick up a shareable
// `?page=` once hydrated — same as InteractiveSearch's `?q=` handling. Read
// synchronously via useState's lazy initialiser (not a follow-up effect that
// calls setPage) so the client's first render already has the right page —
// two renders (1, then corrected) left a stale-closure window where the
// visibility effect below could apply the old page.
function initialPageFromUrl(totalPages: number): number {
	if (typeof window === "undefined") return 1;
	const requested = Number(
		new URLSearchParams(window.location.search).get("page") ?? "1",
	);
	return Number.isFinite(requested)
		? Math.min(Math.max(1, Math.floor(requested)), totalPages)
		: 1;
}

/** Client-driven pagination for the tasks tree table. This site is a static
 * (SSG) build (see wrangler.jsonc: assets-only, no per-request Worker), so
 * every row for every page is already in the one prerendered HTML file (see
 * `data-root-index` in custom-table-renderers.tsx, stamped by
 * `computeTaskTreePages` in app/lib/tasks.ts) — "changing page" here just
 * toggles `data-page-hidden` on the rows already in the DOM, the same
 * reasoning `InteractiveSearch` in app/islands/search.tsx already uses for
 * its `?q=` param.
 *
 * Page *count* isn't fixed either: it's recomputed (see
 * `computePageByRootIndex`) from whichever root tasks the independent
 * status/priority/assignee filter islands currently leave visible, so
 * filtering down to fewer tasks collapses the page count instead of leaving
 * stale, too-large page boundaries. Pagination is suppressed entirely while
 * a search is active (the `"search:filter"` event Search dispatches) so
 * search results still surface matches from every page, not just the one
 * currently selected.
 *
 * Deliberately doesn't use `../components/ui/pagination-primitive`'s
 * Root/Item context API — that file is also imported directly (non-island)
 * by `../components/ui/pagination.tsx`, and being reachable from both a
 * static and a dynamic (island) import graph makes the production bundler
 * wrap its exports in a shape that isn't a plain `default` export, which
 * silently breaks island hydration (confirmed on the built output: this
 * exact issue already affects the pre-existing `pagination.tsx` and
 * `paginated-table.tsx` islands too — worth fixing separately). Building the
 * handful of buttons here directly sidesteps that shared module entirely. */
export default function TaskPagination({
	totalPages: initialTotalPages,
	pageSize,
}: TaskPaginationProps) {
	const [page, setPage] = useState(() => initialPageFromUrl(initialTotalPages));
	const [searchActive, setSearchActive] = useState(false);
	const [totalPages, setTotalPages] = useState(initialTotalPages);

	useEffect(() => {
		const onSearchFilter = (event: Event) => {
			const detail = (event as CustomEvent).detail as
				| { filterAttribute?: string; query?: string }
				| undefined;
			if (detail?.filterAttribute !== "data-task-slug") return;
			setSearchActive(Boolean(detail.query));
		};
		window.addEventListener("search:filter", onSearchFilter);
		return () => window.removeEventListener("search:filter", onSearchFilter);
	}, []);

	useEffect(() => {
		if (searchActive) {
			applyPageVisibility(null, new Map());
			return;
		}

		const recompute = () => {
			const { pageByRootIndex, totalPages: nextTotalPages } =
				computePageByRootIndex(pageSize);
			setTotalPages(nextTotalPages);
			const clampedPage = Math.min(page, nextTotalPages);
			// Apply immediately against the clamped value rather than waiting for
			// `setPage` to flow back through a re-render, so the DOM is never
			// left showing a stale page while state catches up.
			applyPageVisibility(clampedPage, pageByRootIndex);
			if (clampedPage !== page) setPage(clampedPage);
			const url = new URL(window.location.href);
			if (clampedPage > 1) {
				url.searchParams.set("page", String(clampedPage));
			} else {
				url.searchParams.delete("page");
			}
			window.history.replaceState(null, "", url);
		};
		recompute();

		// Two independent kinds of DOM change need to trigger a recompute, not
		// just the initial one above:
		// (1) TaskStatusFilter/TaskPriorityFilter/TaskAssigneeFilter/
		//     TaskProjectFilter (sibling islands) each toggle their own
		//     `data-*-hidden` attribute on rows
		//     whenever the user changes a filter — that's exactly what should
		//     shrink/grow the page count.
		// (2) TaskTreeDnd (another sibling, wrapping the table) hydrates by
		//     cloning fresh rows from its own server-rendered `<template>`
		//     snapshot rather than reusing the live DOM nodes (see
		//     app/islands/task-tree-dnd.tsx and the "honox island children not
		//     live" note this mirrors) — if that clone-and-replace finishes
		//     after `recompute()` above, it silently wipes every
		//     `data-page-hidden` this just set, since it's swapping in nodes
		//     that never had them. All islands hydrate concurrently with no
		//     defined order, so reacting to the replacement itself — rather
		//     than assuming a fixed timing — is what actually makes this
		//     reliable instead of racy.
		// `attributeFilter` is deliberately just the filter attributes above
		// (not `data-page-hidden`), so this observer can't self-trigger on its
		// own writes.
		const observer = new MutationObserver(recompute);
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: FILTER_HIDDEN_ATTRS,
		});
		return () => observer.disconnect();
	}, [page, searchActive, pageSize]);

	if (totalPages <= 1 || searchActive) return null;

	const styles = pagination({});
	const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

	return (
		<nav
			role="navigation"
			aria-label="Pagination Navigation"
			class={styles.root}
			data-scope="pagination"
			data-part="root"
		>
			<button
				type="button"
				class={styles.prevTrigger}
				data-scope="pagination"
				data-part="prev-trigger"
				aria-label="Previous Page"
				disabled={page <= 1}
				onClick={() => setPage((current) => Math.max(1, current - 1))}
			>
				<ChevronLeftIcon width="20" height="20" />
			</button>
			{pages.map((value) => (
				<button
					key={value}
					type="button"
					class={styles.item}
					data-scope="pagination"
					data-part="item"
					data-value={String(value)}
					data-selected={page === value ? "" : undefined}
					aria-current={page === value ? "page" : undefined}
					aria-label={`Page ${value}`}
					onClick={() => setPage(value)}
				>
					{value}
				</button>
			))}
			<button
				type="button"
				class={cx(styles.nextTrigger)}
				data-scope="pagination"
				data-part="next-trigger"
				aria-label="Next Page"
				disabled={page >= totalPages}
				onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
			>
				<ChevronRightIcon width="20" height="20" />
			</button>
		</nav>
	);
}
