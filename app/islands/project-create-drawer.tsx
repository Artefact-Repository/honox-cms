import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { InteractiveCombobox } from "../components/ui/combobox-primitive";
import { Drawer } from "../components/ui/drawer";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { Textarea } from "../components/ui/textarea";
import { toaster } from "../components/ui/toast";
import { PROJECT_COLOR_PALETTES, PROJECT_STATUSES } from "../lib/projects";
import { createProject, ProjectSaveError } from "../utils/project-save";

const statusItems = PROJECT_STATUSES.map((status) => ({
	label: status,
	value: status,
}));
const colorItems = PROJECT_COLOR_PALETTES.map((color) => ({
	label: color,
	value: color,
}));

export interface ProjectCreateDrawerInitialValues {
	title?: string;
	summary?: string;
	description?: string;
	status?: string;
	colorPalette?: string;
	owner?: string;
	startDate?: string;
	dueDate?: string;
	tags?: string[];
}

export interface ProjectCreateDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Prefills the form — e.g. "Convert to Project" seeding it from the
	 * source task's own fields (see task-to-project.tsx). */
	initialValues?: ProjectCreateDrawerInitialValues;
}

const buildForm = (initial?: ProjectCreateDrawerInitialValues) => ({
	title: initial?.title ?? "",
	summary: initial?.summary ?? "",
	description: initial?.description ?? "",
	status: initial?.status ?? PROJECT_STATUSES[0],
	colorPalette: initial?.colorPalette ?? "blue",
	owner: initial?.owner ?? "",
	startDate: initial?.startDate ?? "",
	dueDate: initial?.dueDate ?? "",
	tags: initial?.tags?.join(", ") ?? "",
});

// Same direct-commit constraint as TaskCreateDrawer — writes straight to the
// git host via createProject/project-save.ts when a token is available.
export default function ProjectCreateDrawer(props: ProjectCreateDrawerProps) {
	const [form, setForm] = useState(buildForm(props.initialValues));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Re-seeds the form from `initialValues` each time the drawer opens —
	// depending only on `open` (not `initialValues`, which callers like
	// PmsCreateMenu re-create every render) so an in-progress edit doesn't get
	// clobbered by a parent re-render while the drawer is still open.
	useEffect(() => {
		if (props.open) {
			setForm(buildForm(props.initialValues));
			setError(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.open]);

	const resetAndClose = () => {
		setForm(buildForm(props.initialValues));
		setError(null);
		props.onOpenChange(false);
	};

	const handleCreate = async () => {
		if (!form.title.trim() || !form.summary.trim()) return;
		setSaving(true);
		setError(null);
		try {
			const slug = await createProject({
				title: form.title.trim(),
				summary: form.summary.trim(),
				description: form.description.trim() || undefined,
				status: form.status,
				colorPalette: form.colorPalette,
				owner: form.owner.trim() || undefined,
				startDate: form.startDate || undefined,
				dueDate: form.dueDate || undefined,
				tags: form.tags
					.split(",")
					.map((tag) => tag.trim())
					.filter(Boolean),
			});
			toaster.success(`Created "${form.title.trim()}".`, {
				description: "Committed to main — live once the site rebuilds.",
			});
			resetAndClose();
			void slug;
		} catch (err) {
			setError(
				err instanceof ProjectSaveError || err instanceof Error
					? err.message
					: "Failed to create the project.",
			);
		} finally {
			setSaving(false);
		}
	};

	const canCreate = form.title.trim().length > 0 && form.summary.trim().length > 0;

	return (
		<Drawer
			open={props.open}
			onOpenChange={(next: boolean) => {
				if (!next) {
					resetAndClose();
					return;
				}
				props.onOpenChange(true);
			}}
			title="New Project"
			description="Creates a project file and commits it to main — same as the CMS."
			footer={
				<Stack gap="3" justify="end" class={css({ width: "full" })}>
					<button
						type="button"
						onClick={resetAndClose}
						class={cx(button({ variant: "outline", size: "sm" }))}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => void handleCreate()}
						disabled={!canCreate || saving}
						class={cx(button({ variant: "solid", size: "sm" }))}
					>
						{saving ? "Creating..." : "Create project"}
					</button>
				</Stack>
			}
			// See TaskCreateDrawer for why this is `body` (not `children`).
			body={
				<Stack
					direction="column"
					gap="4"
					class={css({ alignItems: "stretch", width: "full" })}
				>
					<Field
						label="Title"
						value={form.title}
						onValueChange={(value: string) =>
							setForm((f) => ({ ...f, title: value }))
						}
						required
					/>

					<Field
						label="Summary"
						helperText="One-line summary shown on the project card"
						value={form.summary}
						onValueChange={(value: string) =>
							setForm((f) => ({ ...f, summary: value }))
						}
						required
					/>

					<Stack gap="4" wrap="wrap" class={css({ alignItems: "stretch" })}>
						<div class={css({ flex: "1", minWidth: "36" })}>
							<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
								Status
							</Text>
							<InteractiveCombobox
								items={statusItems}
								value={form.status}
								onValueChange={(value: string) =>
									setForm((f) => ({ ...f, status: value }))
								}
								size="sm"
							/>
						</div>
						<div class={css({ flex: "1", minWidth: "36" })}>
							<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
								Color
							</Text>
							<InteractiveCombobox
								items={colorItems}
								value={form.colorPalette}
								onValueChange={(value: string) =>
									setForm((f) => ({ ...f, colorPalette: value }))
								}
								size="sm"
							/>
						</div>
					</Stack>

					<Stack gap="4" wrap="wrap" class={css({ alignItems: "stretch" })}>
						<div class={css({ flex: "1", minWidth: "36" })}>
							<Field
								label="Owner"
								value={form.owner}
								onValueChange={(value: string) =>
									setForm((f) => ({ ...f, owner: value }))
								}
							/>
						</div>
						<div class={css({ flex: "1", minWidth: "36" })}>
							<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
								Start date
							</Text>
							<input
								type="date"
								value={form.startDate}
								onInput={(e: Event) =>
									setForm((f) => ({
										...f,
										startDate: (e.target as HTMLInputElement).value,
									}))
								}
								class={css({
									width: "full",
									borderWidth: "1px",
									borderColor: "border",
									borderRadius: "sm",
									px: "2.5",
									py: "1.5",
									fontSize: "sm",
									bg: "bg",
									color: "fg",
								})}
							/>
						</div>
						<div class={css({ flex: "1", minWidth: "36" })}>
							<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
								Due date
							</Text>
							<input
								type="date"
								value={form.dueDate}
								onInput={(e: Event) =>
									setForm((f) => ({
										...f,
										dueDate: (e.target as HTMLInputElement).value,
									}))
								}
								class={css({
									width: "full",
									borderWidth: "1px",
									borderColor: "border",
									borderRadius: "sm",
									px: "2.5",
									py: "1.5",
									fontSize: "sm",
									bg: "bg",
									color: "fg",
								})}
							/>
						</div>
					</Stack>

					<Field
						label="Tags"
						helperText="Comma-separated"
						value={form.tags}
						onValueChange={(value: string) =>
							setForm((f) => ({ ...f, tags: value }))
						}
					/>

					<Textarea
						label="Description"
						rows={4}
						value={form.description}
						onValueChange={(value: string) =>
							setForm((f) => ({ ...f, description: value }))
						}
					/>

					{error && (
						<Text size="sm" class={css({ color: "fg.error" })}>
							{error}
						</Text>
					)}
				</Stack>
			}
		/>
	);
}
