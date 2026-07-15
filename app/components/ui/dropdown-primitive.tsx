import { css, cx } from "design-system/css";
import { type DropdownVariantProps, dropdown } from "design-system/recipes";
import {
	cloneElement,
	createContext,
	type PropsWithChildren,
	useContext,
	useId,
} from "hono/jsx";

type DropdownStyles = ReturnType<typeof dropdown>;

interface DropdownContextValue {
	id: string;
	open: boolean;
	styles: DropdownStyles;
	onClose?: () => void;
	parentDropdownId?: string;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export const useDropdownContext = () => {
	const context = useContext(DropdownContext);
	if (!context) {
		// During SSR, return a default context to avoid errors
		if (typeof window === "undefined") {
			return {
				id: "ssr-dropdown",
				open: false,
				styles: dropdown({}),
				parentDropdownId: undefined,
			} as DropdownContextValue;
		}
		throw new Error("useDropdownContext must be used within a Dropdown.Root");
	}
	return context;
};

export interface DropdownRootProps
	extends DropdownVariantProps,
		PropsWithChildren {
	id?: string;
	open?: boolean;
	onClose?: () => void;
	/** Called when the menu opens or closes (interactive islands only). */
	onOpenChange?: (open: boolean) => void;
	/** Called with an item's `value` when it is activated (interactive islands only). */
	onSelect?: (value: string) => void;
}

interface DropdownRadioGroupContextValue {
	value?: string;
	onValueChange?: (details: { value: string }) => void;
}

const DropdownRadioGroupContext =
	createContext<DropdownRadioGroupContextValue | null>(null);

export const useDropdownRadioGroupContext = () =>
	useContext(DropdownRadioGroupContext);

export function DropdownRoot(props: DropdownRootProps) {
	const [variantProps, localProps] = dropdown.splitVariantProps(props);
	const { id: idProp, open = false, children, onClose } = localProps;
	const autoId = useId();
	const id = idProp || autoId;
	const styles = dropdown(variantProps);

	const parentContext = useContext(DropdownContext);

	return (
		<DropdownContext.Provider
			value={{ id, open, styles, onClose, parentDropdownId: parentContext?.id }}
		>
			{children}
		</DropdownContext.Provider>
	);
}

export interface DropdownTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
	[key: string]: unknown;
}

export function DropdownTrigger(props: DropdownTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = useDropdownContext();

	const triggerProps = {
		id: `dropdown-trigger-${context.id}`,
		"aria-haspopup": "menu",
		"aria-expanded": context.open ? "true" : "false",
		"aria-controls": `dropdown-content-${context.id}`,
		"data-state": context.open ? "open" : "closed",
		"data-scope": "dropdown",
		"data-part": "trigger",
		...restProps,
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
			class={cx(context.styles.trigger, classProp)}
			{...triggerProps}
		>
			{children}
		</button>
	);
}

export function DropdownContextTrigger(props: DropdownTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = useDropdownContext();

	const triggerProps = {
		id: `dropdown-trigger-${context.id}`,
		"aria-haspopup": "menu",
		"aria-expanded": context.open ? "true" : "false",
		"aria-controls": `dropdown-content-${context.id}`,
		"data-state": context.open ? "open" : "closed",
		"data-scope": "dropdown",
		"data-part": "context-trigger",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(context.styles.contextTrigger, classProp, child.props?.class),
		});
	}

	return (
		<div class={cx(context.styles.contextTrigger, classProp)} {...triggerProps}>
			{children}
		</div>
	);
}

export interface DropdownPositionerProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function DropdownPositioner(props: DropdownPositionerProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDropdownContext();

	return (
		<div
			class={cx(
				context.styles.positioner,
				classProp,
				!context.open && css({ display: "none" }),
			)}
			data-state={context.open ? "open" : "closed"}
			data-scope="dropdown"
			data-part="positioner"
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface DropdownContentProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function DropdownContent(props: DropdownContentProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDropdownContext();

	return (
		<div
			id={`dropdown-content-${context.id}`}
			role="menu"
			aria-labelledby={`dropdown-trigger-${context.id}`}
			class={cx(context.styles.content, classProp)}
			data-state={context.open ? "open" : "closed"}
			tabIndex={-1}
			data-scope="dropdown"
			data-part="content"
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface DropdownItemProps extends PropsWithChildren {
	id?: string;
	disabled?: boolean;
	class?: string;
	value?: string;
	asChild?: boolean;
	[key: string]: unknown;
}

export function DropdownItem(props: DropdownItemProps) {
	const {
		children,
		id,
		disabled,
		class: classProp,
		value,
		asChild,
		...restProps
	} = props;
	const context = useDropdownContext();

	const itemProps = {
		id,
		role: "menuitem",
		"data-scope": "dropdown",
		"data-part": "item",
		"data-disabled": disabled ? "" : undefined,
		"data-value": value,
		"aria-disabled": disabled ? "true" : undefined,
		tabIndex: -1,
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...itemProps,
			class: cx(context.styles.item, classProp, child.props?.class),
		});
	}

	return (
		<div class={cx(context.styles.item, classProp)} {...itemProps}>
			{children}
		</div>
	);
}

export function DropdownTriggerItem(props: DropdownItemProps) {
	const { children, disabled, class: classProp, asChild, ...restProps } = props;
	const context = useDropdownContext();

	const itemProps = {
		id: `dropdown-trigger-${context.id}`,
		role: "menuitem",
		"aria-haspopup": "menu",
		"aria-expanded": context.open ? "true" : "false",
		"aria-controls": `dropdown-content-${context.id}`,
		"aria-disabled": disabled ? "true" : undefined,
		"data-state": context.open ? "open" : "closed",
		"data-scope": "dropdown",
		"data-part": "trigger-item",
		"data-disabled": disabled ? "" : undefined,
		tabIndex: -1,
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...itemProps,
			class: cx(
				context.styles.item,
				context.styles.triggerItem,
				classProp,
				child.props?.class,
			),
		});
	}

	return (
		<div
			class={cx(context.styles.item, context.styles.triggerItem, classProp)}
			{...itemProps}
		>
			{children}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="m9 18 6-6-6-6" />
			</svg>
		</div>
	);
}

