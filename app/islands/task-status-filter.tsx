import { css } from "design-system/css";
import { useEffect, useState } from "hono/jsx";
import { Button } from "../components/ui/button";
import { Dropdown } from "../components/ui/dropdown";
import { FilterIcon } from "../icons/filter";
import { TASK_STATUSES } from "../lib/tasks";

export default function TaskStatusFilter() {
	const [checkedStatuses, setCheckedStatuses] = useState<string[]>([
		"To Do",
		"In Progress",
		"In Review",
		"Done",
	]);

	const handleSelect = (status: string) => {
		setCheckedStatuses((prev) => {
			const next = prev.includes(status)
				? prev.filter((s) => s !== status)
				: [...prev, status];
			return next;
		});
	};

	useEffect(() => {
		const updateTaskVisibility = () => {
			const table = document.querySelector("table");
			if (!table) return;

			const rows = table.querySelectorAll<HTMLTableRowElement>(
				"tbody > tr[data-task-status]",
			);
			let visibleCount = 0;

			for (const row of rows) {
				const status = row.getAttribute("data-task-status") || "";
				const isStatusChecked = checkedStatuses.includes(status);

				if (isStatusChecked) {
					row.removeAttribute("data-status-hidden");
				} else {
					row.setAttribute("data-status-hidden", "true");
				}

				const isSearchVisible = !row.hidden;
				const isTreeVisible = row.getAttribute("data-tree-hidden") !== "true";

				if (isSearchVisible && isStatusChecked && isTreeVisible) {
					visibleCount++;
				}
			}

			const emptyState = document.getElementById("tasks-search-empty");
			if (emptyState) {
				if (visibleCount === 0) {
					emptyState.removeAttribute("hidden");
				} else {
					emptyState.setAttribute("hidden", "true");
				}
			}
		};

		// Initial run
		updateTaskVisibility();

		const table = document.querySelector("table");
		if (!table) return;

		const observer = new MutationObserver((mutations) => {
			let triggerUpdate = false;
			for (const mutation of mutations) {
				if (
					mutation.type === "attributes" &&
					(mutation.attributeName === "hidden" ||
						mutation.attributeName === "data-tree-hidden") &&
					(mutation.target as HTMLElement).tagName === "TR"
				) {
					triggerUpdate = true;
					break;
				}
			}
			if (triggerUpdate) {
				updateTaskVisibility();
			}
		});

		observer.observe(table, {
			attributes: true,
			subtree: true,
			attributeFilter: ["hidden", "data-tree-hidden"],
		});

		return () => {
			observer.disconnect();
		};
	}, [checkedStatuses]);

	return (
		<Dropdown
			interactive={true}
			trigger={
				<Button
					variant="outline"
					size="sm"
					class={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "2",
					})}
				>
					<FilterIcon width="16" height="16" />
					<span>Status</span>
				</Button>
			}
			placement="bottomEnd"
			items={TASK_STATUSES.map((status) => ({
				type: "checkbox",
				label: status,
				value: status,
				checked: checkedStatuses.includes(status),
			}))}
			onSelect={handleSelect}
		/>
	);
}
