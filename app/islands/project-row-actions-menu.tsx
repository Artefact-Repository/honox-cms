import { useEffect, useRef, useState } from "hono/jsx";
import { Dropdown } from "../components/ui/dropdown";
import ProjectCloneDialog from "./project-clone-dialog";
import ProjectDeleteDialog from "./project-delete-dialog";

export default function ProjectRowActionsMenu() {
	const [selectedProject, setSelectedProject] = useState<{
		slug: string;
		title: string;
	} | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [cloneOpen, setCloneOpen] = useState(false);
	const contextTriggerRef = useRef<HTMLDivElement | null>(null);
	const pendingPointRef = useRef<{
		x: number;
		y: number;
		yBottom: number;
	} | null>(null);

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			const trigger = (event.target as HTMLElement)?.closest?.(
				"[data-project-row-actions-trigger]",
			) as HTMLElement | null;
			if (!trigger) return;

			// Stop the click from bubbling up to the card's outer anchor
			event.preventDefault();
			event.stopPropagation();

			const slug = trigger.getAttribute("data-project-slug");
			const title = trigger.getAttribute("data-project-title");
			if (!slug || !title) return;

			const rect = trigger.getBoundingClientRect();
			pendingPointRef.current = {
				x: rect.left,
				y: rect.top,
				yBottom: rect.bottom,
			};
			setSelectedProject({ slug, title });
		};
		// Listen in capture phase so we can stop the click before it hits the parent <a>
		document.addEventListener("click", onClick, { capture: true });
		return () =>
			document.removeEventListener("click", onClick, { capture: true });
	}, []);

	useEffect(() => {
		const point = pendingPointRef.current;
		const target = contextTriggerRef.current;
		if (!selectedProject || !point || !target) return;
		pendingPointRef.current = null;
		target.setAttribute("data-anchor-bottom", String(point.yBottom));
		target.dispatchEvent(
			new MouseEvent("contextmenu", {
				bubbles: true,
				cancelable: true,
				clientX: point.x,
				clientY: point.y,
			}),
		);
	}, [selectedProject]);

	const handleSelect = (value: string) => {
		if (value === "delete") setDeleteOpen(true);
		if (value === "clone") setCloneOpen(true);
	};

	return (
		<>
			<Dropdown
				triggerMode="contextDropdown"
				trigger={
					// Never clicked directly — a fixed point the click delegation
					// above fires a synthetic `contextmenu` at, so this can just sit
					// inert at the origin.
					<div
						ref={(el) => {
							contextTriggerRef.current = el as HTMLDivElement | null;
						}}
						data-open-upward
						style={{ position: "fixed", top: "0px", left: "0px" }}
					/>
				}
				items={
					selectedProject
						? [
								{
									type: "item",
									label: "Edit in CMS",
									value: "edit",
									href: `/admin/#/collections/projects/entries/${selectedProject.slug}`,
								},
								{
									type: "item",
									label: "Clone",
									value: "clone",
								},
								{ type: "separator" },
								{
									type: "item",
									label: "Delete",
									value: "delete",
									class: "colorPalette-red", // Wait, class can just be plain string or we can use styling
									style: { color: "var(--colors-fg-error, #f31260)" },
								},
							]
						: []
				}
				onSelect={handleSelect}
			/>
			{selectedProject && (
				<>
					<ProjectCloneDialog
						project={selectedProject}
						open={cloneOpen}
						onOpenChange={setCloneOpen}
					/>
					<ProjectDeleteDialog
						project={selectedProject}
						open={deleteOpen}
						onOpenChange={setDeleteOpen}
						onDeleted={(slug) => {
							document.getElementById(`project-${slug}`)?.remove();
						}}
					/>
				</>
			)}
		</>
	);
}
