import {
	InteractiveSwitch,
	type InteractiveSwitchProps,
} from "../components/ui/switch-primitive";

export default function SwitchIsland(props: InteractiveSwitchProps) {
	return <InteractiveSwitch {...props} />;
}

export type { InteractiveSwitchProps as SwitchIslandProps };
