import ButtonIsland from "../../islands/button";
import {
	ButtonGroup as ButtonGroupPrimitive,
	type ButtonGroupProps,
	Button as ButtonPrimitive,
	type ButtonProps,
} from "./button-primitive";

const CloseIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<title>Close</title>
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	</svg>
);

export function IconButton(props: ButtonProps) {
	if (props.interactive) {
		return <ButtonIsland {...props} px="0" />;
	}
	return (
		<ButtonPrimitive px="0" {...props}>
			{props.children}
		</ButtonPrimitive>
	);
}

export function CloseButton(props: ButtonProps) {
	if (props.interactive) {
		return (
			<ButtonIsland variant="plain" aria-label="Close" {...props} px="0">
				<CloseIcon />
			</ButtonIsland>
		);
	}
	return (
		<ButtonPrimitive variant="plain" aria-label="Close" {...props} px="0">
			<CloseIcon />
		</ButtonPrimitive>
	);
}

export function Button(props: ButtonProps) {
	if (props.interactive) {
		return <ButtonIsland {...props} />;
	}
	return <ButtonPrimitive {...props} />;
}

export function ButtonGroup(props: ButtonGroupProps) {
	return <ButtonGroupPrimitive {...props} />;
}

export type { ButtonGroupProps, ButtonProps };
