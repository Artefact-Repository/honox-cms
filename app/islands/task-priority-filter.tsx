import { cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Dropdown } from "../components/ui/dropdown";
import { TASK_PRIORITIES } from "../lib/tasks";

export default function TaskPriorityFilter() {
	const [checkedPriorities, setCheckedPriorities] = useState<Record<string, boolean>>(
		Object.fromEntries(TASK_PRIORITIES.map((priority) => [priority, true])),
	);

	const checkedList = Object.entries(checkedPriorities)
		.filter(([_, checked]) => checked)
		.map(([priority]) => priority);

	let buttonText = "Priority: All";
	if (checkedList.length === 0) {
		buttonText = "Priority: None";
	} else if (checkedList.length === TASK_PRIORITIES.length) {
		buttonText = "Priority: All";
	} else if (checkedList.length === 1) {
		buttonText = `Priority: ${checkedList[0]}`;
	} else {
		buttonText = `Priority: ${checkedList.length} selected`;
	}

	useEffect(() => {
		const rows = document.querySelectorAll<HTMLElement>("tr[data-task-priority]");
		for (const row of rows) {
			const priority = row.getAttribute("data-task-priority") ?? "";
			const isChecked = checkedPriorities[priority] ?? false;
			if (isChecked) {
				row.removeAttribute("data-priority-hidden");
			} else {
				row.setAttribute("data-priority-hidden", "true");
			}
		}
	}, [checkedPriorities]);

	return (
		<Dropdown
			trigger={
				<button
					type="button"
					class={cx(button({ variant: "outline", size: "sm" }))}
					style={{
						cursor: "pointer",
					}}
				>
					{buttonText}
				</button>
			}
			placement="bottomStart"
			items={TASK_PRIORITIES.map((priority) => ({
				type: "checkbox" as const,
				label: priority,
				value: priority,
				checked: checkedPriorities[priority],
			}))}
			onSelect={(value) => {
				setCheckedPriorities((prev) => {
					const next = { ...prev, [value]: !prev[value] };
					return next;
				});
			}}
		/>
	);
}
