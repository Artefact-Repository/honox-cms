import SwitchIsland from "../../islands/switch";
import {
	Switch as SwitchPrimitive,
	type SwitchProps as SwitchPrimitiveProps,
} from "./switch-primitive";

export interface SwitchProps extends SwitchPrimitiveProps {
	interactive?: boolean;
	defaultChecked?: boolean;
}

export function Switch(props: SwitchProps) {
	const { interactive, onCheckedChange, checked, defaultChecked } = props;

	const isInteractive =
		interactive !== false &&
		(interactive ||
			onCheckedChange !== undefined ||
			checked !== undefined ||
			defaultChecked !== undefined);

	if (isInteractive) {
		return <SwitchIsland {...props} />;
	}

	return <SwitchPrimitive {...props} />;
}
