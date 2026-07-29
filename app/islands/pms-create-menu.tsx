import { cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { Dropdown } from "../components/ui/dropdown";
import ProjectCreateDrawer from "./project-create-drawer";
import TaskCreateDrawer, {
	type TaskCreateDrawerProps,
} from "./task-create-drawer";

export interface PmsCreateMenuProps
	extends Omit<TaskCreateDrawerProps, "open" | "onOpenChange"> {}

// The header "+ New" button across /tasks and /projects — a dropdown instead
// of a single action since there are now two things it can create. Both
// drawers stay mounted and controlled here so the menu just toggles which one
// is open (same pattern as TaskActionsMenu's clone/delete/convert dialogs).
export default function PmsCreateMenu(props: PmsCreateMenuProps) {
	const [taskOpen, setTaskOpen] = useState(false);
	const [projectOpen, setProjectOpen] = useState(false);

	return (
		<>
			<Dropdown
				trigger={
					<button
						type="button"
						class={cx(button({ variant: "solid", size: "sm" }))}
					>
						+ New
					</button>
				}
				placement="bottomRight"
				items={[
					{ type: "item", label: "New Task", value: "task" },
					{ type: "item", label: "New Project", value: "project" },
				]}
				onSelect={(value) => {
					if (value === "task") setTaskOpen(true);
					if (value === "project") setProjectOpen(true);
				}}
			/>
			<TaskCreateDrawer
				{...props}
				open={taskOpen}
				onOpenChange={setTaskOpen}
			/>
			<ProjectCreateDrawer open={projectOpen} onOpenChange={setProjectOpen} />
		</>
	);
}
