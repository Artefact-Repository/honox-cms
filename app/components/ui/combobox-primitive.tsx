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
import type { ComboboxVariantProps } from "styled-system/recipes";
import { combobox } from "styled-system/recipes";

type ComboboxStyles = ReturnType<typeof combobox>;

interface ComboboxContextValue {
	styles: ComboboxStyles;
	open: boolean;
	inputValue: string;
	highlightedIndex: number;
	items: ComboboxItem[];
	rootId: string;
	disabled?: boolean;
	invalid?: boolean;
	readOnly?: boolean;
	required?: boolean;
	onToggle?: () => void;
	onClose?: () => void;
	onInputChange?: (value: string) => void;
	onItemSelect?: (value: string) => void;
	setHighlightedIndex?: (index: number) => void;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

const useComboboxContext = () => {
	const context = useContext(ComboboxContext);
	return context;
};

export interface ComboboxItem {
	label: string;
	value: string;
	disabled?: boolean;
}

export interface RootProps extends ComboboxVariantProps, PropsWithChildren {
	open?: boolean;
	inputValue?: string;
	highlightedIndex?: number;
	items?: ComboboxItem[];
	disabled?: boolean;
	invalid?: boolean;
	readOnly?: boolean;
	required?: boolean;
	onToggle?: () => void;
	onClose?: () => void;
	onInputChange?: (value: string) => void;
	onItemSelect?: (value: string) => void;
	setHighlightedIndex?: (index: number) => void;
	class?: string;
	id?: string;
	style?: any;
	[key: string]: any;
}

export function Root(props: RootProps) {
	const [variantProps, localProps] = combobox.splitVariantProps(props);
	const {
		children,
		open = false,
		inputValue = "",
		highlightedIndex = -1,
		items = [],
		disabled,
		invalid,
		readOnly,
		required,
		onToggle,
		onClose,
		onInputChange,
		onItemSelect,
		setHighlightedIndex,
		class: classProp,
		style,
		id,
		...rest
	} = localProps;

	const styles = combobox(variantProps);
	const rootId = id || "combobox";

	return (
		<ComboboxContext.Provider
			value={{
				styles,
				open,
				inputValue,
				highlightedIndex,
				items,
				rootId,
				disabled,
				invalid,
				readOnly,
				required,
				onToggle,
				onClose,
				onInputChange,
				onItemSelect,
				setHighlightedIndex,
			}}
		>
			<div
				id={id}
				data-scope="combobox"
				data-part="root"
				class={cx(styles.root, classProp)}
				style={{ position: "relative", ...style }}
				{...rest}
			>
				{children}
			</div>
		</ComboboxContext.Provider>
	);
}

export function Label(
	props: PropsWithChildren<{ class?: string; htmlFor?: string }>,
) {
	const { children, class: classProp, htmlFor, ...rest } = props;
	const context = useComboboxContext();
	return (
		<label
			htmlFor={
				htmlFor || (context?.rootId ? `${context.rootId}-input` : undefined)
			}
			data-scope="combobox"
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
	const context = useComboboxContext();
	return (
		<div
			data-scope="combobox"
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

export function Input(props: any) {
	const { class: classProp, id, ...rest } = props;
	const context = useComboboxContext();
	return (
		<input
			id={id || (context?.rootId ? `${context.rootId}-input` : undefined)}
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={context?.open}
			aria-haspopup="listbox"
			data-scope="combobox"
			data-part="input"
			data-state={context?.open ? "open" : "closed"}
			data-disabled={context?.disabled ? "" : undefined}
			data-invalid={context?.invalid ? "" : undefined}
			data-readonly={context?.readOnly ? "" : undefined}
			aria-readonly={context?.readOnly}
			disabled={context?.disabled}
			required={context?.required}
			class={cx(context?.styles.input, classProp)}
			value={context?.inputValue}
			onInput={(e: Event) => {
				const value = (e.target as HTMLInputElement).value;
				context?.onInputChange?.(value);
			}}
			{...rest}
		/>
	);
}

export function Trigger(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useComboboxContext();
	return (
		<button
			type="button"
			aria-label="open"
			aria-haspopup="listbox"
			aria-expanded={context?.open}
			data-scope="combobox"
			data-part="trigger"
			data-state={context?.open ? "open" : "closed"}
			data-disabled={context?.disabled ? "" : undefined}
			data-invalid={context?.invalid ? "" : undefined}
			data-readonly={context?.readOnly ? "" : undefined}
			disabled={context?.disabled}
			class={cx(context?.styles.trigger, classProp)}
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
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<title>Open</title>
					<path d="m7 15 5 5 5-5" />
					<path d="m7 9 5-5 5 5" />
				</svg>
			)}
		</button>
	);
}

export function ClearTrigger(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useComboboxContext();
	return (
		<button
			type="button"
			aria-label="clear"
			data-scope="combobox"
			data-part="clear-trigger"
			data-disabled={context?.disabled ? "" : undefined}
			data-invalid={context?.invalid ? "" : undefined}
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
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<title>Clear</title>
					<path d="M18 6 6 18" />
					<path d="m6 6 12 12" />
				</svg>
			)}
		</button>
	);
}

