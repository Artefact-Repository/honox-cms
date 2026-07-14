import { useEffect, useId, useRef, useState } from "hono/jsx";
import { MenuRoot, type MenuRootProps } from "../components/ui/menu-primitive";

const ROOT_SELECTOR = '[data-scope="menu"][data-part="root"]';

export default function InteractiveMenuRoot(props: MenuRootProps) {
	const {
		open: openProp,
		children,
		id: idProp,
		onOpenChange,
		onSelect,
		onClose,
		...rest
	} = props;
	const [isOpen, setIsOpen] = useState(openProp ?? false);

	const fallbackId = useId();
	const rootId = idProp || `menu-${fallbackId}`;

	const rootRef = useRef<HTMLElement | null>(null);
	const triggerRef = useRef<HTMLElement | null>(null);
	const contentRef = useRef<HTMLElement | null>(null);
	const positionerRef = useRef<HTMLElement | null>(null);
	// Checked-state overrides applied on top of the server-rendered
	// checkbox/radio props, keyed by item value. Re-applied after re-renders,
	// which would otherwise reset the DOM to the initial props.
	const checkedOverridesRef = useRef<Map<string, boolean>>(new Map());

	// Update refs after render
	useEffect(() => {
		if (typeof document === "undefined") return;

		const root = document.getElementById(rootId);
		if (!root) return;

		rootRef.current = root;
		triggerRef.current = root.querySelector<HTMLElement>(
			'[data-part="trigger"], [data-part="context-trigger"], [data-part="trigger-item"]',
		);
		contentRef.current = root.querySelector<HTMLElement>(
			'[data-part="content"]',
		);
		positionerRef.current = root.querySelector<HTMLElement>(
			'[data-part="positioner"]',
		);
	}, [rootId]);

	// Items that belong to this menu level (submenu items live in their own
	// nested content and are handled by their own island).
	const getItems = () => {
		const content = contentRef.current;
		if (!content) return [];
		return Array.from(
			content.querySelectorAll<HTMLElement>(
				'[data-part="item"]:not([data-disabled]), [data-part="trigger-item"]:not([data-disabled])',
			),
		).filter((el) => el.closest('[data-part="content"]') === content);
	};

	const ownsTarget = (el: HTMLElement) =>
		el.closest(ROOT_SELECTOR)?.id === rootId;

	const setItemChecked = (item: HTMLElement, checked: boolean) => {
		item.setAttribute("aria-checked", String(checked));
		item.setAttribute("data-state", checked ? "checked" : "unchecked");
		item
			.querySelector('[data-part="item-indicator"]')
			?.setAttribute("data-state", checked ? "checked" : "unchecked");
		const value = item.getAttribute("data-value");
		if (value) {
			checkedOverridesRef.current.set(value, checked);
		}
	};

	const toggleChecked = (item: HTMLElement, role: string) => {
		if (role === "menuitemcheckbox") {
			setItemChecked(item, item.getAttribute("aria-checked") !== "true");
		} else {
			// Radio: check this item, uncheck its group siblings.
			const scope =
				item.closest<HTMLElement>('[data-part="item-group"]') ||
				contentRef.current;
			scope
				?.querySelectorAll<HTMLElement>('[role="menuitemradio"]')
				.forEach((el) => {
					setItemChecked(el, el === item);
				});
		}
	};

	const applyCheckedOverrides = () => {
		const content = contentRef.current;
		if (!content) return;
		checkedOverridesRef.current.forEach((checked, value) => {
			const item = content.querySelector<HTMLElement>(
				`[data-part="item"][data-value="${CSS.escape(value)}"]`,
			);
			if (item?.getAttribute("role")?.startsWith("menuitem")) {
				item.setAttribute("aria-checked", String(checked));
				item.setAttribute("data-state", checked ? "checked" : "unchecked");
				item
					.querySelector('[data-part="item-indicator"]')
					?.setAttribute("data-state", checked ? "checked" : "unchecked");
			}
		});
	};

	const updatePosition = (e?: MouseEvent) => {
		const trigger = triggerRef.current;
		const positioner = positionerRef.current;
		const content = contentRef.current;

		if (!positioner || !trigger) return;

		positioner.style.display = "block";
		positioner.style.position = "fixed";
		positioner.style.zIndex = "1000";

		const part = trigger.getAttribute("data-part");
		const menuWidth = content?.offsetWidth || 200;
		const menuHeight = content?.offsetHeight || 200;

		let x: number;
		let y: number;

		if (part === "context-trigger" && e) {
			// Context menu: open at the pointer.
			x = e.clientX;
			y = e.clientY;
			if (x + menuWidth > window.innerWidth) x -= menuWidth;
			if (y + menuHeight > window.innerHeight) y -= menuHeight;
		} else if (part === "trigger-item") {
			// Submenu: open beside its trigger item.
			const rect = trigger.getBoundingClientRect();
			x = rect.right;
			y = rect.top;
			if (x + menuWidth > window.innerWidth) x = rect.left - menuWidth;
			if (y + menuHeight > window.innerHeight) {
				y = Math.max(0, window.innerHeight - menuHeight);
			}
		} else {
			// Dropdown: open below the trigger, flip above when it overflows.
			const rect = trigger.getBoundingClientRect();
			x = rect.left;
			y = rect.bottom + 4;
			if (x + menuWidth > window.innerWidth) x = rect.right - menuWidth;
			if (y + menuHeight > window.innerHeight) y = rect.top - menuHeight - 4;
		}

		positioner.style.top = `${Math.max(0, y)}px`;
		positioner.style.left = `${Math.max(0, x)}px`;
	};

	const handleOpen = (
		e?: MouseEvent,
		focusItem: "first" | "last" = "first",
	) => {
		setIsOpen(true);
		onOpenChange?.(true);
		setTimeout(() => {
			applyCheckedOverrides();
			updatePosition(e);
			const items = getItems();
			(focusItem === "last" ? items[items.length - 1] : items[0])?.focus();
		}, 0);
	};

	const handleClose = () => {
		setIsOpen(false);
		if (positionerRef.current) positionerRef.current.style.display = "none";
		onOpenChange?.(false);
		onClose?.();
	};

	useEffect(() => {
		if (typeof document === "undefined") return;

		const root = rootRef.current;
		if (!root) return;

		// State changes re-render the subtree from the original props; restore
		// any client-side checkbox/radio toggles.
		applyCheckedOverrides();
		if (isOpen) updatePosition();

		const handleClick = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest<HTMLElement>(
				"[data-part]",
			);
			if (!target) return;

			const dataPart = target.getAttribute("data-part");

			if (dataPart === "trigger" || dataPart === "trigger-item") {
				// Only the menu level owning this trigger reacts; a submenu's
				// trigger-item bubbles through ancestor roots.
				if (!ownsTarget(target) || target.hasAttribute("data-disabled")) {
					return;
				}
				if (isOpen) handleClose();
				else handleOpen(e);
			} else if (dataPart === "item") {
				if (target.hasAttribute("data-disabled")) return;
				const role = target.getAttribute("role") || "";
				const value = target.getAttribute("data-value") || "";

				if (role === "menuitemcheckbox" || role === "menuitemradio") {
					// Toggle in place and keep the menu open.
					if (ownsTarget(target)) {
						toggleChecked(target, role);
						onSelect?.(value);
					}
					return;
				}

				// A regular item closes every menu level it bubbles through.
				if (ownsTarget(target)) {
					onSelect?.(value);
				}
				handleClose();
				if (triggerRef.current?.getAttribute("data-part") === "trigger") {
					triggerRef.current.focus();
				}
			}
		};

		const handleContextMenu = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest<HTMLElement>(
				'[data-part="context-trigger"]',
			);
			if (target && ownsTarget(target)) {
				e.preventDefault();
				handleOpen(e);
			}
		};

		const handleMouseOver = (e: MouseEvent) => {
			if (!isOpen) return;
			const item = (e.target as HTMLElement).closest<HTMLElement>(
				'[data-part="item"], [data-part="trigger-item"]',
			);
			if (
				item &&
				!item.hasAttribute("data-disabled") &&
				item.closest('[data-part="content"]') === contentRef.current
			) {
				item.focus();
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const eventTarget = e.target as HTMLElement;
			if (eventTarget.closest(ROOT_SELECTOR)?.id !== rootId) return;

			if (
				!isOpen &&
				(e.key === "Enter" ||
					e.key === " " ||
					e.key === "ArrowDown" ||
					e.key === "ArrowUp")
			) {
				if (eventTarget.closest('[data-part="trigger"]')) {
					handleOpen(undefined, e.key === "ArrowUp" ? "last" : "first");
					e.preventDefault();
				}
				return;
			}

			if (isOpen) {
				const items = getItems();
				const currentIndex = items.indexOf(
					document.activeElement as HTMLElement,
				);

				if (e.key === "Escape") {
					handleClose();
					triggerRef.current?.focus();
					e.preventDefault();
					e.stopPropagation();
				} else if (e.key === "Tab") {
					handleClose();
				} else if (e.key === "ArrowDown") {
					items[(currentIndex + 1) % items.length]?.focus();
					e.preventDefault();
				} else if (e.key === "ArrowUp") {
					items[(currentIndex - 1 + items.length) % items.length]?.focus();
					e.preventDefault();
				} else if (e.key === "ArrowRight") {
					const currentItem = document.activeElement as HTMLElement;
					if (currentItem?.getAttribute("data-part") === "trigger-item") {
						currentItem.click();
						e.preventDefault();
					}
				} else if (e.key === "ArrowLeft") {
					if (
						triggerRef.current?.getAttribute("data-part") === "trigger-item"
					) {
						handleClose();
						triggerRef.current?.focus();
						e.preventDefault();
						e.stopPropagation();
					}
				} else if (e.key === "Home") {
					items[0]?.focus();
					e.preventDefault();
				} else if (e.key === "End") {
					items[items.length - 1]?.focus();
					e.preventDefault();
				} else if (e.key === "Enter" || e.key === " ") {
					const currentItem = document.activeElement as HTMLElement;
					if (items.includes(currentItem)) {
						currentItem.click();
						e.preventDefault();
					}
				}
			}
		};

		const handleClickOutside = (e: MouseEvent) => {
			if (isOpen && root && !root.contains(e.target as Node)) {
				handleClose();
			}
		};

		const handleReposition = () => {
			// Context menus are anchored to the pointer, not the trigger; leave
			// them where they opened.
			if (triggerRef.current?.getAttribute("data-part") !== "context-trigger") {
				updatePosition();
			}
		};

		root.addEventListener("click", handleClick as any);
		root.addEventListener("contextmenu", handleContextMenu as any);
		root.addEventListener("mouseover", handleMouseOver as any);
		root.addEventListener("keydown", handleKeyDown);
		window.addEventListener("mousedown", handleClickOutside);
		if (isOpen) {
			window.addEventListener("scroll", handleReposition, true);
			window.addEventListener("resize", handleReposition);
		}

		return () => {
			root.removeEventListener("click", handleClick as any);
			root.removeEventListener("contextmenu", handleContextMenu as any);
			root.removeEventListener("mouseover", handleMouseOver as any);
			root.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("mousedown", handleClickOutside);
			window.removeEventListener("scroll", handleReposition, true);
			window.removeEventListener("resize", handleReposition);
		};
	}, [rootId, isOpen]);

	return (
		<div
			id={rootId}
			ref={rootRef}
			data-scope="menu"
			data-part="root"
			style={{ display: "contents" }}
		>
			<MenuRoot {...rest} open={isOpen} id={rootId} onClose={onClose}>
				{children}
			</MenuRoot>
		</div>
	);
}
