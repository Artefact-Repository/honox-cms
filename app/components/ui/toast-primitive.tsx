import type { PropsWithChildren } from "hono/jsx";
import { cloneElement, createContext, useContext } from "hono/jsx";
import { cx } from "styled-system/css";
import type { ToastVariantProps } from "styled-system/recipes";
import { toast } from "styled-system/recipes";

type ToastStyles = ReturnType<typeof toast>;

interface ToastContextValue {
	styles: ToastStyles;
	type?: string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const useToastContext = () => {
	const context = useContext(ToastContext);
	return context;
};

export interface RootProps extends ToastVariantProps, PropsWithChildren {
	class?: string;
	type?: string;
	[key: string]: any;
}

export function Root(props: RootProps) {
	const [variantProps, localProps] = toast.splitVariantProps(props);
	const { children, class: classProp, type, ...rest } = localProps;
	const styles = toast(variantProps);

	return (
		<ToastContext.Provider value={{ styles, type }}>
			<div
				data-scope="toast"
				data-part="root"
				data-type={type}
				data-state="open"
				class={cx(styles.root, classProp)}
				{...rest}
			>
				{children}
			</div>
		</ToastContext.Provider>
	);
}

export interface TitleProps extends PropsWithChildren {
	class?: string;
}

export function Title(props: TitleProps) {
	const { children, class: classProp, ...rest } = props;
	const context = useToastContext();
	return (
		<div
			data-scope="toast"
			data-part="title"
			class={cx(context?.styles.title, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

export interface DescriptionProps extends PropsWithChildren {
	class?: string;
}

export function Description(props: DescriptionProps) {
	const { children, class: classProp, ...rest } = props;
	const context = useToastContext();
	return (
		<div
			data-scope="toast"
			data-part="description"
			class={cx(context?.styles.description, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

export interface ActionTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
}

export function ActionTrigger(props: ActionTriggerProps) {
	const { children, class: classProp, asChild, ...rest } = props;
	const context = useToastContext();

	const triggerProps = {
		"data-scope": "toast",
		"data-part": "action-trigger",
		class: cx(context?.styles.actionTrigger, classProp),
		...rest,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(triggerProps.class, child.props?.class),
		});
	}

	return (
		<button type="button" {...triggerProps}>
			{children}
		</button>
	);
}

export interface CloseTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
}

export function CloseTrigger(props: CloseTriggerProps) {
	const { children, class: classProp, asChild, ...rest } = props;
	const context = useToastContext();

	const triggerProps = {
		"data-scope": "toast",
		"data-part": "close-trigger",
		class: cx(context?.styles.closeTrigger, classProp),
		...rest,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(triggerProps.class, child.props?.class),
		});
	}

	return (
		<button type="button" aria-label="Close" {...triggerProps}>
			{children}
		</button>
	);
}

export interface IndicatorProps extends PropsWithChildren {
	class?: string;
}

export function Indicator(props: IndicatorProps) {
	const { children, class: classProp, ...rest } = props;
	const context = useToastContext();
	return (
		<div
			data-scope="toast"
			data-part="indicator"
			data-type={context?.type}
			class={cx(context?.styles.indicator, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}
