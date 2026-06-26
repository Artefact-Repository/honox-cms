import {
	InteractiveTextarea,
	type TextareaProps,
} from "../components/ui/textarea-primitive";

export default function TextareaIsland(props: TextareaProps) {
	return <InteractiveTextarea {...props} />;
}

export type { TextareaProps as TextareaIslandProps };
