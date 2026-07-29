import type { PropsWithChildren } from "hono/jsx";
import { useEffect, useState } from "hono/jsx";

// A wrapping controller, not the table's own hydration. `TableBase`'s
// `columns[].render`/`sortValue` are functions — HonoX hydrates islands by
// `JSON.parse`-ing a serialized-props attribute (see
// node_modules/honox/dist/client/client.js), which silently drops any
// function on a prop. If the table itself were the hydrated component, every
// custom-rendered cell (links, badges, formatted dates) would revert to its
// raw underlying value the instant JS ran — not just on sort, immediately on
// hydration, since HonoX's `<table>` output would already be missing those
// functions on first mount.
//
// JSX passed as `children`, on the other hand, survives an island boundary
// intact: HonoX slot-lifts element-valued props into a `<template>` that's
// cloned back in as real DOM, not re-executed from serialized data (same
// mechanism documented for other islands in this codebase). So this island
// receives the *already fully server-rendered* `<TableBase>` output as
// `children` and only ever touches it via plain DOM APIs — reading
// `data-sort-<key>` attributes `TableBase` baked into each `<tr>` at SSR
// time, and physically reordering those existing `<tr>` nodes on click. It
// never re-renders cell content, so the real markup is never at risk.
export default function TableSortIsland({ children }: PropsWithChildren) {
	const [container, setContainer] = useState<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!container) return;

		const table = container.querySelector("table");
		const tbody = table?.querySelector("tbody");
		if (!table || !tbody) return;

		let active: { key: string; direction: "asc" | "desc" } | null = null;

		const applySort = () => {
			if (!active) return;
			const attr = `data-sort-${active.key}`;
			const rows = Array.from(tbody.querySelectorAll(":scope > tr"));
			rows.sort((a, b) =>
				(a.getAttribute(attr) ?? "").localeCompare(b.getAttribute(attr) ?? ""),
			);
			if (active.direction === "desc") rows.reverse();
			for (const row of rows) tbody.appendChild(row);
		};

		const buttons = Array.from(
			table.querySelectorAll<HTMLButtonElement>("[data-sort-key]"),
		);
		const cleanups: Array<() => void> = [];

		for (const button of buttons) {
			const key = button.getAttribute("data-sort-key");
			if (!key) continue;

			const onClick = () => {
				active =
					active?.key === key
						? { key, direction: active.direction === "asc" ? "desc" : "asc" }
						: { key, direction: "asc" };

				for (const other of buttons) {
					const indicator = other.querySelector("[data-sort-indicator]");
					if (!indicator) continue;
					if (other === button) {
						indicator.setAttribute("data-active", "true");
						indicator.setAttribute("data-direction", active.direction);
					} else {
						indicator.setAttribute("data-active", "false");
					}
				}

				applySort();
			};

			button.addEventListener("click", onClick);
			cleanups.push(() => button.removeEventListener("click", onClick));
		}

		return () => {
			for (const cleanup of cleanups) cleanup();
		};
	}, [container]);

	return <div ref={setContainer}>{children}</div>;
}
