import { cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Dropdown } from "../components/ui/dropdown";
import { isWebGpuSupported } from "../utils/ai-engine";
import { useGitToken } from "./git-token-banner";
import ProjectCreateDrawer from "./project-create-drawer";
import TaskBulkCreate from "./task-bulk-create";
import TaskCreateDrawer, {
	type TaskCreateDrawerProps,
} from "./task-create-drawer";

export interface PmsCreateMenuProps
	extends Omit<TaskCreateDrawerProps, "open" | "onOpenChange"> {}

// The header "+ New" button across /tasks and /projects — a dropdown instead
// of a single action since there are now three things it can create. All
// drawers stay mounted and controlled here so the menu just toggles which one
// is open (same pattern as TaskActionsMenu's clone/delete/convert dialogs).
//
// Creating either one is a direct-commit write (see task-save.ts), so it's
// gated behind the same `useGitToken()` write-access check every other
// direct-commit editor uses (TaskTreeDnd, TaskBoard) — no token means no
// button, not just a disabled one, since there's nothing for it to open.
export default function PmsCreateMenu(props: PmsCreateMenuProps) {
	const { token } = useGitToken();
	const [taskOpen, setTaskOpen] = useState(false);
	const [projectOpen, setProjectOpen] = useState(false);
	const [bulkOpen, setBulkOpen] = useState(false);
	const [webGpuSupported, setWebGpuSupported] = useState(false);

	useEffect(() => {
		setWebGpuSupported(isWebGpuSupported());
	}, []);

	if (!token) return null;

	const items = [
		{ type: "item", label: "New Task", value: "task" },
		{ type: "item", label: "New Project", value: "project" },
	];

	if (webGpuSupported) {
		items.push({ type: "item", label: "Bulk Create (AI)", value: "bulk" });
	}

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
				items={items}
				onSelect={(value) => {
					if (value === "task") setTaskOpen(true);
					if (value === "project") setProjectOpen(true);
					if (value === "bulk") setBulkOpen(true);
				}}
			/>
			<TaskCreateDrawer {...props} open={taskOpen} onOpenChange={setTaskOpen} />
			<ProjectCreateDrawer open={projectOpen} onOpenChange={setProjectOpen} />
			{webGpuSupported && (
				<TaskBulkCreate
					open={bulkOpen}
					onOpenChange={setBulkOpen}
					projects={props.projects}
				/>
			)}
		</>
	);
}
