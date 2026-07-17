import { css, cx } from "design-system/css";
import { type TabsVariantProps, tabs } from "design-system/recipes";
import type { JSX } from "hono/jsx";
import {
	cloneElement,
	createContext,
	type PropsWithChildren,
	useContext,
	useId,
	useRef,
} from "hono/jsx";

// `TabsContext` below is a module-scope singleton. Hot-reloading this file
// re-runs `createContext`, producing a *new* context object — any island
// left mounted from before the edit keeps consuming the old one, so
// `useTabsContext` desyncs across the reload and hono/jsx/dom's client
// reconciler recurses without terminating (`RangeError: Maximum call stack
// size exceeded` in its `build()`), collapsing the rendered tree. Declining
// HMR forces Vite to fall back to a full page reload for this module
// instead, which always leaves a single consistent context.
import.meta.hot?.decline();

type TabsStyles = ReturnType<typeof tabs>;

const CloseIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<title>Close</title>
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	</svg>
);

const PlusIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<title>Add tab</title>
		<path d="M5 12h14" />
		<path d="M12 5v14" />
	</svg>
);

interface TabsContextValue {
	styles: TabsStyles;
	value?: string;
	onValueChange?: (value: string | undefined) => void;
	id: string;
	orientation: "horizontal" | "vertical";
	lazyMount?: boolean;
	unmountOnExit?: boolean;
	deselectable?: boolean;
	loopFocus?: boolean;
	classNames?: Record<string, string>;
	customStyles?: Record<string, any>;
	animated?: boolean | { inkBar?: boolean; tabPane?: boolean };
	tabBarGutter?: number | string;
	tabBarStyle?: any;
	removeIcon?: any;
	addIcon?: any;
	mountedValues?: Set<string>;
}

/** Fine-grain control over the sliding indicator's thickness and alignment. */
export interface IndicatorConfig {
	/** Alignment of a shrunken indicator within the active trigger. */
	align?: "start" | "center" | "end";
	/** Fixed length in px, or a function of the trigger's own length. */
	size?: number | ((origin: number) => number);
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
	onValueChange?: (value: string | undefined) => void;
	id?: string;
	orientation?: "horizontal" | "vertical";
	/** Overrides the ambient text direction for arrow-key navigation. Defaults to
	 * the computed direction (e.g. an ancestor `<html dir="rtl">`). */
	dir?: "ltr" | "rtl";
	activationMode?: "automatic" | "manual";
	/** Whether re-activating the selected trigger clears the selection. Default `false`. */
	deselectable?: boolean;
	/** Whether arrow-key navigation wraps around. Default `true`. */
	loopFocus?: boolean;
	/** Never mount a panel until its tab is first activated. Default `false`. */
	lazyMount?: boolean;
	/** Unmount a panel as soon as it's no longer active. Default `false`. */
	unmountOnExit?: boolean;
	rootRef?: any;

	activeKey?: string;
	defaultActiveKey?: string;
	onChange?: (value: string) => void;
	/** Notified on every click of an enabled tab, even the already-active one. */
	onTabClick?: (key: string, event: MouseEvent) => void;
	/** Notified when the tab list scrolls (overflowing tab bars only). */
	onTabScroll?: (info: {
		direction: "left" | "right" | "top" | "bottom";
	}) => void;
	type?: "line" | "card" | "editable-card";
	tabPlacement?: "top" | "end" | "bottom" | "start";
	tabPosition?: "top" | "right" | "bottom" | "left";
	tabBarGutter?: number | string;
	tabBarStyle?: any;
	classNames?: Record<string, string>;
	styles?: Record<string, any>;
	addIcon?: any;
	removeIcon?: any;
	animated?: boolean | { inkBar?: boolean; tabPane?: boolean };
	class?: string;
}

function getSemanticProps(
	part: string,
	classNames?: Record<string, string>,
	customStyles?: Record<string, any>,
) {
	let className = classNames?.[part];
	let style = customStyles?.[part];

	if (part === "list") {
		className = className || classNames?.header || classNames?.tabBar;
		style = style || customStyles?.header || customStyles?.tabBar;
	} else if (part === "trigger") {
		className = className || classNames?.item;
		style = style || customStyles?.item;
	} else if (part === "close") {
		className = className || classNames?.remove;
		style = style || customStyles?.remove;
	} else if (part === "content") {
		className = className || classNames?.body;
		style = style || customStyles?.body;
	}

	return { className, style };
}

