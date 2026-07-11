import {
	cloneElement,
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from "hono/jsx";
import { css, cx } from "styled-system/css";
import { popover } from "styled-system/recipes";
import { getFocusable, hasPart } from "./overlay-a11y";

type PopoverStyles = ReturnType<typeof popover>;

interface PopoverContextValue {
	id: string;
	open: boolean;
	styles: PopoverStyles;
	onClose?: () => void;
	onToggle?: () => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

const usePopoverContext = () => {
	const context = useContext(PopoverContext);
	return context;
};

export interface PopoverRootProps extends PropsWithChildren {
	id?: string;
	open?: boolean;
	onClose?: () => void;
	onToggle?: () => void;
	/** Close when Escape is pressed. Default: true. */
	closeOnEscape?: boolean;
	/** Close when interaction occurs outside the popover. Default: true. */
	closeOnInteractOutside?: boolean;
}

export function PopoverRoot(props: PopoverRootProps) {
	const { id: idProp, open = false, children, onClose, onToggle } = props;
	const autoId = useId();
	const id = idProp || autoId;
	const styles = popover();

	return (
		<PopoverContext.Provider value={{ id, open, styles, onClose, onToggle }}>
			{children}
		</PopoverContext.Provider>
	);
}

export interface PopoverTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
	[key: string]: unknown;
}

export function PopoverTrigger(props: PopoverTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = usePopoverContext();
	const id = context?.id;
	const open = context?.open;
	const styles = context?.styles;

	const triggerProps = {
		id: id ? `popover-trigger-${id}` : undefined,
		"aria-haspopup": "dialog",
		"aria-expanded": open ? "true" : "false",
		"aria-controls": open && id ? `popover-content-${id}` : undefined,
		"data-state": open ? "open" : "closed",
		"data-part": "trigger",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(styles?.trigger, classProp, child.props?.class),
		});
	}

	return (
		<button type="button" {...triggerProps}>
			{children}
		</button>
	);
}

export interface PopoverPositionerProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function PopoverPositioner(props: PopoverPositionerProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const open = context?.open;
	const styles = context?.styles;

	return (
		<div
			class={cx(
				styles?.positioner,
				classProp,
				!open && css({ display: "none" }),
			)}
			data-state={open ? "open" : "closed"}
			data-part="positioner"
			style={{
				position: "absolute",
				top: "100%",
				left: "0",
				zIndex: 1000,
			}}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface PopoverContentProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function PopoverContent(props: PopoverContentProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const id = context?.id;
	const open = context?.open;
	const styles = context?.styles;

	const titleId = id ? `popover-title-${id}` : undefined;
	const descriptionId = id ? `popover-description-${id}` : undefined;
	const titleRendered = hasPart(children, PopoverTitle);
	const hasDescription = hasPart(children, PopoverDescription);

	return (
		<div
			id={id ? `popover-content-${id}` : undefined}
			role="dialog"
			data-part="content"
			{...(titleRendered ? { "aria-labelledby": titleId } : {})}
			{...(hasDescription ? { "aria-describedby": descriptionId } : {})}
			class={cx(styles?.content, classProp)}
			data-state={open ? "open" : "closed"}
			tabIndex={-1}
			{...restProps}
		>
			{children}
		</div>
	);
}

export function PopoverHeader(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles;
	return (
		<header class={cx(styles?.header, classProp)} {...restProps}>
			{children}
		</header>
	);
}

export function PopoverBody(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles;
	return (
		<div class={cx(styles?.body, classProp)} {...restProps}>
			{children}
		</div>
	);
}

export function PopoverFooter(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles;
	return (
		<footer class={cx(styles?.footer, classProp)} {...restProps}>
			{children}
		</footer>
	);
}

export interface PopoverTitleProps extends PropsWithChildren {
	class?: string;
}

export function PopoverTitle(props: PopoverTitleProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const id = context?.id;
	const styles = context?.styles;
	return (
		<h2
			id={id ? `popover-title-${id}` : undefined}
			class={cx(styles?.title, classProp)}
			{...restProps}
		>
			{children}
		</h2>
	);
}

export interface PopoverDescriptionProps extends PropsWithChildren {
	class?: string;
}

export function PopoverDescription(props: PopoverDescriptionProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const id = context?.id;
	const styles = context?.styles;
	return (
		<p
			id={id ? `popover-description-${id}` : undefined}
			class={cx(styles?.description, classProp)}
			{...restProps}>
			{children}
		</p>
	);
}

export interface PopoverCloseTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
}

export function PopoverCloseTrigger(props: PopoverCloseTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles;

	const triggerProps = {
		"aria-label": "Close",
		"data-part": "close-trigger",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(styles?.closeTrigger, classProp, child.props?.class),
		});
	}

	return (
		<button
			type="button"
			class={cx(styles?.closeTrigger, classProp)}
			{...triggerProps}
		>
			{children}
		</button>
	);
}

