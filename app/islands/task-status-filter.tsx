import { cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Dropdown } from "../components/ui/dropdown";

export default function TaskStatusFilter() {
	const [checkedStatuses, setCheckedStatuses] = useState<
		Record<string, boolean>
	>({
		"To Do": true,
		"In Progress": true,
		"In Review": true,
		Done: true,
	});

	const checkedList = Object.entries(checkedStatuses)
		.filter(([_, checked]) => checked)
		.map(([status]) => status);

	let buttonText = "Status: All";
	if (checkedList.length === 0) {
		buttonText = "Status: None";
	} else if (checkedList.length === 4) {
		buttonText = "Status: All";
	} else if (checkedList.length === 1) {
		buttonText = `Status: ${checkedList[0]}`;
	} else {
		buttonText = `Status: ${checkedList.length} selected`;
	}

	useEffect(() => {
		const rows = document.querySelectorAll<HTMLElement>("tr[data-task-status]");
		for (const row of rows) {
			const status = row.getAttribute("data-task-status") ?? "";
			const isChecked = checkedStatuses[status] ?? false;
			if (isChecked) {
				row.removeAttribute("data-status-hidden");
			} else {
				row.setAttribute("data-status-hidden", "true");
			}
		}
	}, [checkedStatuses]);

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
				{
					type: "checkbox",
					label: "To Do",
					value: "To Do",
					checked: checkedStatuses["To Do"],
				},
				{
					type: "checkbox",
					label: "In Progress",
					value: "In Progress",
					checked: checkedStatuses["In Progress"],
				},
				{
					type: "checkbox",
					label: "In Review",
					value: "In Review",
					checked: checkedStatuses["In Review"],
				},
				{
					type: "checkbox",
					label: "Done",
					value: "Done",
					checked: checkedStatuses["Done"],
				},
			]}
			onSelect={(value) => {
				setCheckedStatuses((prev) => {
					const next = { ...prev, [value]: !prev[value] };
					return next;
				});
			}}
		/>
	);
}
