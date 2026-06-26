import type { Child, PropsWithChildren } from "hono/jsx";
import { createContext, useContext } from "hono/jsx";
import { cx } from "styled-system/css";
import type { ButtonVariantProps } from "styled-system/recipes";
import { button } from "styled-system/recipes";
import { Group, type GroupProps } from "./group";
import { Loader } from "./loader";

const ButtonContext = createContext<ButtonVariantProps>({});

interface ButtonLoadingProps {
	loading?: boolean;
	loadingText?: Child;
	spinner?: Child;
	spinnerPlacement?: "start" | "end";
}

interface ButtonProps
	extends ButtonVariantProps,
		ButtonLoadingProps,
		PropsWithChildren<{
			class?: string;
			type?: "button" | "submit" | "reset";
			disabled?: boolean;
			interactive?: boolean;
			[key: string]: unknown;
		}> {}

function Button(props: ButtonProps) {
	const groupVariantProps = useContext(ButtonContext);
	const mergedProps = { ...groupVariantProps, ...props };
	const [variantProps, localProps] = button.splitVariantProps(mergedProps);
	const {
		loading,
		loadingText,
		children,
		spinner,
		spinnerPlacement,
		class: classProp,
		type = "button",
		disabled,
		interactive,
		...rest
	} = localProps;

	return (
		<button
			type={type}
			class={cx(button(variantProps), classProp)}
			disabled={loading || disabled}
			aria-busy={loading}
			aria-disabled={loading || disabled}
			data-loading={loading ? "" : undefined}
			{...(rest as any)}
		>
			{loading ? (
				<Loader
					spinner={spinner}
					text={loadingText}
					spinnerPlacement={spinnerPlacement}
				>
					{children}
				</Loader>
			) : (
				children
			)}
		</button>
	);
}

interface ButtonGroupProps extends GroupProps, ButtonVariantProps {}

function ButtonGroup(props: ButtonGroupProps) {
	const [variantProps, localProps] = button.splitVariantProps(props);
	const { children, ...rest } = localProps;

	return (
		<ButtonContext.Provider value={variantProps}>
			<Group {...(rest as any)}>{children}</Group>
		</ButtonContext.Provider>
	);
}

export {
	Button,
	ButtonGroup,
	type ButtonGroupProps,
	type ButtonLoadingProps,
	type ButtonProps,
};
