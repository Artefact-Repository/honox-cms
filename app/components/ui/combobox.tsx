import ComboboxIsland from "../../islands/combobox";
import {
	type ComboboxFlattenedProps,
	Root as ComboboxPrimitiveRoot,
	ComboboxStructure,
} from "./combobox-primitive";

export interface ComboboxProps extends ComboboxFlattenedProps {
	interactive?: boolean;
}

export function Combobox(props: ComboboxProps) {
	const { interactive, ...rest } = props;

	const isInteractive =
		interactive !== false &&
		(interactive ||
			rest.open !== undefined ||
			rest.inputValue !== undefined ||
			rest.onToggle !== undefined ||
			rest.onInputChange !== undefined);

	if (isInteractive) {
		return <ComboboxIsland {...rest} />;
	}

	return (
		<ComboboxPrimitiveRoot {...rest}>
			<ComboboxStructure {...rest} />
		</ComboboxPrimitiveRoot>
	);
}
