import type { Child, JSX } from "hono/jsx";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useId,
} from "hono/jsx";
import { cx } from "styled-system/css";
import {
	type RadioGroupVariantProps,
	radioGroup,
} from "styled-system/recipes";

type RadioGroupStyles = ReturnType<typeof radioGroup>;

interface RadioGroupContextValue {
	styles: RadioGroupStyles;
	value?: string;
	onValueChange?: (value: string) => void;
	id: string;
	disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export const useRadioGroupContext = () => {
	const context = useContext(RadioGroupContext);
	if (!context) {
		if (typeof window === "undefined") {
			return {
				id: "ssr-radio-group",
				styles: radioGroup({}),
			} as RadioGroupContextValue;
		}
		throw new Error(
			"useRadioGroupContext must be used within a RadioGroup.Root",
		);
	}
	return context;
};

export interface RootProps extends RadioGroupVariantProps, PropsWithChildren {
	defaultValue?: string;
	value?: string;
	onValueChange?: (value: string) => void;
	id?: string;
	name?: string;
	disabled?: boolean;
	readOnly?: boolean;
	rootRef?: any;
	class?: string;
}

export function Root(props: RootProps) {
	const [variantProps, localProps] = radioGroup.splitVariantProps(props);
	const {
		children,
		value,
		defaultValue,
		onValueChange,
		id: idProp,
		name,
		disabled,
		readOnly,
		rootRef,
		...rest
	} = localProps;

	const styles = radioGroup(variantProps);
	const fallbackId = useId();
	const id = idProp || fallbackId;

	const contextValue: RadioGroupContextValue = {
		styles,
		value: value ?? defaultValue,
		onValueChange,
		id,
		disabled,
	};

	return (
		<RadioGroupContext.Provider value={contextValue}>
			<div
				id={id}
				ref={rootRef}
				role="radiogroup"
				class={cx(styles.root, localProps.class)}
				data-disabled={disabled ? "" : undefined}
				data-readonly={readOnly ? "" : undefined}
				data-scope="radio-group"
				data-part="root"
				{...rest}
			>
				{children}
			</div>
		</RadioGroupContext.Provider>
	);
}

export interface LabelProps extends PropsWithChildren {
	class?: string;
}

export function Label(props: LabelProps) {
	const context = useRadioGroupContext();
	return (
		<label
			class={cx(context.styles.label, props.class)}
			data-scope="radio-group"
			data-part="label"
		>
			{props.children}
		</label>
	);
}

export interface IndicatorProps {
	class?: string;
	style?: any;
}

export function Indicator(props: IndicatorProps) {
	const { class: classProp, style, ...rest } = props;
	const context = useRadioGroupContext();
	return (
		<div
			data-scope="radio-group"
			data-part="indicator"
			class={cx(context.styles.indicator, classProp)}
			style={style}
			{...rest}
		/>
	);
}

export interface ItemProps extends PropsWithChildren {
	value: string;
	disabled?: boolean;
	invalid?: boolean;
	class?: string;
}

const ItemContext = createContext<{ value: string; disabled?: boolean } | null>(
	null,
);

export function Item(props: ItemProps) {
	const { value, disabled, children, class: classProp, ...rest } = props;
	const context = useRadioGroupContext();
	const isChecked = context.value === value;
	const isDisabled = disabled || context.disabled;

	return (
		<ItemContext.Provider value={{ value, disabled: isDisabled }}>
			<label
				class={cx(context.styles.item, classProp)}
				data-scope="radio-group"
				data-part="item"
				data-value={value}
				data-state={isChecked ? "checked" : "unchecked"}
				data-disabled={isDisabled ? "" : undefined}
				tabIndex={isChecked && !isDisabled ? 0 : -1}
				{...rest}
			>
				{children}
			</label>
		</ItemContext.Provider>
	);
}

export interface ItemTextProps extends PropsWithChildren {
	class?: string;
}

export function ItemText(props: ItemTextProps) {
	const context = useRadioGroupContext();
	const item = useContext(ItemContext);
	const isChecked = context.value === item?.value;

	return (
		<span
			class={cx(context.styles.itemText, props.class)}
			data-scope="radio-group"
			data-part="item-text"
			data-state={isChecked ? "checked" : "unchecked"}
			data-disabled={item?.disabled ? "" : undefined}
		>
			{props.children}
		</span>
	);
}

export interface ItemControlProps extends PropsWithChildren {
	class?: string;
}

export function ItemControl(props: ItemControlProps) {
	const context = useRadioGroupContext();
	const item = useContext(ItemContext);
	const isChecked = context.value === item?.value;

	return (
		<div
			class={cx(context.styles.itemControl, props.class)}
			data-scope="radio-group"
			data-part="item-control"
			data-state={isChecked ? "checked" : "unchecked"}
			data-disabled={item?.disabled ? "" : undefined}
		>
			{props.children}
		</div>
	);
}

export function ItemHiddenInput() {
	const context = useRadioGroupContext();
	const item = useContext(ItemContext);
	const isChecked = context.value === item?.value;

	return (
		<input
			type="radio"
			aria-hidden="true"
			tabIndex={-1}
			checked={isChecked}
			disabled={item?.disabled}
			name={context.id}
			value={item?.value}
			style={{
				border: "0px",
				clip: "rect(0px, 0px, 0px, 0px)",
				height: "1px",
				margin: "-1px",
				overflow: "hidden",
				padding: "0px",
				position: "absolute",
				width: "1px",
				whiteSpace: "nowrap",
				wordWrap: "normal",
			}}
		/>
	);
}

export interface RadioGroupItem {
	value: string;
	label: string | JSX.Element;
	disabled?: boolean;
	invalid?: boolean;
}

export interface RadioGroupStructureProps {
	items: (string | RadioGroupItem)[];
	indicator?: Child;
}

export const RadioGroupStructure = (props: RadioGroupStructureProps) => {
	const { items, indicator } = props;

	return (
		<>
			{indicator}
			{items.map((item) => {
				const normalizedItem =
					typeof item === "string" ? { value: item, label: item } : item;
				return (
					<Item
						key={normalizedItem.value}
						value={normalizedItem.value}
						disabled={normalizedItem.disabled}
						invalid={normalizedItem.invalid}
					>
						<ItemControl />
						<ItemText>{normalizedItem.label}</ItemText>
						<ItemHiddenInput />
					</Item>
				);
			})}
		</>
	);
};
