import { cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Dropdown } from "../components/ui/dropdown";

export default function TaskPriorityFilter() {
	const [checkedPriorities, setCheckedPriorities] = useState<Record<string, boolean>>({
		Low: true,
		Medium: true,
		High: true,
		Urgent: true,
	});

	const checkedList = Object.entries(checkedPriorities)
		.filter(([_, checked]) => checked)
		.map(([priority]) => priority);

	let buttonText = "Priority: All";
	if (checkedList.length === 0) {
		buttonText = "Priority: None";
	} else if (checkedList.length === 4) {
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
			items={[
				{ type: "checkbox", label: "Low", value: "Low", checked: checkedPriorities["Low"] },
				{ type: "checkbox", label: "Medium", value: "Medium", checked: checkedPriorities["Medium"] },
				{ type: "checkbox", label: "High", value: "High", checked: checkedPriorities["High"] },
				{ type: "checkbox", label: "Urgent", value: "Urgent", checked: checkedPriorities["Urgent"] },
			]}
			onSelect={(value) => {
				setCheckedPriorities((prev) => {
					const next = { ...prev, [value]: !prev[value] };
					return next;
				});
			}}
		/>
	);
}
