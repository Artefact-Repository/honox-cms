import {
	cloneElement,
	createContext,
	type PropsWithChildren,
	useContext,
	useId,
} from "hono/jsx";
import { css, cx } from "styled-system/css";
import { type MenuVariantProps, menu } from "styled-system/recipes";

type MenuStyles = ReturnType<typeof menu>;

interface MenuContextValue {
	id: string;
	open: boolean;
	styles: MenuStyles;
	onClose?: () => void;
	parentMenuId?: string;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export const useMenuContext = () => {
	const context = useContext(MenuContext);
	if (!context) {
		// During SSR, return a default context to avoid errors
		if (typeof window === "undefined") {
			return {
				id: "ssr-menu",
				open: false,
				styles: menu({}),
				parentMenuId: undefined,
			} as MenuContextValue;
		}
		throw new Error("useMenuContext must be used within a Menu.Root");
	}
	return context;
};

export interface MenuRootProps extends MenuVariantProps, PropsWithChildren {
	id?: string;
	open?: boolean;
	onClose?: () => void;
}

export function MenuRoot(props: MenuRootProps) {
	const [variantProps, localProps] = menu.splitVariantProps(props);
	const { id: idProp, open = false, children, onClose } = localProps;
	const autoId = useId();
	const id = idProp || autoId;
	const styles = menu(variantProps);

	const parentContext = useContext(MenuContext);

	return (
		<MenuContext.Provider
			value={{ id, open, styles, onClose, parentMenuId: parentContext?.id }}
		>
			{children}
		</MenuContext.Provider>
	);
}

export interface MenuTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
	[key: string]: unknown;
}

export function MenuTrigger(props: MenuTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = useMenuContext();

	const triggerProps = {
		id: `menu-trigger-${context.id}`,
		"aria-haspopup": "menu",
		"aria-expanded": context.open ? "true" : "false",
		"aria-controls": context.open ? `menu-content-${context.id}` : undefined,
		"data-state": context.open ? "open" : "closed",
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

export function MenuContextTrigger(props: MenuTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = useMenuContext();

	const triggerProps = {
		"data-part": "context-trigger",
		"aria-haspopup": "menu",
		"aria-expanded": context.open ? "true" : "false",
		"data-state": context.open ? "open" : "closed",
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

export interface MenuPositionerProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function MenuPositioner(props: MenuPositionerProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useMenuContext();

	return (
		<div
			class={cx(
				context.styles.positioner,
				classProp,
				!context.open && css({ display: "none" }),
			)}
			data-state={context.open ? "open" : "closed"}
			data-part="positioner"
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface MenuContentProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function MenuContent(props: MenuContentProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useMenuContext();

	return (
		<div
			id={`menu-content-${context.id}`}
			role="menu"
			aria-labelledby={`menu-trigger-${context.id}`}
			class={cx(context.styles.content, classProp)}
			data-state={context.open ? "open" : "closed"}
			tabIndex={-1}
			data-part="content"
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface MenuItemProps extends PropsWithChildren {
	id?: string;
	disabled?: boolean;
	class?: string;
	value?: string;
	asChild?: boolean;
	[key: string]: unknown;
}

export function MenuItem(props: MenuItemProps) {
	const {
		children,
		id,
		disabled,
		class: classProp,
		value,
		asChild,
		...restProps
	} = props;
	const context = useMenuContext();

	const itemProps = {
		id,
		role: "menuitem",
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

export function MenuTriggerItem(props: MenuItemProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = useMenuContext();

	const itemProps = {
		role: "menuitem",
		"aria-haspopup": "menu",
		"aria-expanded": context.open ? "true" : "false",
		"data-state": context.open ? "open" : "closed",
		"data-part": "trigger-item",
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

export interface MenuItemGroupProps extends PropsWithChildren {
	id?: string;
	class?: string;
	[key: string]: unknown;
}

export function MenuItemGroup(props: MenuItemGroupProps) {
	const { children, id, class: classProp, ...restProps } = props;
	const context = useMenuContext();

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

export interface MenuItemGroupLabelProps extends PropsWithChildren {
	htmlFor?: string;
	class?: string;
	[key: string]: unknown;
}

export function MenuItemGroupLabel(props: MenuItemGroupLabelProps) {
	const { children, htmlFor, class: classProp, ...restProps } = props;
	const context = useMenuContext();

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

export interface MenuItemTextProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function MenuItemText(props: MenuItemTextProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useMenuContext();

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

export interface MenuSeparatorProps {
	class?: string;
	[key: string]: unknown;
}

export function MenuSeparator(props: MenuSeparatorProps) {
	const { class: classProp, ...restProps } = props;
	const context = useMenuContext();

	return (
		<hr
			data-part="separator"
			class={cx(context.styles.separator, classProp)}
			{...restProps}
		/>
	);
}

export interface MenuIndicatorProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function MenuIndicator(props: MenuIndicatorProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useMenuContext();

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

export interface MenuCheckboxItemProps extends MenuItemProps {
	checked?: boolean;
}

export function MenuCheckboxItem(props: MenuCheckboxItemProps) {
	const { children, checked, class: classProp, ...restProps } = props;
	const context = useMenuContext();

	return (
		<div
			role="menuitemcheckbox"
			aria-checked={checked ? "true" : "false"}
			data-state={checked ? "checked" : "unchecked"}
			data-part="item"
			class={cx(context.styles.item, classProp)}
			tabIndex={-1}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface MenuRadioItemGroupProps extends MenuItemGroupProps {
	value?: string;
	onValueChange?: (details: { value: string }) => void;
}

export function MenuRadioItemGroup(props: MenuRadioItemGroupProps) {
	const { children, value, onValueChange, ...restProps } = props;
	return <MenuItemGroup {...restProps}>{children}</MenuItemGroup>;
}

export interface MenuRadioItemProps extends MenuItemProps {
	value: string;
	checked?: boolean;
}

export function MenuRadioItem(props: MenuRadioItemProps) {
	const { children, value, checked, class: classProp, ...restProps } = props;
	const context = useMenuContext();

	return (
		<div
			role="menuitemradio"
			aria-checked={checked ? "true" : "false"}
			data-state={checked ? "checked" : "unchecked"}
			data-part="item"
			data-value={value}
			class={cx(context.styles.item, classProp)}
			tabIndex={-1}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface MenuItemIndicatorProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function MenuItemIndicator(props: MenuItemIndicatorProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useMenuContext();

	return (
		<div
			data-part="item-indicator"
			class={cx(context.styles.itemIndicator, classProp)}
			{...restProps}
		>
			{children}
		</div>
	);
}

export function MenuArrow(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = useMenuContext();
	return (
		<div class={cx(context.styles.arrow, classProp)} {...restProps}>
			{children}
		</div>
	);
}

export function MenuArrowTip(props: { class?: string }) {
	const { class: classProp, ...restProps } = props;
	const context = useMenuContext();
	return <div class={cx(context.styles.arrowTip, classProp)} {...restProps} />;
}

export { MenuContext as Context };
