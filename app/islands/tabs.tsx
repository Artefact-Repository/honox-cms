import { useEffect, useRef, useState } from "hono/jsx";
import {
	InteractiveRoot,
	type RootProps,
	type TabsItem,
	TabsStructure,
	type TabsStructureProps,
} from "../components/ui/tabs-primitive";

export interface TabsIslandProps extends RootProps, TabsStructureProps {
	/** Notified after a tab is added; return a `TabsItem` to override the
	 * auto-generated default, or leave void to accept it. */
	onTabAdd?: () => TabsItem | void;
	onEdit?: (key: any, action: "add" | "remove") => void;
}

export default function TabsIsland(props: TabsIslandProps) {
	const {
		value: valueProp,
		defaultValue,
		onValueChange,
		children,
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

		activeKey,
		defaultActiveKey,
		onChange,
		onTabClick,
		onTabScroll,
		onEdit,
		classNames,
		styles,
		...rest
	} = props;

	// The server wrapper (`tabs.tsx`'s liftItemSlots) hoists every element-valued
	// item field into a dedicated `__slot_<index>_<field>` prop so HonoX carries
	// it through a live `<template>` slot instead of JSON-mangling the vnode.
	// Split those back out of `rest`: reassemble them into their items by index,
	// and keep them off `domRest` so they never leak onto the DOM root as stray
	// attributes.
	const slots: Record<string, unknown> = {};
	const domRest: Record<string, unknown> = {};
	for (const key in rest) {
		if (key.startsWith("__slot_")) {
			slots[key] = (rest as Record<string, unknown>)[key];
		} else {
			domRest[key] = (rest as Record<string, unknown>)[key];
		}
	}

	const hydratedItems = (items || []).map((item, index) => {
		let next = item;
		for (const field of ["label", "content", "children", "icon", "closeIcon"]) {
			const key = `__slot_${index}_${field}`;
			if (key in slots) {
				if (next === item) next = { ...item };
				(next as Record<string, unknown>)[field] = slots[key];
			}
		}
		return next;
	});

	// Normalize items
	const normalizedItems = hydratedItems.map((item) => {
		const val = item.value ?? item.key;
		const content = item.content ?? item.children;
		return {
			...item,
			value: val as string,
			content,
		};
	});

	// Resolve controlled/uncontrolled initial value; with no explicit signal,
	// default to the first enabled tab so something is always selected.
	const initialVal =
		activeKey !== undefined
			? activeKey
			: valueProp !== undefined
				? valueProp
				: defaultActiveKey !== undefined
					? defaultActiveKey
					: (defaultValue ??
						normalizedItems.find((item) => !item.disabled)?.value);

	const [value, setValue] = useState<string | undefined>(initialVal);
	const [tabItems, setTabItems] = useState<TabsItem[]>(normalizedItems);
	const rootRef = useRef<HTMLDivElement>(null);

	const updateIndicator = (activeTrigger: HTMLElement | null) => {
		const root = rootRef.current;
		if (!root) return;

		if (!activeTrigger) {
			root.style.setProperty("--width", "0px");
			root.style.setProperty("--height", "0px");
			return;
		}

		const rect = activeTrigger.getBoundingClientRect();
		const rootRect = root.getBoundingClientRect();

		let width = rect.width;
		let height = rect.height;
		let left = rect.left - rootRect.left;
		let top = rect.top - rootRect.top;

		// `indicator={{ size, align }}` shrinks the indicator relative to the
		// active trigger and aligns the remainder.
		const config = typeof indicator === "object" && indicator ? indicator : {};
		if (config.size !== undefined) {
			const vertical = root.getAttribute("data-orientation") === "vertical";
			const origin = vertical ? height : width;
			const size =
				typeof config.size === "function" ? config.size(origin) : config.size;
			const offset =
				config.align === "start"
					? 0
					: config.align === "end"
						? origin - size
						: (origin - size) / 2;
			if (vertical) {
				height = size;
				top += offset;
			} else {
				width = size;
				left += offset;
			}
		}

		root.style.setProperty("--width", `${width}px`);
		root.style.setProperty("--height", `${height}px`);
		root.style.setProperty("--left", `${left}px`);
		root.style.setProperty("--top", `${top}px`);
	};

	// `children` here is a pre-built static subtree (composed via
	// TabsList/TabsTrigger/TabsContent rather than the `items` prop): the
	// same vnode references flow through on every render, so hono/jsx never
	// re-invokes those component functions on state change and context-driven
	// `isSelected` recomputation never happens. Sync selection to the DOM
	// imperatively and synchronously wherever `value` changes, instead of via
	// a `[value]`-keyed effect — don't depend on a re-render to reflect it.
	const syncSelection = (newValue: string | undefined) => {
		const root = rootRef.current;
		if (!root) return;

		let activeTrigger: HTMLElement | null = null;
		root
			.querySelectorAll<HTMLElement>('[data-scope="tabs"][data-part="trigger"]')
			.forEach((trigger) => {
				const isSelected = trigger.getAttribute("data-value") === newValue;
				if (isSelected) activeTrigger = trigger;
				trigger.setAttribute("aria-selected", isSelected ? "true" : "false");
				trigger.tabIndex = isSelected ? 0 : -1;
				if (isSelected) trigger.setAttribute("data-selected", "");
				else trigger.removeAttribute("data-selected");
			});

		root
			.querySelectorAll<HTMLElement>('[data-scope="tabs"][data-part="content"]')
			.forEach((content) => {
				const isSelected = content.getAttribute("data-value") === newValue;
				content.hidden = !isSelected;
				if (isSelected) content.setAttribute("data-selected", "");
				else content.removeAttribute("data-selected");
			});

		updateIndicator(activeTrigger);
	};

	// Closing/adding tabs mutates the list itself, not just which value is
	// selected — that only works through the `items` API, where `TabsStructure`
	// is constructed fresh from this state on every render (unlike a static
	// `children` subtree, a freshly built element genuinely re-renders).
	// Find the trigger element whose `data-value` matches, without ever
	// interpolating the (arbitrary, user-supplied) value into a selector
	// string — mirrors the lookup style used by `syncSelection` below.
	const findTrigger = (targetValue: string | undefined) =>
		Array.from(
			rootRef.current?.querySelectorAll<HTMLElement>(
				'[data-scope="tabs"][data-part="trigger"]',
			) ?? [],
		).find((trigger) => trigger.getAttribute("data-value") === targetValue);

	const handleTabClose = (closedValue: string) => {
		// Closing a tab removes its DOM node; if focus was inside it (the close
		// button, almost always), that focus would otherwise fall back to
		// `<body>` and strand keyboard/screen-reader users. Capture the intent
		// before the state update tears the node down, then restore it to the
		// neighbor that takes over as active.
		const closedTrigger = findTrigger(closedValue);
		const shouldRefocus = !!(
			closedTrigger && closedTrigger.contains(document.activeElement)
		);

		setTabItems((prev) => {
			const closedIndex = prev.findIndex((item) => item.value === closedValue);
			const next = prev.filter((item) => item.value !== closedValue);
			const neighbor = next[Math.min(closedIndex, next.length - 1)];
			if (value === closedValue && neighbor) {
				setValue(neighbor.value);
				requestAnimationFrame(() => {
					syncSelection(neighbor.value);
					if (shouldRefocus) findTrigger(neighbor.value)?.focus();
				});
				onChange?.(neighbor.value);
				onValueChange?.(neighbor.value);
			}
			return next;
		});
		onTabClose?.(closedValue);
		onEdit?.(closedValue, "remove");
	};

	const handleTabAdd = () => {
		const created = onTabAdd?.();
		const newItem: TabsItem = created ?? {
			value: `tab-${Date.now()}`,
			label: `New Tab ${tabItems.length + 1}`,
			content: "",
			closable: true,
		};
		setTabItems((prev) => [...prev, newItem]);
		setValue(newItem.value);
		// Mirrors "open a new tab" convention elsewhere (browsers, editors):
		// move focus onto the tab that just became active.
		requestAnimationFrame(() => {
			syncSelection(newItem.value);
			findTrigger(newItem.value)?.focus();
		});
		onChange?.(newItem.value);
		onValueChange?.(newItem.value);
		onEdit?.("add" as any, "add");
	};

	useEffect(() => {
		const currentVal = activeKey !== undefined ? activeKey : valueProp;
		if (currentVal !== undefined) {
			setValue(currentVal);
			syncSelection(currentVal);
		}
	}, [activeKey, valueProp]);

	// Sync local items state with prop updates
	useEffect(() => {
		if (items) {
			setTabItems(normalizedItems);
		}
	}, [items]);

	// A trigger's own size can change without the tab list's box changing at
	// all — a narrower viewport wrapping a label, a webfont swap, a locale
	// string of different length — so the sliding indicator (measured in
	// absolute px) would otherwise drift out of place until the next click.
	// Re-observing on every `tabItems` change also keeps freshly added/closed
	// editable tabs covered.
	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;

		const triggers = Array.from(
			root.querySelectorAll<HTMLElement>(
				'[data-scope="tabs"][data-part="trigger"]',
			),
		);
		const observer = new ResizeObserver(() => {
			const active = triggers.find(
				(trigger) => trigger.getAttribute("data-selected") !== null,
			);
			updateIndicator(active ?? null);
		});
		for (const trigger of triggers) observer.observe(trigger);

		return () => observer.disconnect();
	}, [tabItems]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;

		requestAnimationFrame(() => syncSelection(value));

		const selectValue = (newValue: string | undefined) => {
			setValue(newValue);
			syncSelection(newValue);
			if (newValue !== undefined) {
				onValueChange?.(newValue);
				onChange?.(newValue);
			} else {
				onValueChange?.(undefined as unknown as string);
			}
		};

		const handleClick = (e: MouseEvent) => {
			const trigger = (e.target as HTMLElement).closest<HTMLElement>(
				'[data-scope="tabs"][data-part="trigger"]',
			);
			if (trigger && !trigger.hasAttribute("data-disabled")) {
				const newValue = trigger.getAttribute("data-value");
				if (newValue) {
					onTabClick?.(newValue, e);
					const alreadySelected =
						trigger.getAttribute("data-selected") !== null;
					if (alreadySelected && props.deselectable) {
						selectValue(undefined);
					} else {
						selectValue(newValue);
					}
				}
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const trigger = (e.target as HTMLElement).closest<HTMLElement>(
				'[data-scope="tabs"][data-part="trigger"]',
			);
			if (!trigger) return;

			// Closable tabs render as `<div role="tab">`, which has no native
			// Enter/Space activation (buttons synthesize a click themselves).
			if (
				(e.key === "Enter" || e.key === " ") &&
				trigger.tagName !== "BUTTON"
			) {
				const newValue = trigger.getAttribute("data-value");
				if (newValue && !trigger.hasAttribute("data-disabled")) {
					selectValue(newValue);
				}
				e.preventDefault();
				return;
			}

			const triggers = Array.from(
				root.querySelectorAll<HTMLElement>(
					'[data-scope="tabs"][data-part="trigger"]:not([data-disabled])',
				),
			);
			const index = triggers.indexOf(trigger);
			const vertical = root.getAttribute("data-orientation") === "vertical";
			// Horizontal layouts mirror in RTL, so Left/Right must swap meaning
			// too — honor an explicit `dir` prop, else fall back to whatever
			// direction actually got computed (an ancestor `<html dir="rtl">`).
			const rtl =
				!vertical && (props.dir ?? getComputedStyle(root).direction) === "rtl";
			const nextKey = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
			const prevKey = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
			const loopFocus = props.loopFocus ?? true;

			let nextIndex = -1;
			if (e.key === nextKey) {
				nextIndex = loopFocus
					? (index + 1) % triggers.length
					: Math.min(index + 1, triggers.length - 1);
			} else if (e.key === prevKey) {
				nextIndex = loopFocus
					? (index - 1 + triggers.length) % triggers.length
					: Math.max(index - 1, 0);
			} else if (e.key === "Home") {
				nextIndex = 0;
			} else if (e.key === "End") {
				nextIndex = triggers.length - 1;
			}

			const nextTrigger = nextIndex !== -1 ? triggers[nextIndex] : undefined;
			if (nextTrigger && nextIndex !== index) {
				nextTrigger.focus();
				if (props.activationMode !== "manual") {
					const newValue = nextTrigger.getAttribute("data-value");
					if (newValue) {
						selectValue(newValue);
					}
				}
				e.preventDefault();
			}
		};

		root.addEventListener("click", handleClick);
		root.addEventListener("keydown", handleKeyDown);

		// Notify scroll direction when an overflowing tab bar is scrolled.
		const list = root.querySelector<HTMLElement>(
			'[data-scope="tabs"][data-part="list"]',
		);
		let lastScrollLeft = list?.scrollLeft ?? 0;
		let lastScrollTop = list?.scrollTop ?? 0;
		const handleScroll = () => {
			if (!list) return;
			const deltaLeft = list.scrollLeft - lastScrollLeft;
			const deltaTop = list.scrollTop - lastScrollTop;
			lastScrollLeft = list.scrollLeft;
			lastScrollTop = list.scrollTop;
			if (deltaLeft === 0 && deltaTop === 0) return;
			const direction =
				Math.abs(deltaLeft) >= Math.abs(deltaTop)
					? deltaLeft > 0
						? "right"
						: "left"
					: deltaTop > 0
						? "bottom"
						: "top";
			onTabScroll?.({ direction });
		};
		if (onTabScroll && list) {
			list.addEventListener("scroll", handleScroll, { passive: true });
		}

		return () => {
			root.removeEventListener("click", handleClick);
			root.removeEventListener("keydown", handleKeyDown);
			if (onTabScroll && list) {
				list.removeEventListener("scroll", handleScroll);
			}
		};
		// Attached once at mount: handlers read fresh DOM state per event
		// rather than closed-over `value`, so they never go stale.
	}, []);

	return (
		<InteractiveRoot
			{...(domRest as RootProps)}
			value={value}
			onValueChange={(val) => {
				setValue(val);
				if (val !== undefined) {
					onChange?.(val);
					onValueChange?.(val);
				}
			}}
			rootRef={rootRef}
			data-hydrated="true"
			classNames={classNames}
			styles={styles}
		>
			{children || (
				<TabsStructure
					items={tabItems}
					indicator={indicator}
					closable={closable}
					editable={editable}
					hideAdd={hideAdd}
					onTabClose={handleTabClose}
					onTabAdd={handleTabAdd}
					addAriaLabel={addAriaLabel}
					extra={extra}
					tabBarExtraContent={tabBarExtraContent}
				/>
			)}
		</InteractiveRoot>
	);
}
