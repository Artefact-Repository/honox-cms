import ComboboxIsland from "../../islands/combobox";
import {
	Root,
	RootProvider,
	Label,
	Control,
	Input,
	Trigger,
	ClearTrigger,
	Positioner,
	Content,
	List,
	Item,
	ItemText,
	ItemIndicator,
	ItemGroup,
	ItemGroupLabel,
	Empty,
	IndicatorGroup,
	Context,
	type ComboboxFlattenedProps,
	Root as ComboboxPrimitiveRoot,
	ComboboxStructure,
} from "./combobox-primitive";
import { shouldHydrate } from "./island-utils";

export interface ComboboxProps extends ComboboxFlattenedProps {
	interactive?: boolean;
}

export function ComboboxRoot(props: ComboboxProps) {
	const { interactive, ...rest } = props;

	const hasSignal =
		rest.open !== undefined ||
		rest.inputValue !== undefined ||
		rest.onToggle !== undefined ||
		rest.onInputChange !== undefined ||
		rest.onItemSelect !== undefined;
	const isInteractive = shouldHydrate(interactive, hasSignal);

	if (isInteractive) {
		return <ComboboxIsland {...rest} />;
	}

	return (
		<ComboboxPrimitiveRoot {...rest}>
			<ComboboxStructure {...rest} />
		</ComboboxPrimitiveRoot>
	);
}

export const Combobox = Object.assign(ComboboxRoot, {
	Root,
	RootProvider,
	Label,
	Control,
	Input,
	Trigger,
	ClearTrigger,
	Positioner,
	Content,
	List,
	Item,
	ItemText,
	ItemIndicator,
	ItemGroup,
	ItemGroupLabel,
	Empty,
	IndicatorGroup,
	Context,
});

export {
	Root,
	RootProvider,
	Label,
	Control,
	Input,
	Trigger,
	ClearTrigger,
	Positioner,
	Content,
	List,
	Item,
	ItemText,
	ItemIndicator,
	ItemGroup,
	ItemGroupLabel,
	Empty,
	IndicatorGroup,
	Context,
};

export default Combobox;
