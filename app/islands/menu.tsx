import { useEffect, useId, useRef, useState } from "hono/jsx";
import { MenuRoot, type MenuRootProps } from "../components/ui/menu-primitive";

export default function InteractiveMenuRoot(props: MenuRootProps) {
	const { open: openProp, children, id: idProp, ...rest } = props;
	const [isOpen, setIsOpen] = useState(openProp ?? false);

	const fallbackId = useId();
	const rootId = idProp || `menu-${fallbackId}`;

	const rootRef = useRef<HTMLElement | null>(null);
	const triggerRef = useRef<HTMLElement | null>(null);
	const contentRef = useRef<HTMLElement | null>(null);
	const positionerRef = useRef<HTMLElement | null>(null);

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

	const getItems = () => {
		if (!contentRef.current) return [];
		return Array.from(
			contentRef.current.querySelectorAll<HTMLElement>(
				'[data-part="item"]:not([data-disabled]), [data-part="trigger-item"]:not([data-disabled])',
			),
		);
	};

	const updatePosition = (e?: MouseEvent) => {
		const trigger = triggerRef.current;
		const positioner = positionerRef.current;
		const content = contentRef.current;

		if (!positioner || !trigger) return;

		positioner.style.display = "block";
		positioner.style.position = "absolute";
		positioner.style.zIndex = "1000";

		const part = trigger.getAttribute("data-part");

		if (part === "context-trigger" && e) {
			// Context menu positioning
			let x = e.clientX;
			let y = e.clientY;

			const menuWidth = content?.offsetWidth || 200;
			const menuHeight = content?.offsetHeight || 200;

			if (x + menuWidth > window.innerWidth) x -= menuWidth;
			if (y + menuHeight > window.innerHeight) y -= menuHeight;

			positioner.style.top = `${y + window.scrollY}px`;
			positioner.style.left = `${x + window.scrollX}px`;
		} else if (part === "trigger-item") {
			// Submenu positioning
			const rect = trigger.getBoundingClientRect();
			let x = rect.right;
			const y = rect.top;

			const menuWidth = content?.offsetWidth || 200;
			if (x + menuWidth > window.innerWidth) {
				x = rect.left - menuWidth;
			}

			positioner.style.top = `${y + window.scrollY}px`;
			positioner.style.left = `${x + window.scrollX}px`;
		} else {
			// Regular menu positioning (dropdown)
			const rect = trigger.getBoundingClientRect();
			let x = rect.left;
			let y = rect.bottom;

			const menuWidth = content?.offsetWidth || 200;
			const menuHeight = content?.offsetHeight || 200;

			if (x + menuWidth > window.innerWidth) x = rect.right - menuWidth;
			if (y + menuHeight > window.innerHeight) y = rect.top - menuHeight;

			positioner.style.top = `${y + window.scrollY}px`;
			positioner.style.left = `${x + window.scrollX}px`;
		}
	};

	const handleOpen = (e?: MouseEvent) => {
		setIsOpen(true);
		setTimeout(() => {
			updatePosition(e);
			triggerRef.current?.setAttribute("aria-expanded", "true");
			triggerRef.current?.setAttribute("data-state", "open");
			contentRef.current?.setAttribute("data-state", "open");
			getItems()[0]?.focus();
		}, 0);
	};

	const handleClose = () => {
		setIsOpen(false);
		if (positionerRef.current) positionerRef.current.style.display = "none";
		triggerRef.current?.setAttribute("aria-expanded", "false");
		triggerRef.current?.setAttribute("data-state", "closed");
		contentRef.current?.setAttribute("data-state", "closed");
	};

	useEffect(() => {
		if (typeof document === "undefined") return;

		const root = rootRef.current;
		if (!root) return;

		const handleClick = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest("[data-part]");
			if (!target) return;

			const dataPart = target.getAttribute("data-part");

			if (dataPart === "trigger" || dataPart === "trigger-item") {
				if (isOpen) handleClose();
				else handleOpen(e);
			} else if (dataPart === "item") {
				handleClose();
				// Find top-level root to focus
				let p = root.parentElement;
				while (p && !p.id.startsWith("menu-")) p = p.parentElement;
				(p?.querySelector('[data-part="trigger"]') as HTMLElement)?.focus();
			}
		};

		const handleContextMenu = (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest(
				'[data-part="context-trigger"]',
			);
			if (target) {
				e.preventDefault();
				handleOpen(e);
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				!isOpen &&
				(e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
			) {
				if ((e.target as HTMLElement).closest('[data-part="trigger"]')) {
					handleOpen();
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
					(triggerRef.current as HTMLElement)?.focus();
					e.preventDefault();
				} else if (e.key === "ArrowDown") {
					const nextIndex = (currentIndex + 1) % items.length;
					items[nextIndex]?.focus();
					e.preventDefault();
				} else if (e.key === "ArrowUp") {
					const nextIndex = (currentIndex - 1 + items.length) % items.length;
					items[nextIndex]?.focus();
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
						(triggerRef.current as HTMLElement)?.focus();
						e.preventDefault();
					}
				} else if (e.key === "Home") {
					items[0]?.focus();
					e.preventDefault();
				} else if (e.key === "End") {
					items[items.length - 1]?.focus();
					e.preventDefault();
				}
			}
		};

		const handleClickOutside = (e: MouseEvent) => {
			if (isOpen && root && !root.contains(e.target as Node)) {
				handleClose();
			}
		};

		root.addEventListener("click", handleClick as any);
		root.addEventListener("contextmenu", handleContextMenu as any);
		root.addEventListener("keydown", handleKeyDown);
		window.addEventListener("mousedown", handleClickOutside);

		return () => {
			root.removeEventListener("click", handleClick as any);
			root.removeEventListener("contextmenu", handleContextMenu as any);
			root.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("mousedown", handleClickOutside);
		};
	}, [rootId, isOpen]);

	return (
		<div id={rootId} ref={rootRef} style={{ display: "contents" }}>
			<MenuRoot {...rest} open={isOpen} id={rootId}>
				{children}
			</MenuRoot>
		</div>
	);
}
