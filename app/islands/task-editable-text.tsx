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
import { CheckIcon } from "../icons/check";
import { CloseIcon } from "../icons/close";
import { EditIcon } from "../icons/edit";

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
// There's also no live backend here — content only ever changes through the
// CMS's git commits (see the "Convert to Project" dialog for the same
// constraint). Editing inline is a real, working local preview, but it
// can't persist on its own, so a commit surfaces a link back to the CMS
// instead of pretending to have saved anything.
export default function TaskEditableText(props: TaskEditableTextProps) {
	const [value, setValue] = useState(props.value);
	const [editing, setEditing] = useState(false);
	const [dirty, setDirty] = useState(false);
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
					if (value !== props.value) setDirty(true);
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

			{dirty && (
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