export function PopoverArrow(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles;
	return (
		<div class={cx(styles?.arrow, classProp)} {...restProps}>
			{children}
		</div>
	);
}

export function PopoverArrowTip(props: { class?: string }) {
	const { class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles;
	return <div class={cx(styles?.arrowTip, classProp)} {...restProps} />;
}

export function InteractivePopoverRoot(props: PopoverRootProps) {
	const {
		open: openProp,
		children,
		id: idProp,
		closeOnEscape = true,
		closeOnInteractOutside = true,
		...rest
	} = props;
	const [isOpen, setIsOpen] = useState(openProp ?? false);

	const fallbackId = useId();
	const rootId = idProp || `popover-${fallbackId}`;
	const handleOpenChangeRef = useRef<(nextOpen: boolean) => void>(() => {});
	const closeOnEscapeRef = useRef(closeOnEscape);
	closeOnEscapeRef.current = closeOnEscape;
	const closeOnInteractOutsideRef = useRef(closeOnInteractOutside);
	closeOnInteractOutsideRef.current = closeOnInteractOutside;
	const prevFocusRef = useRef<HTMLElement | null>(null);

	const handleOpenChange = (nextOpen: boolean) => {
		setIsOpen(nextOpen);
	};

	useEffect(() => {
		handleOpenChangeRef.current = handleOpenChange;
	}, []);

	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}

		const root = document.getElementById(rootId);
		if (!root) {
			return;
		}

		// The effect body runs once per mount (see `useSliderContext`'s island /
		// `useOverlay` for the same convention elsewhere in this codebase) — state
		// updates do not re-run it, so "is it open right now" is read off the DOM
		// via `data-state` rather than captured in a closure that would go stale.
		const isCurrentlyOpen = () => root.getAttribute("data-state") === "open";

		const getPositioners = () =>
			Array.from(
				root.querySelectorAll<HTMLElement>('[data-part="positioner"]'),
			);

		const openPopover = () => {
			prevFocusRef.current = document.activeElement as HTMLElement | null;
			root.setAttribute("data-state", "open");
			getPositioners().forEach((p) => {
				p.style.cssText = "display: block !important;";
			});
			const content = root.querySelector<HTMLElement>(
				'[data-part="content"]',
			);
			if (content) {
				const focusable = getFocusable(content);
				(focusable[0] ?? content).focus();
			}
		};

		const closePopover = () => {
			root.setAttribute("data-state", "closed");
			getPositioners().forEach((p) => {
				p.style.cssText = "display: none !important;";
			});
			const trigger = root.querySelector<HTMLElement>('[data-part="trigger"]');
			(trigger ?? prevFocusRef.current)?.focus();
		};

		const handleClick = (e: Event) => {
			const target = e.target as HTMLElement;
			const dataPart = target.getAttribute("data-part");

			if (dataPart === "trigger") {
				const nextOpen = !isCurrentlyOpen();
				if (nextOpen) {
					openPopover();
				} else {
					closePopover();
				}
				handleOpenChangeRef.current?.(nextOpen);
			} else if (dataPart === "close-trigger") {
				closePopover();
				handleOpenChangeRef.current?.(false);
			}
		};

		const handleDocumentPointerDown = (e: Event) => {
			if (!isCurrentlyOpen() || !closeOnInteractOutsideRef.current) return;
			if (root.contains(e.target as Node)) return;
			closePopover();
			handleOpenChangeRef.current?.(false);
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				!isCurrentlyOpen() ||
				e.key !== "Escape" ||
				!closeOnEscapeRef.current
			)
				return;
			e.preventDefault();
			closePopover();
			handleOpenChangeRef.current?.(false);
		};

		if (isCurrentlyOpen()) openPopover();

		root.addEventListener("click", handleClick);
		document.addEventListener("mousedown", handleDocumentPointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			root.removeEventListener("click", handleClick);
			document.removeEventListener("mousedown", handleDocumentPointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [rootId]);

	return (
		<div id={rootId} data-state={isOpen ? "open" : "closed"}>
			<PopoverRoot {...rest} open={isOpen}>
				{children}
			</PopoverRoot>
		</div>
	);
}
