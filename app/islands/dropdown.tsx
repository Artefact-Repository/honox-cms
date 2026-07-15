import { useEffect, useId, useRef, useState } from "hono/jsx";
import {
	DropdownRoot,
	type DropdownRootProps,
} from "../components/ui/dropdown-primitive";

const ROOT_SELECTOR = '[data-scope="dropdown"][data-part="root"]';

export interface InteractiveDropdownRootProps extends DropdownRootProps {
	placement?: string;
	trigger?:
		| ("click" | "hover" | "contextDropdown")[]
		| "click"
		| "hover"
		| "contextDropdown";
	mouseEnterDelay?: number;
	mouseLeaveDelay?: number;
	arrow?: boolean;
}

export default function InteractiveDropdownRoot(
	props: InteractiveDropdownRootProps,
) {
	const {
		open: openProp,
		children,
		id: idProp,
		onOpenChange,
		onSelect,
		onClose,
		placement = "bottom-start",
		trigger: triggerMode = ["click"],
		mouseEnterDelay = 150,
		mouseLeaveDelay = 100,
		arrow,
		...rest
	} = props;
	const [isOpen, setIsOpen] = useState(openProp ?? false);

	const fallbackId = useId();
	const rootIdRef = useRef<string | null>(null);
	if (!rootIdRef.current) {
		rootIdRef.current = idProp || `dropdown-${fallbackId}`;
	}
	const rootId = rootIdRef.current;

	const rootRef = useRef<HTMLElement | null>(null);
	const triggerRef = useRef<HTMLElement | null>(null);
	const contentRef = useRef<HTMLElement | null>(null);
	const positionerRef = useRef<HTMLElement | null>(null);
	// Checked-state overrides applied on top of the server-rendered
	// checkbox/radio props, keyed by item value. Re-applied after re-renders,
	// which would otherwise reset the DOM to the initial props.
	const checkedOverridesRef = useRef<Map<string, boolean>>(new Map());

	const isOpenRef = useRef(isOpen);
	isOpenRef.current = isOpen;

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

	const normalizePlacement = (p: string): string => {
		switch (p) {
			case "bottomLeft":
				return "bottom-start";
			case "bottomRight":
				return "bottom-end";
			case "topLeft":
				return "top-start";
			case "topRight":
				return "top-end";
			case "leftTop":
				return "left-start";
			case "leftBottom":
				return "left-end";
			case "rightTop":
				return "right-start";
			case "rightBottom":
				return "right-end";
			case "bottomCenter":
				return "bottom";
			case "topCenter":
				return "top";
			case "leftCenter":
				return "left";
			case "rightCenter":
				return "right";
			default:
				return p;
		}
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

		let x = 0;
		let y = 0;

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
			// Dropdown: open relative to the trigger.
			const norm = normalizePlacement(placement);
			const rect = trigger.getBoundingClientRect();

			x = rect.left;
			y = rect.bottom + 4;

			if (norm.startsWith("bottom")) {
				y = rect.bottom + 4;
				if (norm === "bottom-start") {
					x = rect.left;
				} else if (norm === "bottom-end") {
					x = rect.right - menuWidth;
				} else {
					x = rect.left + rect.width / 2 - menuWidth / 2;
				}
			} else if (norm.startsWith("top")) {
				y = rect.top - menuHeight - 4;
				if (norm === "top-start") {
					x = rect.left;
				} else if (norm === "top-end") {
					x = rect.right - menuWidth;
				} else {
					x = rect.left + rect.width / 2 - menuWidth / 2;
				}
			} else if (norm.startsWith("left")) {
				x = rect.left - menuWidth - 4;
				if (norm === "left-start") {
					y = rect.top;
				} else if (norm === "left-end") {
					y = rect.bottom - menuHeight;
				} else {
					y = rect.top + rect.height / 2 - menuHeight / 2;
				}
			} else if (norm.startsWith("right")) {
				x = rect.right + 4;
				if (norm === "right-start") {
					y = rect.top;
				} else if (norm === "right-end") {
					y = rect.bottom - menuHeight;
				} else {
					y = rect.top + rect.height / 2 - menuHeight / 2;
				}
			}

			// Collision detection & auto-adjustment (flip alignment if it overflows)
			if (y < 0 && norm.startsWith("top")) {
				y = rect.bottom + 4;
			} else if (
				y + menuHeight > window.innerHeight &&
				norm.startsWith("bottom")
			) {
				y = rect.top - menuHeight - 4;
			}

			if (x < 0 && norm.startsWith("left")) {
				x = rect.right + 4;
			} else if (
				x + menuWidth > window.innerWidth &&
				norm.startsWith("right")
			) {
				x = rect.left - menuWidth - 4;
			}

			x = Math.max(0, Math.min(x, window.innerWidth - menuWidth));
			y = Math.max(0, Math.min(y, window.innerHeight - menuHeight));

			const arrowEl = rootRef.current?.querySelector<HTMLElement>(
				'[data-part="arrow"]',
			);
			if (arrowEl) {
				arrowEl.style.display = "block";
				if (norm.startsWith("bottom")) {
					arrowEl.style.top = "-6px";
					arrowEl.style.bottom = "auto";
					arrowEl.style.left =
						norm === "bottom-end"
							? "calc(100% - 24px)"
							: norm === "bottom-start"
								? "24px"
								: "calc(50% - 6px)";
					arrowEl.style.right = "auto";
					const tip = arrowEl.querySelector<HTMLElement>(
						'[data-part="arrow-tip"]',
					);
					if (tip) {
						tip.style.transform = "rotate(45deg)";
						tip.style.borderWidth = "1px 0 0 1px";
					}
				} else if (norm.startsWith("top")) {
					arrowEl.style.bottom = "-6px";
					arrowEl.style.top = "auto";
					arrowEl.style.left =
						norm === "top-end"
							? "calc(100% - 24px)"
							: norm === "top-start"
								? "24px"
								: "calc(50% - 6px)";
					arrowEl.style.right = "auto";
					const tip = arrowEl.querySelector<HTMLElement>(
						'[data-part="arrow-tip"]',
					);
					if (tip) {
						tip.style.transform = "rotate(225deg)";
						tip.style.borderWidth = "1px 0 0 1px";
					}
				} else if (norm.startsWith("left")) {
					arrowEl.style.right = "-6px";
					arrowEl.style.left = "auto";
					arrowEl.style.top =
						norm === "left-end"
							? "calc(100% - 24px)"
							: norm === "left-start"
								? "24px"
								: "calc(50% - 6px)";
					arrowEl.style.bottom = "auto";
					const tip = arrowEl.querySelector<HTMLElement>(
						'[data-part="arrow-tip"]',
					);
					if (tip) {
						tip.style.transform = "rotate(135deg)";
						tip.style.borderWidth = "1px 0 0 1px";
					}
				} else if (norm.startsWith("right")) {
					arrowEl.style.left = "-6px";
					arrowEl.style.right = "auto";
					arrowEl.style.top =
						norm === "right-end"
							? "calc(100% - 24px)"
							: norm === "right-start"
								? "24px"
								: "calc(50% - 6px)";
					arrowEl.style.bottom = "auto";
					const tip = arrowEl.querySelector<HTMLElement>(
						'[data-part="arrow-tip"]',
					);
					if (tip) {
						tip.style.transform = "rotate(315deg)";
						tip.style.borderWidth = "1px 0 0 1px";
					}
				}
			}
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
		if (isOpen) {
			applyCheckedOverrides();
			updatePosition();
		}
	}, [isOpen]);

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

		// State changes re-render the subtree from the original props; restore
		// any client-side checkbox/radio toggles.
		applyCheckedOverrides();

		const openTimer: any = null;
		const closeTimer: any = null;

		const clearTimers = () => {
			if (openTimer) clearTimeout(openTimer);
			if (closeTimer) clearTimeout(closeTimer);
		};

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
				if (isOpenRef.current) handleClose();
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

		const handleContextDropdown = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest<HTMLElement>(
				'[data-part="context-trigger"]',
			);
			if (target && ownsTarget(target)) {
				if (
					triggerActions.includes("contextDropdown") ||
					target.getAttribute("data-part") === "context-trigger"
				) {
					e.preventDefault();
					handleOpen(e);
				}
			}
		};

		const handleMouseOver = (e: MouseEvent) => {
			if (!isOpenRef.current) return;
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
				!isOpenRef.current &&
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

			if (isOpenRef.current) {
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
			if (isOpenRef.current && root && !root.contains(e.target as Node)) {
				handleClose();
			}
		};

		const handleReposition = () => {
			// Context menus are anchored to the pointer, not the trigger; leave
			// them where they opened.
			if (
				isOpenRef.current &&
				triggerRef.current?.getAttribute("data-part") !== "context-trigger"
			) {
				updatePosition();
			}
		};

		const handleScroll = () => {
			if (isOpenRef.current) {
				handleClose();
			}
		};

		root.addEventListener("click", handleClick);
		root.addEventListener("contextmenu", handleContextDropdown);
		root.addEventListener("mouseover", handleMouseOver);
		root.addEventListener("keydown", handleKeyDown);
		window.addEventListener("mousedown", handleClickOutside);
		window.addEventListener("scroll", handleScroll, true);
		window.addEventListener("resize", handleReposition);

		if (triggerActions.includes("hover") && triggerEl) {
			triggerEl.addEventListener("mouseenter", handleTriggerMouseEnter);
			triggerEl.addEventListener("mouseleave", handleTriggerMouseLeave);
			if (contentEl) {
				contentEl.addEventListener("mouseenter", handleContentMouseEnter);
				contentEl.addEventListener("mouseleave", handleContentMouseLeave);
			}
		}

		return () => {
			root.removeEventListener("click", handleClick as any);
			root.removeEventListener("contextmenu", handleContextDropdown as any);
			root.removeEventListener("mouseover", handleMouseOver as any);
			root.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("mousedown", handleClickOutside);
			window.removeEventListener("scroll", handleScroll, true);
			window.removeEventListener("resize", handleReposition);
			if (triggerActions.includes("hover") && triggerEl) {
				triggerEl.removeEventListener("mouseenter", handleTriggerMouseEnter);
				triggerEl.removeEventListener("mouseleave", handleTriggerMouseLeave);
				if (contentEl) {
					contentEl.removeEventListener("mouseenter", handleContentMouseEnter);
					contentEl.removeEventListener("mouseleave", handleContentMouseLeave);
				}
			}
			clearTimers();
		};
	}, [rootId]);

	return (
		<div
			id={rootId}
			ref={rootRef}
			data-scope="dropdown"
			data-part="root"
			style={{ display: "contents" }}
		>
			<DropdownRoot {...rest} open={isOpen} id={rootId} onClose={onClose}>
				{children}
			</DropdownRoot>
		</div>
	);
}
