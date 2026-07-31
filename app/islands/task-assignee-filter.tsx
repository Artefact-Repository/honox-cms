import { css } from "design-system/css";
import { useEffect, useState } from "hono/jsx";
import { Combobox } from "../components/ui/combobox";

export default function TaskAssigneeFilter({ assignees }: { assignees: string[] }) {
	const [selected, setSelected] = useState<string[]>(assignees);

	useEffect(() => {
		const rows = document.querySelectorAll<HTMLElement>("tr[data-task-assignee]");
		for (const row of rows) {
			const assignee = row.getAttribute("data-task-assignee") ?? "";
			if (assignee === "") {
				row.removeAttribute("data-assignee-hidden");
			} else {
				const isSelected = selected.includes(assignee);
				if (isSelected) {
					row.removeAttribute("data-assignee-hidden");
				} else {
					row.setAttribute("data-assignee-hidden", "true");
				}
			}
		}
	}, [selected]);

	const items = assignees.map((name) => ({ label: name, value: name }));

	return (
		<div class={css({ display: "flex", flexDirection: "column", gap: "2", width: "100%", maxWidth: "sm" })}>
			<Combobox
				interactive={true}
				multiple={true}
				placeholder="Search assignee..."
				items={items}
				value={selected}
				onValueChange={(nextList: any) => {
					setSelected(nextList);
				}}
			/>

			{selected.length > 0 && (
				<div class={css({ display: "flex", flexWrap: "wrap", gap: "1.5", marginTop: "1" })}>
					{selected.map((name) => (
						<span
							key={name}
							class={css({
								display: "inline-flex",
								alignItems: "center",
								gap: "1",
								bg: { _light: "white.a4", _dark: "black.a4" },
								border: "1px solid",
								borderColor: "border.subtle",
								borderRadius: "full",
								px: "2.5",
								py: "0.5",
								fontSize: "xs",
								fontWeight: "medium",
								color: "fg.default",
							})}
						>
							{name}
							<button
								type="button"
								onClick={() => {
									setSelected((prev) => prev.filter((item) => item !== name));
								}}
								class={css({
									all: "unset",
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									width: "3.5",
									height: "3.5",
									borderRadius: "full",
									cursor: "pointer",
									color: "fg.muted",
									_hover: {
										bg: { _light: "black.a2", _dark: "white.a2" },
										color: "fg.default",
									},
								})}
								aria-label={`Remove ${name}`}
							>
								×
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	);
}
