import type { JSX } from "hono/jsx";
import {
	cloneElement,
	createContext,
	type PropsWithChildren,
	useContext,
	useId,
} from "hono/jsx";
import { cx } from "styled-system/css";
import { type TabsVariantProps, tabs } from "styled-system/recipes";

type TabsStyles = ReturnType<typeof tabs>;

interface TabsContextValue {
	styles: TabsStyles;
	value?: string;
	onValueChange?: (value: string) => void;
	id: string;
	orientation: "horizontal" | "vertical";
}

const TabsContext = createContext<TabsContextValue | null>(null);

export const useTabsContext = () => {
	const context = useContext(TabsContext);
	if (!context) {
		// During SSR, return a default context to avoid errors
		if (typeof window === "undefined") {
			return {
				id: "ssr-tabs",
				styles: tabs({}),
				orientation: "horizontal",
			} as TabsContextValue;
		}
		throw new Error("useTabsContext must be used within a Tabs.Root");
	}
	return context;
};

export interface RootProps extends TabsVariantProps, PropsWithChildren {
	defaultValue?: string;
	value?: string;
	onValueChange?: (value: string) => void;
	id?: string;
	orientation?: "horizontal" | "vertical";
	activationMode?: "automatic" | "manual";
	rootRef?: any;
}

export function Root(props: RootProps) {
	const [variantProps, localProps] = tabs.splitVariantProps(props);
	const {
		children,
		value,
		defaultValue,
		onValueChange,
		id: idProp,
		orientation = "horizontal",
		rootRef,
		...rest
	} = localProps;

	const styles = tabs(variantProps);
	const fallbackId = useId();
	const id = idProp || fallbackId;

	const contextValue: TabsContextValue = {
		styles,
		value: value ?? defaultValue,
		onValueChange,
		id,
		orientation,
	};

	return (
		<TabsContext.Provider value={contextValue}>
			<div
				id={id}
				ref={rootRef}
				class={cx(styles.root, localProps.class)}
				data-orientation={orientation}
				data-scope="tabs"
				data-part="root"
				{...rest}
			>
				{children}
			</div>
		</TabsContext.Provider>
	);
}

export interface ListProps extends PropsWithChildren {
	class?: string;
}

export function List(props: ListProps) {
	const context = useTabsContext();
	return (
		<div
			role="tablist"
			class={cx(context.styles.list, props.class)}
			data-orientation={context.orientation}
			data-scope="tabs"
			data-part="list"
		>
			{props.children}
		</div>
	);
}

export interface TriggerProps extends PropsWithChildren {
	value: string;
	disabled?: boolean;
	class?: string;
	asChild?: boolean;
}

export function Trigger(props: TriggerProps) {
	const { value, disabled, children, class: classProp, asChild } = props;
	const context = useTabsContext();
	const isSelected = context.value === value;

	const triggerProps = {
		role: "tab",
		type: "button",
		disabled,
		"aria-selected": isSelected ? "true" : "false",
		"aria-controls": `tabs-content-${context.id}-${value}`,
		"data-selected": isSelected ? "" : undefined,
		"data-disabled": disabled ? "" : undefined,
		"data-value": value,
		"data-orientation": context.orientation,
		"data-scope": "tabs",
		"data-part": "trigger",
		tabIndex: isSelected ? 0 : -1,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(context.styles.trigger, classProp, child.props?.class),
		});
	}

	return (
		<button
			type="button"
			{...triggerProps}
			class={cx(context.styles.trigger, classProp)}
		>
			{children}
		</button>
	);
}

export interface ContentProps extends PropsWithChildren {
	value: string;
	class?: string;
}

export function Content(props: ContentProps) {
	const { value, children, class: classProp } = props;
	const context = useTabsContext();
	const isSelected = context.value === value;

	return (
		<div
			id={`tabs-content-${context.id}-${value}`}
			role="tabpanel"
			data-scope="tabs"
			data-part="content"
			data-value={value}
			data-orientation={context.orientation}
			data-selected={isSelected ? "" : undefined}
			class={cx(context.styles.content, classProp)}
			hidden={!isSelected}
		>
			{children}
		</div>
	);
}

export interface IndicatorProps {
	class?: string;
	style?: any;
}

export function Indicator(props: IndicatorProps) {
	const { class: classProp, style, ...rest } = props;
	const context = useTabsContext();
	return (
		<div
			data-scope="tabs"
			data-part="indicator"
			data-orientation={context.orientation}
			class={cx(context.styles.indicator, classProp)}
			style={style}
			{...rest}
		/>
	);
}

export interface TabsItem {
	value: string;
	label: string | JSX.Element;
	content: string | JSX.Element;
	disabled?: boolean;
}

export interface TabsStructureProps {
	items: TabsItem[];
	indicator?: boolean;
}

export const TabsStructure = (props: TabsStructureProps) => {
	const { items, indicator = true } = props;
	return (
		<>
			<List>
				{items.map((item) => (
					<Trigger key={item.value} value={item.value} disabled={item.disabled}>
						{item.label}
					</Trigger>
				))}
				{indicator && <Indicator />}
			</List>
			{items.map((item) => (
				<Content key={item.value} value={item.value}>
					{item.content}
				</Content>
			))}
		</>
	);
};

export { Root as InteractiveRoot };