export function Root(props: RootProps) {
	const [variantProps, localProps] = tabs.splitVariantProps(props);
	const {
		children,
		value,
		defaultValue,
		onValueChange,
		id: idProp,
		orientation,
		dir,
		rootRef,
		deselectable,
		loopFocus,
		lazyMount,
		unmountOnExit,

		activeKey,
		defaultActiveKey,
		onChange,
		onTabClick,
		onTabScroll,
		type,
		tabPlacement,
		tabPosition,
		tabBarGutter,
		tabBarStyle,
		classNames,
		styles,
		addIcon,
		removeIcon,
		animated,
		...rest
	} = localProps;

	// Normalize Size
	let resolvedSize = variantProps.size;
	if (resolvedSize === "large") resolvedSize = "lg";
	else if (resolvedSize === "medium") resolvedSize = "md";
	else if (resolvedSize === "small") resolvedSize = "sm";
	variantProps.size = resolvedSize;

	// Map Type to Variant
	let resolvedVariant = variantProps.variant;
	if (type === "line") resolvedVariant = "line";
	else if (type === "card" || type === "editable-card")
		resolvedVariant = "card";
	variantProps.variant = resolvedVariant;

	// Resolve placement & position to orientation
	const placement = tabPlacement || tabPosition || "top";
	let resolvedOrientation: "horizontal" | "vertical" =
		orientation || "horizontal";
	if (
		placement === "left" ||
		placement === "right" ||
		placement === "start" ||
		placement === "end"
	) {
		resolvedOrientation = "vertical";
	}

	const stylesObj = tabs(variantProps);
	const fallbackId = useId();
	const id = idProp || fallbackId;

	const resolvedVal = activeKey !== undefined ? activeKey : value;
	const resolvedDefaultVal =
		defaultActiveKey !== undefined ? defaultActiveKey : defaultValue;
	const currentValue = resolvedVal ?? resolvedDefaultVal;

	// Backs `lazyMount`: tracks every value that has been active at least
	// once so a panel that was already shown stays mounted even after the
	// selection moves away, rather than remounting from scratch each time.
	const mountedRef = useRef<Set<string>>();
	if (!mountedRef.current) mountedRef.current = new Set();
	if (currentValue) mountedRef.current.add(currentValue);

	const contextValue: TabsContextValue = {
		styles: stylesObj,
		value: currentValue,
		onValueChange: (val) => {
			onValueChange?.(val);
			if (val !== undefined) onChange?.(val);
		},
		id,
		orientation: resolvedOrientation,
		lazyMount,
		unmountOnExit,
		deselectable,
		loopFocus: loopFocus ?? true,
		classNames,
		customStyles: styles,
		animated,
		tabBarGutter,
		tabBarStyle,
		removeIcon,
		addIcon,
		mountedValues: mountedRef.current,
	};

	const semanticRoot = getSemanticProps("root", classNames, styles);
	const rootStyle: any = { ...semanticRoot.style };

	// Leverage CSS flex properties to visually reverse layout according to placement/position
	if (placement === "bottom") {
		rootStyle.flexDirection = "column-reverse";
	} else if (placement === "right" || placement === "end") {
		rootStyle.flexDirection = "row-reverse";
	}

	return (
		<TabsContext.Provider value={contextValue}>
			<div
				id={id}
				ref={(el: HTMLDivElement | null) => {
					if (rootRef) rootRef.current = el;
				}}
				class={cx(stylesObj.root, semanticRoot.className, localProps.class)}
				style={rootStyle}
				dir={dir}
				data-orientation={resolvedOrientation}
				data-placement={placement}
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
	style?: any;
}

export function List(props: ListProps) {
	const context = useTabsContext();
	const { className: customClass, style: customStyle } = getSemanticProps(
		"list",
		context.classNames,
		context.customStyles,
	);

	const listStyle: any = { ...customStyle, ...props.style };
	if (context.tabBarGutter !== undefined) {
		listStyle.gap =
			typeof context.tabBarGutter === "number"
				? `${context.tabBarGutter}px`
				: context.tabBarGutter;
	}
	if (context.tabBarStyle) {
		Object.assign(listStyle, context.tabBarStyle);
	}

	return (
		<div
			role="tablist"
			aria-orientation={context.orientation}
			class={cx(context.styles.list, customClass, props.class)}
			style={listStyle}
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
	style?: any;
	asChild?: boolean;
	/** Icon rendered before the label. */
	icon?: JSX.Element;
	/** Render a close button inside the tab (used by closable/editable tabs). */
	closable?: boolean;
	onClose?: () => void;
	closeAriaLabel?: string;
	closeIcon?: any;
}

export function Trigger(props: TriggerProps) {
	const {
		value,
		disabled,
		children,
		class: classProp,
		style,
		asChild,
		icon,
		closable,
		onClose,
		closeAriaLabel = "Close tab",
		closeIcon,
	} = props;
	const context = useTabsContext();
	const isSelected = context.value === value;

	const triggerProps = {
		id: `tabs-trigger-${context.id}-${value}`,
		role: "tab",
		disabled,
		"aria-selected": isSelected ? "true" : "false",
		"aria-disabled": disabled ? "true" : undefined,
		"aria-controls": `tabs-content-${context.id}-${value}`,
		"data-selected": isSelected ? "" : undefined,
		"data-disabled": disabled ? "" : undefined,
		"data-value": value,
		"data-orientation": context.orientation,
		"data-scope": "tabs",
		"data-part": "trigger",
		tabIndex: isSelected ? 0 : -1,
	};

	const { className: customClass, style: customStyle } = getSemanticProps(
		"trigger",
		context.classNames,
		context.customStyles,
	);
	const { className: closeClass, style: closeStyle } = getSemanticProps(
		"close",
		context.classNames,
		context.customStyles,
	);

	const mergedTriggerStyle = {
		...customStyle,
		...style,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			type: "button",
			class: cx(
				context.styles.trigger,
				customClass,
				classProp,
				child.props?.class,
			),
			style: { ...mergedTriggerStyle, ...child.props?.style },
		});
	}

	const label = (
		<>
			{icon}
			{children}
		</>
	);

	if (closable) {
		const closeIconElement =
			closeIcon !== undefined && closeIcon !== null
				? closeIcon === false
					? null
					: closeIcon
				: context.removeIcon || <CloseIcon />;

		return (
			<div
				{...triggerProps}
				class={cx(context.styles.trigger, customClass, classProp)}
				style={mergedTriggerStyle}
			>
				{label}
				{closeIconElement && (
					<button
						type="button"
						data-scope="tabs"
						data-part="close"
						aria-label={closeAriaLabel}
						class={cx(context.styles.close, closeClass)}
						style={closeStyle}
						onClick={(e) => {
							e.stopPropagation();
							onClose?.();
						}}
					>
						{closeIconElement}
					</button>
				)}
			</div>
		);
	}

	return (
		<button
			type="button"
			{...triggerProps}
			class={cx(context.styles.trigger, customClass, classProp)}
			style={mergedTriggerStyle}
		>
			{label}
		</button>
	);
}

