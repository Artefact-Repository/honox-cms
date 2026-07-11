import SelectIsland from "../../islands/select";
import { shouldHydrate } from "./island-utils";
import {
	ClearTrigger,
	Content,
	Control,
	HiddenSelect,
	Indicator,
	IndicatorGroup,
	Item,
	ItemGroup,
	ItemGroupLabel,
	ItemIndicator,
	ItemText,
	Label,
	List,
	Positioner,
	Root,
	type SelectFlattenedProps,
	SelectStructure,
	Trigger,
	ValueText,
} from "./select-primitive";

export interface SelectProps extends SelectFlattenedProps {
	interactive?: boolean;
}

export function SelectRoot(props: SelectProps) {
	const { interactive, ...rest } = props;

	// The Select component forces hydration by default using shouldHydrate(interactive, true)
	const isInteractive = shouldHydrate(interactive, true);

	if (isInteractive) {
		return <SelectIsland {...rest} />;
	}

	return (
		<Root {...rest}>
			<SelectStructure {...rest} />
		</Root>
	);
}

export const Select = Object.assign(SelectRoot, {
	Root,
	Label,
	Control,
	Trigger,
	ValueText,
	Indicator,
	IndicatorGroup,
	Positioner,
	Content,
	List,
	Item,
	ItemText,
	ItemIndicator,
	ItemGroup,
	ItemGroupLabel,
	ClearTrigger,
	HiddenSelect,
});

export {
	ClearTrigger,
	Content,
	Control,
	HiddenSelect,
	Indicator,
	IndicatorGroup,
	Item,
	ItemGroup,
	ItemGroupLabel,
	ItemIndicator,
	ItemText,
	Label,
	List,
	Positioner,
	Root,
	Trigger,
	ValueText,
};

export default Select;