export function IndicatorGroup(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useComboboxContext();
	return (
		<div
			data-scope="combobox"
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
	const context = useComboboxContext();
	return (
		<div
			data-scope="combobox"
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
	const context = useComboboxContext();
	return (
		<div
			data-scope="combobox"
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
	const context = useComboboxContext();
	return (
		<div
			role="listbox"
			data-scope="combobox"
			data-part="list"
			class={cx(context?.styles.list, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

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
	const context = useComboboxContext();
	const isHighlighted = context?.highlightedIndex === index;
	const isSelected = context?.inputValue === value;

	return (
		<div
			id={context?.rootId ? `${context.rootId}-item-${index}` : undefined}
			role="option"
			tabIndex={-1}
			aria-disabled={disabled}
			aria-selected={isSelected}
			data-scope="combobox"
			data-part="item"
			data-value={value}
			data-disabled={disabled ? "" : undefined}
			data-highlighted={isHighlighted ? "" : undefined}
			data-state={isSelected ? "checked" : "unchecked"}
			class={cx(context?.styles.item, classProp)}
			onClick={() => {
				if (!disabled) {
					context?.onItemSelect?.(value);
				}
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					if (!disabled) {
						context?.onItemSelect?.(value);
					}
					e.preventDefault();
				}
			}}
			{...rest}
		>
			{children}
		</div>
	);
}

export function ItemText(
	props: PropsWithChildren<{
		class?: string;
		index?: number;
		value?: string;
		disabled?: boolean;
	}>,
) {
	const { children, class: classProp, index, value, disabled, ...rest } = props;
	const context = useComboboxContext();
	const isHighlighted = context?.highlightedIndex === index;
	const isSelected = context?.inputValue === value;

	return (
		<span
			data-scope="combobox"
			data-part="item-text"
			data-state={isSelected ? "checked" : "unchecked"}
			data-disabled={disabled ? "" : undefined}
			data-highlighted={isHighlighted ? "" : undefined}
			class={cx(context?.styles.itemText, classProp)}
			{...rest}
		>
			{children}
		</span>
	);
}

export function ItemIndicator(
	props: PropsWithChildren<{ class?: string; value?: string }>,
) {
	const { children, class: classProp, value, ...rest } = props;
	const context = useComboboxContext();
	const isSelected = context?.inputValue === value;

	return (
		<div
			data-scope="combobox"
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
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<title>Selected</title>
					<path d="M20 6 9 17l-5-5" />
				</svg>
			)}
		</div>
	);
}

export function ItemGroup(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useComboboxContext();
	return (
		<div
			role="presentation"
			data-scope="combobox"
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
	const context = useComboboxContext();
	return (
		<div
			data-scope="combobox"
			data-part="item-group-label"
			class={cx(context?.styles.itemGroupLabel, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

export function Empty(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...rest } = props;
	const context = useComboboxContext();
	return (
		<div
			data-scope="combobox"
			data-part="empty"
			class={cx(context?.styles.empty, classProp)}
			{...rest}
		>
			{children}
		</div>
	);
}

export interface ComboboxFlattenedProps extends RootProps {
	items?: ComboboxItem[];
	label?: Child;
	placeholder?: string;
	allowClear?: boolean;
	closeOnSelect?: boolean;
}

export function ComboboxStructure(props: ComboboxFlattenedProps) {
	const { items = [], label, placeholder, allowClear, children } = props;
	const context = useComboboxContext();

	const filteredItems = items.filter((item) =>
		item.label.toLowerCase().includes(context?.inputValue.toLowerCase() || ""),
	);

	return (
		<>
			{label && <Label>{label}</Label>}
			<Control>
				<Input
					placeholder={placeholder}
					aria-controls={
						context?.rootId ? `${context.rootId}-listbox` : undefined
					}
					aria-activedescendant={
						context?.highlightedIndex !== undefined &&
						context.highlightedIndex >= 0 &&
						context?.rootId
							? `${context.rootId}-item-${context.highlightedIndex}`
							: undefined
					}
				/>
				<IndicatorGroup>
					{allowClear && <ClearTrigger />}
					<Trigger />
				</IndicatorGroup>
			</Control>
			<Positioner>
				<Content>
					<List id={context?.rootId ? `${context.rootId}-listbox` : undefined}>
						{filteredItems.length > 0 ? (
							filteredItems.map((item, index) => (
								<Item
									key={item.value}
									value={item.label}
									disabled={item.disabled}
									index={index}
								>
									<ItemText
										index={index}
										value={item.label}
										disabled={item.disabled}
									>
										{item.label}
									</ItemText>
									<ItemIndicator value={item.label} />
								</Item>
							))
						) : (
							<Empty>No results found</Empty>
						)}
					</List>
				</Content>
			</Positioner>
			{children}
		</>
	);
}

export interface InteractiveComboboxProps extends ComboboxFlattenedProps {
	id?: string;
}

export function InteractiveCombobox(props: InteractiveComboboxProps) {
	const {
		open: openProp,
		inputValue: inputValueProp,
		highlightedIndex: highlightedIndexProp,
		id: idProp,
		items = [],
		closeOnSelect = true,
		...rest
	} = props;
	const [isOpen, setIsOpen] = useState(openProp ?? false);
	const [inputValue, setInputValue] = useState(inputValueProp ?? "");
	const [highlightedIndex, setHighlightedIndex] = useState(
		highlightedIndexProp ?? -1,
	);

	const isControlled = openProp !== undefined;
	const open = isControlled ? openProp : isOpen;

	const filteredItems = items.filter((item) =>
		item.label.toLowerCase().includes(inputValue.toLowerCase()),
	);

	const fallbackId = useId();
	const rootId = idProp || `combobox-${fallbackId}`;

	const handleToggleRef = useRef<() => void>(() => {});
	const handleCloseRef = useRef<() => void>(() => {});
	const handleInputChangeRef = useRef<(val: string) => void>(() => {});
	const handleItemSelectRef = useRef<(val: string) => void>(() => {});

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

	const handleInputChange = (val: string) => {
		setInputValue(val);
		if (val && !open) {
			if (!isControlled) {
				setIsOpen(true);
			}
		}
		props.onInputChange?.(val);
	};

	const handleItemSelect = (val: string) => {
		setInputValue(val);
		setHighlightedIndex(-1);
		if (!isControlled) {
			setIsOpen(false);
		}
		props.onItemSelect?.(val);
	};

	const handleSetHighlightedIndex = (index: number) => {
		setHighlightedIndex(index);
	};

	const handleSetHighlightedIndexRef = useRef<(index: number) => void>(
		() => {},
	);

	// Store handlers in refs
	useEffect(() => {
		handleToggleRef.current = handleToggle;
		handleCloseRef.current = handleClose;
		handleInputChangeRef.current = handleInputChange;
		handleItemSelectRef.current = handleItemSelect;
		handleSetHighlightedIndexRef.current = handleSetHighlightedIndex;
	}, [
		handleToggle,
		handleClose,
		handleInputChange,
		handleItemSelect,
		handleSetHighlightedIndex,
	]);

	// Attach event listeners using event delegation
	useEffect(() => {
		const root = document.getElementById(rootId);
		if (!root) {
			console.error("InteractiveCombobox: root element not found:", rootId);
			return;
		}
		console.log("InteractiveCombobox: attaching event listeners for", rootId);

		const handleClick = (e: Event) => {
			const target = (e.target as HTMLElement).closest(
				"[data-part]",
			) as HTMLElement;
			if (!target) return;

			const dataPart = target.getAttribute("data-part");
			const isDisabled = target.hasAttribute("data-disabled");
			if (dataPart === "trigger") {
				const currentOpen = root.getAttribute("data-state") === "open";
				const nextOpen = !currentOpen;
				if (nextOpen) {
					const inputElement = root.querySelector(
						'[data-part="input"]',
					) as HTMLInputElement | null;
					if (inputElement) {
						inputElement.value = "";
						handleInputChangeRef.current("");
					}
				}
				handleToggleRef.current?.();
			} else if (dataPart === "clear-trigger") {
				const inputElement = root.querySelector(
					'[data-part="input"]',
				) as HTMLInputElement | null;
				if (inputElement) {
					inputElement.value = "";
					handleInputChangeRef.current("");
				}
			} else if (dataPart === "item" && !isDisabled) {
				const value = target.getAttribute("data-value") || "";
				const inputElement = root.querySelector(
					'[data-part="input"]',
				) as HTMLInputElement | null;
				if (inputElement) {
					inputElement.value = value;
					setInputValue(value);
				}
				handleItemSelectRef.current?.(value);
			}
		};

		const handleMouseOver = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest(
				'[data-part="item"]',
			) as HTMLElement;
			if (target && !target.hasAttribute("data-disabled")) {
				const items = Array.from(
					root.querySelectorAll('[data-part="item"]:not([data-disabled])'),
				);
				const index = items.indexOf(target);
				if (index !== -1) {
					handleSetHighlightedIndexRef.current(index);
				}
			}
		};

		// Attach event listeners
		root.addEventListener("click", handleClick);
		root.addEventListener("mouseover", handleMouseOver as any);

		// Handle input change for opening/closing
		const handleInputEvent = (e: Event) => {
			const input = e.target as HTMLInputElement;
			const value = input.value;
			handleInputChangeRef.current(value);
			handleSetHighlightedIndexRef.current(-1);
			if (value && root.getAttribute("data-state") !== "open") {
				handleToggleRef.current();
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const currentOpen = root.getAttribute("data-state") === "open";
			const items = Array.from(
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
						const next = prev + 1 >= items.length ? 0 : prev + 1;
						return next;
					});
				}
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				if (!currentOpen) {
					handleToggleRef.current();
					handleSetHighlightedIndexRef.current(items.length - 1);
				} else {
					setHighlightedIndex((prev) => {
						const next = prev - 1 < 0 ? items.length - 1 : prev - 1;
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
					handleSetHighlightedIndexRef.current(items.length - 1);
				}
			} else if (e.key === "Enter") {
				if (currentOpen) {
					const highlightedItem = root.querySelector(
						'[data-part="item"][data-highlighted]',
					) as HTMLElement | null;
					if (highlightedItem) {
						e.preventDefault();
						const value = highlightedItem.getAttribute("data-value") || "";
						const input = root.querySelector(
							'[data-part="input"]',
						) as HTMLInputElement;
						if (input) {
							input.value = value;
						}
						handleItemSelectRef.current(value);
					}
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

		const inputElement = root.querySelector(
			'[data-part="input"]',
		) as HTMLInputElement | null;
		if (inputElement) {
			inputElement.addEventListener("input", handleInputEvent);
			inputElement.addEventListener("keydown", handleKeyDown as any);
			inputElement.addEventListener("focus", handleFocus);
			inputElement.addEventListener("blur", handleBlur);
		}

		return () => {
			root.removeEventListener("click", handleClick);
			root.removeEventListener("mouseover", handleMouseOver as any);
			if (inputElement) {
				inputElement.removeEventListener("input", handleInputEvent);
				inputElement.removeEventListener("keydown", handleKeyDown as any);
				inputElement.removeEventListener("focus", handleFocus);
				inputElement.removeEventListener("blur", handleBlur);
			}
		};
	}, [rootId]);

	return (
		<Root
			id={rootId}
			data-state={open ? "open" : "closed"}
			{...rest}
			open={open}
			inputValue={inputValue}
			highlightedIndex={highlightedIndex}
			items={filteredItems}
			onToggle={handleToggle}
			onClose={handleClose}
			onInputChange={handleInputChange}
			onItemSelect={handleItemSelect}
			setHighlightedIndex={setHighlightedIndex}
		>
			<ComboboxStructure {...props} />
		</Root>
	);
}
