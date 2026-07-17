import type { JSX } from "hono/jsx";
import { useEffect, useRef, useState } from "hono/jsx";
import {
	Content,
	Root,
	type RootProps,
} from "../components/ui/editable-primitive";

export interface EditableIslandProps extends RootProps {
	label?: JSX.Element | string;
}

export default function EditableIsland(props: EditableIslandProps) {
	const {
		value: valueProp,
		defaultValue,
		edit: editProp,
		defaultEdit,
		selectOnFocus = true,
		disabled,
		readOnly,
		placeholder,
		onValueChange,
		onValueCommit,
		onValueRevert,
		onEditChange,
		label,
		children,
		...rest
	} = props;

	const [value, setValueState] = useState(valueProp ?? defaultValue ?? "");
	const [editing, setEditing] = useState(editProp ?? defaultEdit ?? false);
	const rootRef = useRef<HTMLDivElement>(null);
	const previousValue = useRef(value);

	useEffect(() => {
		if (valueProp !== undefined) setValueState(valueProp);
	}, [valueProp]);

	useEffect(() => {
		if (editProp !== undefined) setEditing(editProp);
	}, [editProp]);

	const focusInput = () => {
		const input = rootRef.current?.querySelector<HTMLInputElement>(
			'[data-part="input"]',
		);
		if (!input) return;
		input.focus();
		if (selectOnFocus) input.select();
	};

	// Focuses the edit-trigger button, not the preview: with the default
	// activationMode "focus", the preview's own onFocus re-enters edit mode,
	// so restoring focus there after cancel/submit would immediately loop
	// back into editing. Ark UI's zag machine sidesteps this the same way,
	// restoring focus to the edit trigger rather than the preview.
	const restoreFocus = () => {
		rootRef.current
			?.querySelector<HTMLElement>('[data-part="edit-trigger"]')
			?.focus({ preventScroll: true });
	};

	const handleEdit = () => {
		if (disabled || readOnly || editing) return;
		previousValue.current = value;
		if (editProp === undefined) setEditing(true);
		onEditChange?.({ edit: true });
		requestAnimationFrame(focusInput);
	};

	const handleCancel = () => {
		if (disabled) return;
		const reverted = previousValue.current;
		if (valueProp === undefined) setValueState(reverted);
		if (editProp === undefined) setEditing(false);
		onValueRevert?.({ value: reverted });
		onEditChange?.({ edit: false });
		requestAnimationFrame(restoreFocus);
	};

	const handleSubmit = () => {
		if (disabled) return;
		previousValue.current = value;
		if (editProp === undefined) setEditing(false);
		onValueCommit?.({ value });
		onEditChange?.({ edit: false });
		requestAnimationFrame(restoreFocus);
	};

	const handleSetValue = (next: string) => {
		if (valueProp === undefined) setValueState(next);
		onValueChange?.({ value: next });
	};

	return (
		<Root
			{...rest}
			rootRef={rootRef}
			value={value}
			edit={editing}
			disabled={disabled}
			readOnly={readOnly}
			placeholder={placeholder}
			onEdit={handleEdit}
			onCancel={handleCancel}
			onSubmit={handleSubmit}
			onSetValue={handleSetValue}
			data-hydrated="true"
		>
			<Content label={label}>{children}</Content>
		</Root>
	);
}
