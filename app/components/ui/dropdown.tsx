import { cx } from "design-system/css";
import { type DropdownVariantProps, dropdown } from "design-system/recipes";
import type { JSX } from "hono/jsx";
import InteractiveDropdownRoot from "../../islands/dropdown";
import { shouldHydrate } from "./island-utils";
// Import primitive components from dropdown-primitive
import {
	DropdownCheckboxItem as CheckboxItem,
	DropdownContent as Content,
	DropdownItem as Item,
	DropdownItemGroupLabel as ItemGroupLabel,
	DropdownItemIndicator as ItemIndicator,
	DropdownItemText as ItemText,
	DropdownArrow,
	DropdownArrowTip,
	DropdownPositioner as Positioner,
	DropdownRadioItem as RadioItem,
	DropdownRadioItemGroup as RadioItemGroup,
	DropdownRoot as RootPrimitive,
	DropdownSeparator as Separator,
	DropdownTrigger as Trigger,
} from "./dropdown-primitive";

// ============= API Types =============

type DropdownItemType =
	| "item"
	| "separator"
	| "checkbox"
	| "radio"
	| "radio-group"
	| "submenu"
	| "group";

interface BaseDropdownItem {
	type?: DropdownItemType;
	disabled?: boolean;
	class?: string;
}

interface DropdownItemItem extends BaseDropdownItem {
	type?: "item";
	label: string;
	value: string;
	icon?: JSX.Element;
	indicator?: JSX.Element;
}

interface DropdownSeparatorItem extends BaseDropdownItem {
	type: "separator";
}

interface DropdownCheckboxItem extends BaseDropdownItem {
	type: "checkbox";
	label: string;
	value: string;
	checked?: boolean;
	icon?: JSX.Element;
}

interface DropdownRadioItem extends BaseDropdownItem {
	type: "radio";
	label: string;
	value: string;
	checked?: boolean;
	icon?: JSX.Element;
}

interface DropdownRadioGroupItem extends BaseDropdownItem {
	type: "radio-group";
	value: string;
	label?: string;
	items: DropdownRadioItem[];
}

interface DropdownSubmenuItem extends BaseDropdownItem {
	type: "submenu";
	label: string;
	icon?: JSX.Element;
	items: (DropdownItemItem | DropdownSeparatorItem | DropdownCheckboxItem)[];
}

type DropdownItem =
	| DropdownItemItem
	| DropdownSeparatorItem
	| DropdownCheckboxItem
	| DropdownRadioItem
	| DropdownRadioGroupItem
	| DropdownSubmenuItem;

interface DropdownProps extends DropdownVariantProps {
	trigger?: JSX.Element;
	items?: DropdownItem[];
	defaultOpen?: boolean;
	interactive?: boolean;
	class?: string;
	contentClass?: string;
	positionerClass?: string;
	children?: any;
	arrow?: boolean;
	placement?: string;
	triggerMode?:
		| ("click" | "hover" | "contextDropdown")[]
		| "click"
		| "hover"
		| "contextDropdown";
	mouseEnterDelay?: number;
	mouseLeaveDelay?: number;
}

// ============= Rendering Functions =============