export interface ContentProps extends PropsWithChildren {
	value: string;
	class?: string;
	style?: any;
	/** Per-panel override of the root's `unmountOnExit`. */
	unmountOnExit?: boolean;
}

export function Content(props: ContentProps) {
	const {
		value,
		children,
		class: classProp,
		style,
		unmountOnExit: itemUnmount,
	} = props;
	const context = useTabsContext();
	const isSelected = context.value === value;
	const shouldUnmount = itemUnmount ?? context.unmountOnExit;

	if (shouldUnmount && !isSelected) {
		return null;
	}

	// `lazyMount`: skip the very first mount for panels that have never been
	// active yet. Once `context.mountedValues` records a value (Root adds the
	// current value on every render), it stays mounted from then on even if
	// selection moves elsewhere — this only matters for the initial render
	// of a fresh island/SSR pass, since later selection changes are handled
	// via the imperative DOM sync in `islands/tabs.tsx`, not re-render.
	if (context.lazyMount && !isSelected && !context.mountedValues?.has(value)) {
		return null;
	}

	const { className: customClass, style: customStyle } = getSemanticProps(
		"content",
		context.classNames,
		context.customStyles,
	);

	// AntD semantics: `animated: true` animates panes too, the object form
	// opts in per concern, and the default (undefined) animates the ink bar only.
	const paneAnimated =
		context.animated === true ||
		(typeof context.animated === "object" &&
			context.animated?.tabPane === true);

	return (
		<div
			id={`tabs-content-${context.id}-${value}`}
			role="tabpanel"
			aria-labelledby={`tabs-trigger-${context.id}-${value}`}
			data-scope="tabs"
			data-part="content"
			data-value={value}
			data-orientation={context.orientation}
			data-pane-animated={paneAnimated ? "" : undefined}
			data-selected={isSelected ? "" : undefined}
			class={cx(context.styles.content, customClass, classProp)}
			style={{ ...customStyle, ...style }}
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
	const { className: customClass, style: customStyle } = getSemanticProps(
		"indicator",
		context.classNames,
		context.customStyles,
	);

	const isAnimated =
		context.animated !== false &&
		(typeof context.animated !== "object" || context.animated.inkBar !== false);

	const indicatorStyle = {
		...customStyle,
		...style,
	};
	if (!isAnimated) {
		indicatorStyle.transition = "none";
	}

	return (
		<div
			data-scope="tabs"
			data-part="indicator"
			data-orientation={context.orientation}
			class={cx(context.styles.indicator, customClass, classProp)}
			style={indicatorStyle}
			{...rest}
		/>
	);
}

export interface TabsItem {
	value?: string;
	key?: string;
	label?: string | JSX.Element;
	children?: string | JSX.Element;
	content?: string | JSX.Element;
	disabled?: boolean;
	/** Icon rendered before the label. */
	icon?: JSX.Element;
	/** Overrides the structure-level `closable`/`editable` default for this tab. */
	closable?: boolean;
	closeIcon?: any;
	/** Per-item override of the root's `unmountOnExit`. */
	unmountOnExit?: boolean;
}

export interface AddTriggerProps {
	class?: string;
	style?: any;
	onAdd?: () => void;
	disabled?: boolean;
	ariaLabel?: string;
}

/** The trailing "+" trigger rendered by editable tab lists to append a new tab. */
export function AddTrigger(props: AddTriggerProps) {
	const {
		class: classProp,
		style,
		onAdd,
		disabled,
		ariaLabel = "Add tab",
	} = props;
	const context = useTabsContext();
	const { className: customClass, style: customStyle } = getSemanticProps(
		"add",
		context.classNames,
		context.customStyles,
	);

	const addIconElement = context.addIcon || <PlusIcon />;

	return (
		<button
			type="button"
			data-scope="tabs"
			data-part="add"
			aria-label={ariaLabel}
			disabled={disabled}
			data-disabled={disabled ? "" : undefined}
			class={cx(context.styles.add, customClass, classProp)}
			style={{ ...customStyle, ...style }}
			onClick={() => onAdd?.()}
		>
			{addIconElement}
		</button>
	);
}

export interface TabsStructureProps {
	items: TabsItem[];
	/** Render the sliding indicator (default), or configure its size/alignment. */
	indicator?: boolean | IndicatorConfig;
	/** Every tab gets a close button (no "add" trigger). Per-item `closable` still wins. */
	closable?: boolean;
	/** Shorthand for `closable` plus a trailing "add tab" trigger. */
	editable?: boolean;
	/** Suppress the trailing "add tab" trigger of editable tabs. */
	hideAdd?: boolean;
	onTabClose?: (value: string) => void;
	onTabAdd?: () => void;
	addAriaLabel?: string;
	/** Content rendered alongside the tab list — a single node, or split start/end. */
	extra?:
		| JSX.Element
		| {
				start?: JSX.Element;
				end?: JSX.Element;
				left?: JSX.Element;
				right?: JSX.Element;
		  };
	tabBarExtraContent?:
		| JSX.Element
		| {
				start?: JSX.Element;
				end?: JSX.Element;
				left?: JSX.Element;
				right?: JSX.Element;
		  };
}

export const TabsStructure = (props: TabsStructureProps) => {
	const {
		items,
		indicator,
		closable,
		editable,
		hideAdd,
		onTabClose,
		onTabAdd,
		addAriaLabel,
		extra,
		tabBarExtraContent,
	} = props;
	const showClose = closable || editable;

	const normalizedItems = (items || []).map((item) => {
		const val = item.value ?? item.key;
		const content = item.content ?? item.children;
		return {
			...item,
			value: val as string,
			content,
		};
	});

	const resolvedExtra = extra || tabBarExtraContent;
	const isSplitExtra =
		resolvedExtra != null &&
		typeof resolvedExtra === "object" &&
		("start" in resolvedExtra ||
			"end" in resolvedExtra ||
			"left" in resolvedExtra ||
			"right" in resolvedExtra);
	const extraStart = isSplitExtra
		? (resolvedExtra as any).start || (resolvedExtra as any).left
		: undefined;
	const extraEnd = isSplitExtra
		? (resolvedExtra as any).end || (resolvedExtra as any).right
		: resolvedExtra != null &&
				!("start" in resolvedExtra) &&
				!("end" in resolvedExtra) &&
				!("left" in resolvedExtra) &&
				!("right" in resolvedExtra)
			? resolvedExtra
			: undefined;

	const list = (
		<List>
			{normalizedItems.map((item) => (
				<Trigger
					key={item.value}
					value={item.value}
					disabled={item.disabled}
					icon={item.icon}
					closable={item.closable ?? showClose}
					closeIcon={item.closeIcon}
					onClose={() => onTabClose?.(item.value)}
				>
					{item.label}
				</Trigger>
			))}
			{editable && !hideAdd && (
				<AddTrigger onAdd={onTabAdd} ariaLabel={addAriaLabel} />
			)}
			{indicator !== false && <Indicator />}
		</List>
	);

	return (
		<>
			{resolvedExtra ? (
				<div
					class={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "4",
						width: "full",
					})}
				>
					{extraStart}
					{list}
					{extraEnd}
				</div>
			) : (
				list
			)}
			{normalizedItems.map((item) => (
				<Content
					key={item.value}
					value={item.value}
					unmountOnExit={item.unmountOnExit}
				>
					{item.content}
				</Content>
			))}
		</>
	);
};

export { Root as InteractiveRoot };
