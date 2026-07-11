import type { Child } from "hono/jsx";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from "hono/jsx";
import { cx } from "styled-system/css";
import type { SelectVariantProps } from "styled-system/recipes";
import { select } from "styled-system/recipes";

type SelectStyles = ReturnType<typeof select>;

interface SelectContextValue {
	styles: SelectStyles;
	open: boolean;
	selectedValues: string[];
	highlightedIndex: number;
	items: SelectItem[];
	rootId: string;
	multiple?: boolean;
	disabled?: boolean;
	invalid?: boolean;
	readOnly?: boolean;
	required?: boolean;
	name?: string;
	onToggle?: () => void;
	onClose?: () => void;
	onItemSelect?: (value: string) => void;
	setHighlightedIndex?: (index: number) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

export const useSelectContext = () => {
	const context = useContext(SelectContext);
	return context;
};

export interface SelectItem {
	label: string;
	value: string;
	disabled?: boolean;
}

export interface RootProps extends SelectVariantProps, PropsWithChildren {
	open?: boolean;
	selectedValues?: string[];
	highlightedIndex?: number;
	items?: SelectItem[];
	multiple?: boolean;
	disabled?: boolean;
	invalid?: boolean;
	readOnly?: boolean;
	required?: boolean;
	name?: string;
	onToggle?: () => void;
	onClose?: () => void;
	onItemSelect?: (value: string) => void;
	setHighlightedIndex?: (index: number) => void;
	class?: string;
	id?: string;
	style?: any;
	[key: string]: any;
}

export function Root(props: RootProps) {
	const [variantProps, localProps] = select.splitVariantProps(props);
	const {
		children,
		open = false,
		selectedValues = [],
		highlightedIndex = -1,
		items = [],
		multiple = false,
		disabled,
		invalid,
		readOnly,
		required,
		name,
		onToggle,
		onClose,
		onItemSelect,
		setHighlightedIndex,
		class: classProp,
		style,
		id,
		...rest
	} = localProps;

	const styles = select(variantProps);
	const rootId = id || "select";

	return (
		<SelectContext.Provider
			value={{
				styles,
				open,
				selectedValues,
				highlightedIndex,
				items,
				rootId,
				multiple,
				disabled,
				invalid,
				readOnly,
				required,
				name,
				onToggle,
				onClose,
				onItemSelect,
				setHighlightedIndex,
			}}
		>
			<div
				id={rootId}
				data-scope="select"
				data-part="root"
				class={cx(styles.root, classProp)}
				style={{ position: "relative", ...style }}
				{...rest}
			>
				{children}
			</div>
		</SelectContext.Provider>
	);
}

export function Label(
	props: PropsWithChildren<{ class?: string; htmlFor?: string }>,
) {
	const { children, class: classProp, htmlFor, ...rest } = props;
	const context = useSelectContext();
	return (
		<label
			htmlFor={
				htmlFor || (context?.rootId ? `${context.rootId}-trigger` : undefined)
			}
			data-scope="select"
			data-part="label"
			data-disabled={context?.disabled ? "" : undefined}
			data-invalid={context?.invalid ? "" : undefined}
			data-readonly={context?.readOnly ? "" : undefined}
			data-required={context?.required ? "" : undefined}
			class={cx(context?.styles.label, classProp)}
			{...rest}
		>
			{children}
		</label>
	);
}

export function Control(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	return (
		<div
			data-scope="select"
			data-part="control"
			data-state={context?.open ? "open" : "closed"}
			data-disabled={context?.disabled ? "" : undefined}
			data-invalid={context?.invalid ? "" : undefined}
			class={cx(context?.styles.control, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

export function Trigger(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	return (
		<button
			id={context?.rootId ? `${context.rootId}-trigger` : undefined}
			type="button"
			role="combobox"
			aria-haspopup="listbox"
			aria-expanded={context?.open}
			aria-controls={context?.rootId ? `${context.rootId}-listbox` : undefined}
			data-scope="select"
			data-part="trigger"
			data-state={context?.open ? "open" : "closed"}
			data-disabled={context?.disabled ? "" : undefined}
			data-invalid={context?.invalid ? "" : undefined}
			data-readonly={context?.readOnly ? "" : undefined}
			disabled={context?.disabled}
			class={cx(context?.styles.trigger, classProp)}
			{...rest}
		>
			{children}
		</button>
	);
}

export function ValueText(
	props: PropsWithChildren<{ class?: string; placeholder?: string }>,
) {
	const {
		children,
		class: classProp,
		placeholder = "Select option",
		...rest
	} = props;
	const context = useSelectContext();

	let textContent: Child = children;
	if (!textContent && context) {
		const selectedItems = context.items.filter((item) =>
			context.selectedValues.includes(item.value),
		);
		if (selectedItems.length > 0) {
			textContent = selectedItems.map((item) => item.label).join(", ");
		} else {
			textContent = placeholder;
		}
	}

	return (
		<span
			data-scope="select"
			data-part="value-text"
			class={cx(context?.styles.valueText, classProp)}
			{...rest}
		>
			{textContent}
		</span>
	);
}

export function Indicator(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	return (
		<div
			data-scope="select"
			data-part="indicator"
			class={cx(context?.styles.indicator, classProp)}
			{...rest}
		>
			{children || (
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
				>
					<title>Chevron</title>
					<path d="m7 15 5 5 5-5" />
					<path d="m7 9 5-5 5 5" />
				</svg>
			)}
		</div>
	);
}

export function IndicatorGroup(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	return (
		<div
			data-scope="select"
			data-part="indicator-group"
			class={cx(context?.styles.indicatorGroup, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

export function Positioner(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	return (
		<div
			data-scope="select"
			data-part="positioner"
			data-state={context?.open ? "open" : "closed"}
			class={cx(context?.styles.positioner, classProp)}
			style={{
				position: "absolute",
				top: "100%",
				left: "0",
				width: "100%",
				zIndex: 1000,
				display: context?.open ? "block" : "none",
			}}
			{...rest}
		>
			{children}
		</div>
	);
}

export function Content(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	return (
		<div
			data-scope="select"
			data-part="content"
			data-state={context?.open ? "open" : "closed"}
			class={cx(context?.styles.content, classProp)}
			style={{
				display: context?.open ? "flex" : "none",
				flexDirection: "column",
			}}
			{...rest}
		>
			{children}
		</div>
	);
}

export function List(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	return (
		<div
			role="listbox"
			id={context?.rootId ? `${context.rootId}-listbox` : undefined}
			aria-labelledby={
				context?.rootId ? `${context.rootId}-trigger` : undefined
			}
			data-scope="select"
			data-part="list"
			class={cx(context?.styles.list, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

export const ItemContext = createContext<{
	value: string;
	disabled?: boolean;
} | null>(null);

export function Item(
	props: PropsWithChildren<{
		value: string;
		disabled?: boolean;
		index?: number;
		class?: string;
		[key: string]: any;
	}>,
) {
	const { children, value, disabled, index, class: classProp, ...rest } = props;
	const context = useSelectContext();
	const isSelected = context?.selectedValues.includes(value) ?? false;
	const isHighlighted = context?.highlightedIndex === index;

	return (
		<ItemContext.Provider value={{ value, disabled }}>
			<div
				id={context?.rootId ? `${context.rootId}-item-${index}` : undefined}
				role="option"
				tabIndex={0}
				aria-selected={isSelected}
				aria-disabled={disabled}
				data-scope="select"
				data-part="item"
				data-value={value}
				data-disabled={disabled ? "" : undefined}
				data-highlighted={isHighlighted ? "" : undefined}
				data-state={isSelected ? "checked" : "unchecked"}
				class={cx(context?.styles.item, classProp)}
				{...rest}
			>
				{children}
			</div>
		</ItemContext.Provider>
	);
}

export function ItemText(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	const item = useContext(ItemContext);
	const isSelected = item
		? context?.selectedValues.includes(item.value)
		: false;

	return (
		<span
			data-scope="select"
			data-part="item-text"
			data-state={isSelected ? "checked" : "unchecked"}
			class={cx(context?.styles.itemText, classProp)}
			{...rest}
		>
			{children}
		</span>
	);
}

export function ItemIndicator(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	const item = useContext(ItemContext);
	const isSelected = item
		? context?.selectedValues.includes(item.value)
		: false;

	return (
		<div
			data-scope="select"
			data-part="item-indicator"
			data-state={isSelected ? "checked" : "unchecked"}
			class={cx(context?.styles.itemIndicator, classProp)}
			style={{ display: isSelected ? "inline-flex" : "none" }}
			{...rest}
		>
			{children || (
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
				>
					<title>Checked</title>
					<path d="M20 6 9 17l-5-5" />
				</svg>
			)}
		</div>
	);
}

export function ItemGroup(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	return (
		<div
			role="group"
			data-scope="select"
			data-part="item-group"
			class={cx(context?.styles.itemGroup, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

export function ItemGroupLabel(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	return (
		<div
			data-scope="select"
			data-part="item-group-label"
			class={cx(context?.styles.itemGroupLabel, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

export function ClearTrigger(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useSelectContext();
	return (
		<button
			type="button"
			aria-label="Clear selection"
			data-scope="select"
			data-part="clear-trigger"
			disabled={context?.disabled}
			class={cx(context?.styles.clearTrigger, classProp)}
			{...rest}
		>
			{children || (
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
				>
					<title>Clear</title>
					<path d="M18 6 6 18" />
					<path d="m6 6 12 12" />
				</svg>
			)}
		</button>
	);
}

export function HiddenSelect(props: { items?: SelectItem[] }) {
	const context = useSelectContext();
	const selectItems = props.items || context?.items || [];
	return (
		<select
			name={context?.name}
			multiple={context?.multiple}
			disabled={context?.disabled}
			required={context?.required}
			aria-hidden="true"
			tabIndex={-1}
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
		>
			{selectItems.map((item) => (
				<option
					key={item.value}
					value={item.value}
					selected={context?.selectedValues.includes(item.value)}
					disabled={item.disabled}
				>
					{item.label}
				</option>
			))}
		</select>
	);
}

export interface SelectFlattenedProps extends RootProps {
	items?: SelectItem[];
	label?: Child;
	placeholder?: string;
	allowClear?: boolean;
}

export function SelectStructure(props: SelectFlattenedProps) {
	const { items = [], label, placeholder, allowClear, children } = props;

	return (
		<>
			{label && <Label>{label}</Label>}
			<Control>
				<Trigger>
					<ValueText placeholder={placeholder} />
					<IndicatorGroup>
						{allowClear && <ClearTrigger />}
						<Indicator />
					</IndicatorGroup>
				</Trigger>
			</Control>
			<Positioner>
				<Content>
					<List>
						{items.map((item, index) => (
							<Item
								key={item.value}
								value={item.value}
								disabled={item.disabled}
								index={index}
							>
								<ItemText>{item.label}</ItemText>
								<ItemIndicator />
							</Item>
						))}
					</List>
				</Content>
			</Positioner>
			<HiddenSelect items={items} />
			{children}
		</>
	);
}

export interface InteractiveSelectProps extends SelectFlattenedProps {
	id?: string;
}

export function InteractiveSelect(props: InteractiveSelectProps) {
	const {
		open: openProp,
		selectedValues: selectedValuesProp,
		highlightedIndex: highlightedIndexProp,
		id: idProp,
		items = [],
		multiple = false,
		...rest
	} = props;

	const [isOpen, setIsOpen] = useState(openProp ?? false);
	const [selectedValues, setSelectedValues] = useState<string[]>(
		selectedValuesProp ?? [],
	);
	const [highlightedIndex, setHighlightedIndex] = useState(
		highlightedIndexProp ?? -1,
	);

	const isControlled = openProp !== undefined;
	const open = isControlled ? openProp : isOpen;

	const fallbackId = useId();
	const rootId = idProp || `select-${fallbackId}`;

	const handleToggleRef = useRef<() => void>(() => {});
	const handleCloseRef = useRef<() => void>(() => {});
	const handleItemSelectRef = useRef<(val: string) => void>(() => {});
	const handleClearRef = useRef<() => void>(() => {});
	const handleSetHighlightedIndexRef = useRef<(index: number) => void>(
		() => {},
	);

	const handleToggle = () => {
		if (!isControlled) {
			setIsOpen((prev) => !prev);
		}
	};

	const handleClose = () => {
		if (!isControlled) {
			setIsOpen(false);
		}
	};

	const handleItemSelect = (val: string) => {
		let nextValues: string[];
		if (multiple) {
			if (selectedValues.includes(val)) {
				nextValues = selectedValues.filter((v) => v !== val);
			} else {
				nextValues = [...selectedValues, val];
			}
		} else {
			nextValues = [val];
			if (!isControlled) {
				setIsOpen(false);
			}
		}
		setSelectedValues(nextValues);
		props.onItemSelect?.(val);
	};

	const handleClear = () => {
		setSelectedValues([]);
	};

	const handleSetHighlightedIndex = (index: number) => {
		setHighlightedIndex(index);
	};

	useEffect(() => {
		handleToggleRef.current = handleToggle;
		handleCloseRef.current = handleClose;
		handleItemSelectRef.current = handleItemSelect;
		handleClearRef.current = handleClear;
		handleSetHighlightedIndexRef.current = handleSetHighlightedIndex;
	}, [
		handleToggle,
		handleClose,
		handleItemSelect,
		handleClear,
		handleSetHighlightedIndex,
	]);

	// Attach event listeners using event delegation
	useEffect(() => {
		const root = document.getElementById(rootId);
		if (!root) {
			return;
		}

		const handleClick = (e: Event) => {
			const trigger = (e.target as HTMLElement).closest(
				'[data-part="trigger"]',
			);
			const item = (e.target as HTMLElement).closest('[data-part="item"]');
			const clearTrigger = (e.target as HTMLElement).closest(
				'[data-part="clear-trigger"]',
			);

			if (trigger) {
				handleToggleRef.current?.();
			} else if (clearTrigger) {
				handleClearRef.current?.();
				e.stopPropagation();
			} else if (item && !item.hasAttribute("data-disabled")) {
				const value = item.getAttribute("data-value") || "";
				handleItemSelectRef.current?.(value);
			}
		};

		const handleMouseOver = (e: MouseEvent) => {
			const item = (e.target as HTMLElement).closest('[data-part="item"]');
			if (item && !item.hasAttribute("data-disabled")) {
				const itemsList = Array.from(
					root.querySelectorAll('[data-part="item"]:not([data-disabled])'),
				);
				const index = itemsList.indexOf(item);
				if (index !== -1) {
					handleSetHighlightedIndexRef.current(index);
				}
			}
		};

		// Click outside handler
		const handleDocumentClick = (e: MouseEvent) => {
			if (!root.contains(e.target as Node)) {
				handleCloseRef.current?.();
			}
		};

		root.addEventListener("click", handleClick);
		root.addEventListener("mouseover", handleMouseOver as any);
		document.addEventListener("click", handleDocumentClick);

		const handleKeyDown = (e: KeyboardEvent) => {
			const currentOpen = root.getAttribute("data-state") === "open";
			const itemsList = Array.from(
				root.querySelectorAll<HTMLElement>(
					'[data-part="item"]:not([data-disabled])',
				),
			);

			if (e.key === "ArrowDown") {
				e.preventDefault();
				if (!currentOpen) {
					handleToggleRef.current();
					handleSetHighlightedIndexRef.current(0);
				} else {
					setHighlightedIndex((prev) => {
						const next = prev + 1 >= itemsList.length ? 0 : prev + 1;
						return next;
					});
				}
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				if (!currentOpen) {
					handleToggleRef.current();
					handleSetHighlightedIndexRef.current(itemsList.length - 1);
				} else {
					setHighlightedIndex((prev) => {
						const next = prev - 1 < 0 ? itemsList.length - 1 : prev - 1;
						return next;
					});
				}
			} else if (e.key === "Home") {
				if (currentOpen) {
					e.preventDefault();
					handleSetHighlightedIndexRef.current(0);
				}
			} else if (e.key === "End") {
				if (currentOpen) {
					e.preventDefault();
					handleSetHighlightedIndexRef.current(itemsList.length - 1);
				}
			} else if (e.key === "Enter" || e.key === " ") {
				if (currentOpen) {
					const highlightedItem = root.querySelector(
						'[data-part="item"][data-highlighted]',
					) as HTMLElement | null;
					if (highlightedItem) {
						e.preventDefault();
						const value = highlightedItem.getAttribute("data-value") || "";
						handleItemSelectRef.current(value);
					}
				} else if (e.key === "Enter") {
					handleToggleRef.current();
				}
			} else if (e.key === "Escape") {
				if (currentOpen) {
					e.preventDefault();
					handleCloseRef.current();
				}
			}
		};

		const handleFocus = () => {
			const control = root.querySelector(
				'[data-part="control"]',
			) as HTMLElement;
			if (control) control.setAttribute("data-focus", "");
		};

		const handleBlur = () => {
			const control = root.querySelector(
				'[data-part="control"]',
			) as HTMLElement;
			if (control) control.removeAttribute("data-focus");
		};

		const triggerElement = root.querySelector(
			'[data-part="trigger"]',
		) as HTMLElement | null;
		if (triggerElement) {
			triggerElement.addEventListener("keydown", handleKeyDown as any);
			triggerElement.addEventListener("focus", handleFocus);
			triggerElement.addEventListener("blur", handleBlur);
		}

		return () => {
			root.removeEventListener("click", handleClick);
			root.removeEventListener("mouseover", handleMouseOver as any);
			document.removeEventListener("click", handleDocumentClick);
			if (triggerElement) {
				triggerElement.removeEventListener("keydown", handleKeyDown as any);
				triggerElement.removeEventListener("focus", handleFocus);
				triggerElement.removeEventListener("blur", handleBlur);
			}
		};
	}, [rootId, multiple]);

	return (
		<Root
			id={rootId}
			data-state={open ? "open" : "closed"}
			{...rest}
			open={open}
			selectedValues={selectedValues}
			highlightedIndex={highlightedIndex}
			items={items}
			multiple={multiple}
			onToggle={handleToggle}
			onClose={handleClose}
			onItemSelect={handleItemSelect}
			setHighlightedIndex={setHighlightedIndex}
		>
			<SelectStructure {...props} />
		</Root>
	);
}
