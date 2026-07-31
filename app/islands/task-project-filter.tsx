import { css } from "design-system/css";
import { useEffect, useState } from "hono/jsx";
import { Combobox } from "../components/ui/combobox";

export default function TaskProjectFilter({ projects }: { projects: { label: string; value: string }[] }) {
	const [selected, setSelected] = useState<string[]>(projects.map((project) => project.value));

	useEffect(() => {
		const rows = document.querySelectorAll<HTMLElement>("tr[data-task-project]");
		for (const row of rows) {
			const project = row.getAttribute("data-task-project") ?? "";
			if (project === "") {
				row.removeAttribute("data-project-hidden");
			} else {
				const isSelected = selected.includes(project);
				if (isSelected) {
					row.removeAttribute("data-project-hidden");
				} else {
					row.setAttribute("data-project-hidden", "true");
				}
			}
		}
	}, [selected]);

	const labelByValue = Object.fromEntries(projects.map((project) => [project.value, project.label]));

	return (
		<div class={css({ display: "flex", flexDirection: "column", gap: "2", width: "100%", maxWidth: "sm" })}>
			<Combobox
				interactive={true}
				multiple={true}
				placeholder="Search project..."
				items={projects}
				value={selected}
				onValueChange={(nextList: any) => {
					setSelected(nextList);
				}}
			/>

			{selected.length > 0 && (
				<div class={css({ display: "flex", flexWrap: "wrap", gap: "1.5", marginTop: "1" })}>
					{selected.map((value) => (
						<span
							key={value}
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
							{labelByValue[value] ?? value}
							<button
								type="button"
								onClick={() => {
									setSelected((prev) => prev.filter((item) => item !== value));
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
								aria-label={`Remove ${labelByValue[value] ?? value}`}
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
