import { css, cx } from "design-system/css";
import type { ElementType } from "hono/jsx";
import { useRef, useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import { Badge } from "../components/ui/badge";
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
import { colorForTag, splitTitleTag } from "../lib/tasks";
import { markdownToHtml } from "../utils/markdown";
import { markdownContentClass } from "../utils/markdown-content-style";
import { saveTaskField } from "../utils/task-save";
import { useGitToken } from "./git-token-banner";

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
	/** Task slug + which field this editor commits to via `saveTaskField` on
	 * submit (same direct-commit path as task-project-editor.tsx) — a plain
	 * string/enum pair rather than a save callback, since island props are
	 * serialized across the hydration boundary and can't carry a closure from
	 * the server-rendered parent. */
	slug: string;
	field: "title" | "body";
	/** Renders the preview (non-editing) state as formatted markdown instead
	 * of plain text — the raw source is still what the textarea edits. */
	markdown?: boolean;
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
// Submitting commits straight to the git host via saveTaskField, same
// direct-commit path as every other task field editor (see
// task-project-editor.tsx) — a failed commit (no token connected, a stale
// sha, a rejected token) falls back to a link into the CMS instead of
// silently losing the edit.
export default function TaskEditableText(props: TaskEditableTextProps) {
	// Same "no token → no edit affordance" gate as every other direct-commit
	// editor (TaskActionsMenu, PmsCreateMenu, ...) — plus `activationMode:
	// "none"` since Preview's own onClick/onFocus enters edit mode regardless
	// of the `readOnly` prop (that prop only affects styling/aria, per
	// editable-primitive.tsx).
	const { token } = useGitToken();
	const readOnly = !token;
	const [value, setValue] = useState(props.value);
	const [editing, setEditing] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);
	const previousValue = useRef(props.value);
	// The baseline "already saved" value — starts at props.value, and moves
	// forward on every successful onSave so a second edit's dirty-check (and
	// the no-op guard below) compares against what's actually persisted, not
	// the page's stale initial server-rendered value.
	const savedValue = useRef(props.value);
	const rootRef = useRef<HTMLDivElement>(null);
	const Wrapper = props.as ?? "div";
	// Recomputed on every render (not memoized), but gated on `!editing` so it
	// doesn't reparse on every keystroke — the preview is hidden while editing
	// anyway.
	const previewHtml =
		props.markdown && !editing && value.trim() !== ""
			? markdownToHtml(value)
			: undefined;

	const { tag, rest: titleRest } = splitTitleTag(value);

	const handleSubmit = () => {
		setEditing(false);
		if (value === savedValue.current) return;
		setSaving(true);
		saveTaskField(props.slug, (data) =>
			props.field === "title"
				? { data: { ...data, title: value } }
				: { content: value },
		)
			.then(() => {
				savedValue.current = value;
				setDirty(false);
				toaster.success("Saved.", {
					description: "Committed to main — live once the site rebuilds.",
				});
			})
			.catch((error: unknown) => {
				setDirty(true);
				toaster.error(
					error instanceof Error ? error.message : "Failed to save.",
				);
			})
			.finally(() => setSaving(false));
	};

	return (
		<Wrapper class={cx(css({ margin: "0" }), props.class)}>
			<EditableRoot
				rootRef={rootRef}
				value={value}
				edit={editing}
				readOnly={readOnly}
				activationMode={readOnly ? "none" : "focus"}
				multiline={props.multiline}
				rows={props.rows}
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
				onSubmit={handleSubmit}
				onSetValue={setValue}
			>
				<Area>
					<Preview
						class={cx(props.textClass, props.markdown && markdownContentClass)}
						dangerouslySetInnerHTML={
							previewHtml !== undefined ? { __html: previewHtml } : undefined
						}
					>
						{props.field === "title" && tag ? (
							<>
								<Badge
									variant="subtle"
									size="sm"
									colorPalette={colorForTag(tag)}
									class={css({ mr: "1.5" })}
								>
									{tag}
								</Badge>
								<span>{titleRest}</span>
							</>
						) : undefined}
					</Preview>
					<Input class={props.textClass} />
				</Area>
				{!readOnly && (
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
				)}
			</EditableRoot>

			{saving && (
				<Text size="sm" class={css({ color: "fg.muted", mt: "1" })}>
					Saving…
				</Text>
			)}

			{!saving && dirty && (
				<Text size="sm" class={css({ color: "fg.muted", mt: "1" })}>
					Failed to save.{" "}
					<Anchor href={props.editHref} target="_blank" variant="plain">
						Edit in the CMS
					</Anchor>{" "}
					instead.
				</Text>
			)}
		</Wrapper>
	);
}
