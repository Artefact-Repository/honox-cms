import { cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Dropdown } from "../components/ui/dropdown";
import { PROJECT_STATUSES, type ProjectStatus } from "../lib/projects";

export default function ProjectStatusFilter() {
	const [checkedStatuses, setCheckedStatuses] = useState<
		Record<ProjectStatus, boolean>
	>(() => {
		const initial: Record<ProjectStatus, boolean> = {
			Planning: true,
			Active: true,
			"On Hold": true,
			Completed: true,
			Archived: true,
		};
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const statusParam = params.get("status");
			if (statusParam) {
				const activeList = statusParam.split(",").map((s) => s.trim());
				if (
					activeList.some((s) => PROJECT_STATUSES.includes(s as ProjectStatus))
				) {
					for (const s of PROJECT_STATUSES) {
						initial[s] = activeList.includes(s);
					}
				}
			}
		}
		return initial;
	});

	const checkedList = Object.entries(checkedStatuses)
		.filter(([_, checked]) => checked)
		.map(([status]) => status as ProjectStatus);

	let buttonText = "Status: All";
	if (checkedList.length === 0) {
		buttonText = "Status: None";
	} else if (checkedList.length === PROJECT_STATUSES.length) {
		buttonText = "Status: All";
	} else if (checkedList.length === 1) {
		buttonText = `Status: ${checkedList[0]}`;
	} else {
		buttonText = `Status: ${checkedList.length} selected`;
	}

	useEffect(() => {
		const cards = document.querySelectorAll<HTMLElement>(
			"[data-project-status]",
		);
		for (const card of cards) {
			const status = card.getAttribute("data-project-status") as ProjectStatus;
			const isChecked = checkedStatuses[status] ?? false;
			if (isChecked) {
				card.removeAttribute("data-project-status-hidden");
			} else {
				card.setAttribute("data-project-status-hidden", "true");
			}
		}

		const url = new URL(window.location.href);
		if (checkedList.length === PROJECT_STATUSES.length) {
			url.searchParams.delete("status");
		} else {
			url.searchParams.set("status", checkedList.join(","));
		}
		window.history.replaceState(null, "", url);
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
			items={PROJECT_STATUSES.map((status) => ({
				type: "checkbox" as const,
				label: status,
				value: status,
				checked: checkedStatuses[status],
			}))}
			onSelect={(value) => {
				setCheckedStatuses((prev) => {
					const next = { ...prev, [value]: !prev[value as ProjectStatus] };
					return next;
				});
			}}
		/>
	);
}
