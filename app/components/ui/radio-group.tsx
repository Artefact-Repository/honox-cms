import RadioGroupIsland from "../../islands/radio-group";
import {
	Indicator,
	Item,
	ItemControl,
	ItemHiddenInput,
	ItemText,
	Label,
	RadioGroupStructure,
	type RadioGroupStructureProps,
	Root,
	type RootProps,
} from "./radio-group-primitive";

export interface RadioGroupProps
	extends RootProps,
		Partial<RadioGroupStructureProps> {
	interactive?: boolean;
}

const RadioGroupRoot = (props: RadioGroupProps) => {
	const { interactive = true, ...rest } = props;

	if (interactive) {
		return <RadioGroupIsland {...(rest as any)} />;
	}

	return (
		<Root {...rest}>
			{props.children ||
				(rest.items && <RadioGroupStructure items={rest.items} />)}
		</Root>
	);
};

export const RadioGroup = Object.assign(RadioGroupRoot, {
	Root: RadioGroupRoot,
	Label: Label,
	Indicator: Indicator,
	Item: Item,
	ItemText: ItemText,
	ItemControl: ItemControl,
	ItemHiddenInput: ItemHiddenInput,
	Items: RadioGroupStructure,
});

export type { RadioGroupProps };
export default RadioGroup;
