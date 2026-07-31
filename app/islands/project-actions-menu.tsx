import { css } from "design-system/css";
import { useState } from "hono/jsx";
import { IconButton } from "../components/ui/button";
import { Dropdown } from "../components/ui/dropdown";
import { EllipsisIcon } from "../icons/ellipsis";
import { useGitToken } from "./git-token-banner";
import ProjectDeleteDialog from "./project-delete-dialog";

export interface ProjectActionsMenuProps {
	slug: string;
	title: string;
}

export default function ProjectActionsMenu({
	slug,
	title,
}: ProjectActionsMenuProps) {
	const { token } = useGitToken();
	const [deleteOpen, setDeleteOpen] = useState(false);

	if (!token) return null;

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
					{
						type: "item",
						label: "Edit in CMS",
						value: "edit",
						href: `/admin/#/collections/projects/entries/${slug}`,
					},
					{ type: "separator" },
					{
						type: "item",
						label: "Delete",
						value: "delete",
						class: css({ color: "fg.error" }),
					},
				]}
				onSelect={(value) => {
					if (value === "delete") setDeleteOpen(true);
				}}
			/>
			<ProjectDeleteDialog
				project={{ slug, title }}
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onDeleted={() => {
					window.location.href = "/projects";
				}}
			/>
		</>
	);
}
