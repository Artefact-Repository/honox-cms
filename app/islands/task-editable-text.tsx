import { css, cx } from "design-system/css";
import type { ElementType } from "hono/jsx";
import { useRef, useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import {
	Area,
	CancelTrigger,
	Control,
	Root as EditableRoot,
	EditTrigger,
	Input,
	Preview,
	SubmitTrigger,
} from "../components/ui/editable-primitive";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { CheckIcon } from "../icons/check";
import { CloseIcon } from "../icons/close";
import { EditIcon } from "../icons/edit";
import { saveTaskField } from "../utils/task-save";

export interface TaskEditableTextProps {
	value: string;
	editHref: string;
	textClass?: string;
	placeholder?: string;
	/** Wrapping element — pass "h1" to keep the title semantically a heading. */
	as?: ElementType;
	class?: string;
	/** Renders a resizable textarea instead of a single-line input. */
	multiline?: boolean;
	rows?: number;
	/** Renders a searchable combobox instead of a plain text input. */
	combobox?: boolean;
	items?: { label: string; value: string; disabled?: boolean }[];
	/** Renders the (comma-separated) value as removable tag chips. */
	tags?: boolean;
	/** Task slug + which field this edits — enables saving straight to
	 * GitHub (see saveTaskField). "body" means the markdown description
	 * (not a frontmatter field); anything else is a frontmatter key. */
	slug: string;
	field: "title" | "assignee" | "tags" | "body";
}

const controlsClass = css({
	display: "inline-flex",
	gap: "1",
	marginInlineStart: "2",
	verticalAlign: "middle",
});

// Deliberately built on the editable *primitives* (not the `Editable`
// wrapper from components/ui, which hydrates as its own nested island) —
// this component is already an island itself, and nesting one island's
// smart wrapper inside another produces duplicated SSR/hydration output
// (the outer island's server snapshot already contains the inner island's
// rendered markup, then the inner island hydrates a second copy on top).
//
// On submit, saves straight to GitHub via saveTaskField (same direct-commit
// mechanism the project board's drag-and-drop uses — no server, just the
// browser calling GitHub's Contents API with a token from Sveltia's own
// session or our manually-connected fallback; see app/utils/github-content.ts).
// If no token is available or the request fails, this falls back to the
// original "edited locally, not saved" messaging with a link to the CMS —
// editing still works as a preview even without a connection.
export default function TaskEditableText(props: TaskEditableTextProps) {
	const [value, setValue] = useState(props.value);
	const [editing, setEditing] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);
	const previousValue = useRef(props.value);
	const rootRef = useRef<HTMLDivElement>(null);
	const Wrapper = props.as ?? "div";

	return (
		<Wrapper class={cx(css({ margin: "0" }), props.class)}>
			<EditableRoot
				rootRef={rootRef}
				value={value}
				edit={editing}
				multiline={props.multiline}
				rows={props.rows}
				combobox={props.combobox}
				items={props.items}
				tags={props.tags}
				placeholder={{
					edit: props.placeholder ?? "",
					preview: props.placeholder ?? "",
				}}
				onEdit={() => {
					previousValue.current = value;
					setEditing(true);
				}}
				onCancel={() => {
					setValue(previousValue.current);
					setEditing(false);
				}}
				onSubmit={() => {
					setEditing(false);
					if (value === props.value) return;
					setSaving(true);
					saveTaskField(props.slug, (data, content) => {
						if (props.field === "body") return { content: value };
						if (props.field === "tags") {
							return {
								data: {
									...data,
									tags: value
										.split(",")
										.map((tag) => tag.trim())
										.filter(Boolean),
								},
							};
						}
						return { data: { ...data, [props.field]: value } };
					})
						.then(() => {
							toaster.success("Saved to GitHub.", {
								description: "Committed to main — live once the site rebuilds.",
							});
						})
						.catch((error: unknown) => {
							setDirty(true);
							toaster.error(
								error instanceof Error
									? error.message
									: "Failed to save to GitHub.",
							);
						})
						.finally(() => setSaving(false));
				}}
				onSetValue={setValue}
			>
				<Area>
					<Preview class={props.textClass} />
					<Input class={props.textClass} />
				</Area>
				<Control class={controlsClass}>
					<EditTrigger>
						<EditIcon width="14" height="14" />
					</EditTrigger>
					<SubmitTrigger>
						<CheckIcon width="14" height="14" />
					</SubmitTrigger>
					<CancelTrigger>
						<CloseIcon width="14" height="14" />
					</CancelTrigger>
				</Control>
			</EditableRoot>

			{saving && (
				<Text size="sm" class={css({ color: "fg.muted", mt: "1" })}>
					Saving…
				</Text>
			)}

			{!saving && dirty && (
				<Text size="sm" class={css({ color: "fg.muted", mt: "1" })}>
					Edited locally — not saved.{" "}
					<Anchor href={props.editHref} target="_blank" variant="plain">
						Edit in the CMS
					</Anchor>{" "}
					to make it permanent.
				</Text>
			)}
		</Wrapper>
	);
}
