import {
	InteractiveCheckbox,
	type InteractiveCheckboxProps,
} from "../components/ui/checkbox-primitive";

export default function CheckboxIsland(props: InteractiveCheckboxProps) {
	return <InteractiveCheckbox {...props} />;
}

export type { InteractiveCheckboxProps as CheckboxIslandProps };