function renderDropdownItem(item: DropdownItem, index: number): JSX.Element {
	switch (item.type) {
		case "separator":
			return <Separator key={index} />;

		case "checkbox": {
			const checkboxItem = item as DropdownCheckboxItem;
			return (
				<CheckboxItem
					key={checkboxItem.value}
					value={checkboxItem.value}
					checked={checkboxItem.checked}
					disabled={checkboxItem.disabled}
				>
					{checkboxItem.icon && (
						<ItemIndicator>{checkboxItem.icon}</ItemIndicator>
					)}
					<ItemText>{checkboxItem.label}</ItemText>
				</CheckboxItem>
			);
		}

		case "radio": {
			const radioItem = item as DropdownRadioItem;
			return (
				<RadioItem
					key={radioItem.value}
					value={radioItem.value}
					checked={radioItem.checked}
					disabled={radioItem.disabled}
				>
					{radioItem.icon && <ItemIndicator>{radioItem.icon}</ItemIndicator>}
					<ItemText>{radioItem.label}</ItemText>
				</RadioItem>
			);
		}

		case "radio-group": {
			const radioGroup = item as DropdownRadioGroupItem;
			return (
				<RadioItemGroup key={radioGroup.value} value={radioGroup.value}>
					{radioGroup.label && (
						<ItemGroupLabel>{radioGroup.label}</ItemGroupLabel>
					)}
					{radioGroup.items.map((radioItem, idx) =>
						renderDropdownItem(radioItem, idx),
					)}
				</RadioItemGroup>
			);
		}

		case "submenu": {
			const submenuItem = item as DropdownSubmenuItem;
			return (
				<Item key={index} value={`submenu:${submenuItem.label}`} disabled>
					<ItemText>{submenuItem.label}</ItemText>
				</Item>
			);
		}

		default: {
			const menuItem = item as DropdownItemItem;
			return (
				<Item
					key={menuItem.value}
					value={menuItem.value}
					disabled={menuItem.disabled}
				>
					{menuItem.icon && <ItemIndicator>{menuItem.icon}</ItemIndicator>}
					<ItemText>{menuItem.label}</ItemText>
					{menuItem.indicator}
				</Item>
			);
		}
	}
}

// ============= Dropdown Component =============

function DropdownRoot(props: DropdownProps) {
	const {
		trigger,
		items,
		defaultOpen = false,
		interactive,
		class: classProp,
		contentClass,
		positionerClass,
		children,
		arrow,
		placement,
		triggerMode = ["click"],
		mouseEnterDelay,
		mouseLeaveDelay,
		...variantProps
	} = props;

	const styles = dropdown(variantProps);

	if (shouldHydrate(interactive, true)) {
		return (
			<InteractiveDropdownRoot
				open={defaultOpen}
				placement={placement}
				trigger={triggerMode}
				mouseEnterDelay={mouseEnterDelay}
				mouseLeaveDelay={mouseLeaveDelay}
				arrow={arrow}
			>
				{trigger && <Trigger asChild>{trigger}</Trigger>}
				{children}
				{items && (
					<Positioner class={cx(styles.positioner, positionerClass)}>
						{arrow && (
							<DropdownArrow>
								<DropdownArrowTip />
							</DropdownArrow>
						)}
						<Content class={cx(styles.content, contentClass)}>
							{items.map((item, index) => renderDropdownItem(item, index))}
						</Content>
					</Positioner>
				)}
			</InteractiveDropdownRoot>
		);
	}

	return (
		<RootPrimitive open={defaultOpen}>
			{trigger && <Trigger asChild>{trigger}</Trigger>}
			{children}
			{items && (
				<Positioner class={cx(styles.positioner, positionerClass)}>
					{arrow && (
						<DropdownArrow>
							<DropdownArrowTip />
						</DropdownArrow>
					)}
					<Content class={cx(styles.content, contentClass)}>
						{items.map((item, index) => renderDropdownItem(item, index))}
					</Content>
				</Positioner>
			)}
		</RootPrimitive>
	);
}

// ============= Exports =============

export const Dropdown = Object.assign(DropdownRoot, {
	Root: DropdownRoot,
	Trigger: Trigger,
	Positioner: Positioner,
	Content: Content,
	Item: Item,
	CheckboxItem: CheckboxItem,
	Separator: Separator,
	ItemText: ItemText,
	ItemIndicator: ItemIndicator,
	ItemGroupLabel: ItemGroupLabel,
	RadioItemGroup: RadioItemGroup,
	Arrow: DropdownArrow,
	ArrowTip: DropdownArrowTip,
});

export {
	type BaseDropdownItem,
	Dropdown as default,
	type DropdownCheckboxItem,
	type DropdownItem,
	type DropdownItemItem,
	type DropdownItemType,
	type DropdownProps,
	type DropdownRadioGroupItem,
	type DropdownRadioItem,
	type DropdownSeparatorItem,
	type DropdownSubmenuItem,
};