export interface DropdownItemGroupProps extends PropsWithChildren {
	id?: string;
	class?: string;
	[key: string]: unknown;
}

export function DropdownItemGroup(props: DropdownItemGroupProps) {
	const { children, id, class: classProp, ...restProps } = props;
	const context = useDropdownContext();

	return (
		<fieldset
			id={id}
			data-part="item-group"
			class={cx(context.styles.itemGroup, classProp)}
			{...restProps}
		>
			{children}
		</fieldset>
	);
}

export interface DropdownItemGroupLabelProps extends PropsWithChildren {
	htmlFor?: string;
	class?: string;
	[key: string]: unknown;
}

export function DropdownItemGroupLabel(props: DropdownItemGroupLabelProps) {
	const { children, htmlFor, class: classProp, ...restProps } = props;
	const context = useDropdownContext();

	return (
		<div
			data-part="item-group-label"
			class={cx(context.styles.itemGroupLabel, classProp)}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface DropdownItemTextProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function DropdownItemText(props: DropdownItemTextProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDropdownContext();

	return (
		<div
			data-part="item-text"
			class={cx(context.styles.itemText, classProp)}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface DropdownSeparatorProps {
	class?: string;
	[key: string]: unknown;
}

export function DropdownSeparator(props: DropdownSeparatorProps) {
	const { class: classProp, ...restProps } = props;
	const context = useDropdownContext();

	return (
		<hr
			data-part="separator"
			class={cx(context.styles.separator, classProp)}
			{...restProps}
		/>
	);
}

export interface DropdownIndicatorProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function DropdownIndicator(props: DropdownIndicatorProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDropdownContext();

	return (
		<div
			data-part="indicator"
			class={cx(context.styles.indicator, classProp)}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface DropdownCheckboxItemProps extends DropdownItemProps {
	checked?: boolean;
}

export function DropdownCheckboxItem(props: DropdownCheckboxItemProps) {
	const {
		children,
		checked,
		disabled,
		value,
		class: classProp,
		...restProps
	} = props;
	const context = useDropdownContext();

	return (
		<div
			role="menuitemcheckbox"
			aria-checked={checked ? "true" : "false"}
			aria-disabled={disabled ? "true" : undefined}
			data-state={checked ? "checked" : "unchecked"}
			data-scope="dropdown"
			data-part="item"
			data-value={value}
			data-disabled={disabled ? "" : undefined}
			class={cx(context.styles.item, classProp)}
			tabIndex={-1}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface DropdownRadioItemGroupProps extends DropdownItemGroupProps {
	value?: string;
	onValueChange?: (details: { value: string }) => void;
}

export function DropdownRadioItemGroup(props: DropdownRadioItemGroupProps) {
	const { children, value, onValueChange, ...restProps } = props;
	return (
		<DropdownRadioGroupContext.Provider value={{ value, onValueChange }}>
			<DropdownItemGroup {...restProps}>{children}</DropdownItemGroup>
		</DropdownRadioGroupContext.Provider>
	);
}

export interface DropdownRadioItemProps extends DropdownItemProps {
	value: string;
	checked?: boolean;
}

export function DropdownRadioItem(props: DropdownRadioItemProps) {
	const {
		children,
		value,
		checked,
		disabled,
		class: classProp,
		...restProps
	} = props;
	const context = useDropdownContext();
	const radioGroup = useDropdownRadioGroupContext();
	const isChecked = checked ?? radioGroup?.value === value;

	return (
		<div
			role="menuitemradio"
			aria-checked={isChecked ? "true" : "false"}
			aria-disabled={disabled ? "true" : undefined}
			data-state={isChecked ? "checked" : "unchecked"}
			data-scope="dropdown"
			data-part="item"
			data-value={value}
			data-disabled={disabled ? "" : undefined}
			class={cx(context.styles.item, classProp)}
			tabIndex={-1}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface DropdownItemIndicatorProps extends PropsWithChildren {
	class?: string;
	checked?: boolean;
	[key: string]: unknown;
}

export function DropdownItemIndicator(props: DropdownItemIndicatorProps) {
	const { children, checked, class: classProp, ...restProps } = props;
	const context = useDropdownContext();

	return (
		<div
			data-scope="dropdown"
			data-part="item-indicator"
			data-state={
				checked === undefined ? undefined : checked ? "checked" : "unchecked"
			}
			class={cx(context.styles.itemIndicator, classProp)}
			{...restProps}
		>
			{children}
		</div>
	);
}

export function DropdownArrow(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDropdownContext();
	return (
		<div
			class={cx(context.styles.arrow, classProp)}
			data-scope="dropdown"
			data-part="arrow"
			{...restProps}
		>
			{children}
		</div>
	);
}

export function DropdownArrowTip(props: { class?: string }) {
	const { class: classProp, ...restProps } = props;
	const context = useDropdownContext();
	return (
		<div
			class={cx(context.styles.arrowTip, classProp)}
			data-scope="dropdown"
			data-part="arrow-tip"
			{...restProps}
		/>
	);
}

export { DropdownContext as Context };
