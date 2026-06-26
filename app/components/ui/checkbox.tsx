import CheckboxIsland from "../../islands/checkbox";
import {
	type CheckboxProps as BaseCheckboxProps,
	Checkbox as CheckboxPrimitive,
} from "./checkbox-primitive";

export interface CheckboxProps extends BaseCheckboxProps {
	interactive?: boolean;
	defaultChecked?: boolean | "indeterminate";
}

export function Checkbox(props: CheckboxProps) {
	const { interactive, onCheckedChange, checked, defaultChecked } = props;

	const isInteractive =
		interactive !== false &&
		(interactive ||
			onCheckedChange !== undefined ||
			checked !== undefined ||
			defaultChecked !== undefined);

	if (isInteractive) {
		return <CheckboxIsland {...props} />;
	}

	return <CheckboxPrimitive {...props} />;
}
