import { css } from "design-system/css";
import { useState } from "hono/jsx";
import { IconButton } from "../components/ui/button";
import { Dropdown } from "../components/ui/dropdown";
import { EllipsisIcon } from "../icons/ellipsis";
import TaskToProject, { type TaskToProjectProps } from "./task-to-project";

export interface TaskActionsMenuProps
	extends Omit<TaskToProjectProps, "open" | "onOpenChange"> {
	editHref: string;
}

export default function TaskActionsMenu(props: TaskActionsMenuProps) {
	const { editHref, ...taskProps } = props;
	const [convertOpen, setConvertOpen] = useState(false);

	return (
		<>
			<Dropdown
				trigger={
					<IconButton variant="outline" size="sm" aria-label="More actions">
						<EllipsisIcon width="16" height="16" />
					</IconButton>
				}
				placement="bottomRight"
				contentClass={css({ minWidth: "48", whiteSpace: "nowrap" })}
				items={[
					{ type: "item", label: "Edit", value: "edit", href: editHref },
					{
						type: "item",
						label: "Convert to Project",
						value: "convert-to-project",
					},
				]}
				onSelect={(value) => {
					if (value === "convert-to-project") setConvertOpen(true);
				}}
			/>
			<TaskToProject
				{...taskProps}
				open={convertOpen}
				onOpenChange={setConvertOpen}
			/>
		</>
	);
}
