import { css, cx } from "design-system/css";
import { popover } from "design-system/recipes";
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
import { getFocusable, hasPart } from "./overlay-a11y";

type PopoverPlacement = "top" | "bottom" | "left" | "right";

const ARROW_OFFSET = "16px";
const PLACEMENT_GAP = "var(--arrow-size)";

/** Base (non-flipped) positioner offset for each requested placement. */
function getPlacementStyle(placement: PopoverPlacement) {
	switch (placement) {
		case "top":
			return {
				top: "auto",
				bottom: "100%",
				left: "0",
				right: "auto",
				marginBottom: PLACEMENT_GAP,
				marginTop: "0",
			};
		case "left":
			return {
				top: "0",
				bottom: "auto",
				left: "auto",
				right: "100%",
				marginRight: PLACEMENT_GAP,
				marginLeft: "0",
			};
		case "right":
			return {
				top: "0",
				bottom: "auto",
				left: "100%",
				right: "auto",
				marginLeft: PLACEMENT_GAP,
				marginRight: "0",
			};
		default:
			return {
				top: "100%",
				bottom: "auto",
				left: "0",
				right: "auto",
				marginTop: PLACEMENT_GAP,
				marginBottom: "0",
			};
	}
}

/** Arrow inset from the positioner's aligned edge, per placement. */
function getArrowStyle(placement: PopoverPlacement) {
	switch (placement) {
		case "top":
			return {
				top: "auto",
				bottom: "calc(var(--arrow-size) * -0.5)",
				left: ARROW_OFFSET,
				right: "auto",
			};
		case "left":
			return {
				top: ARROW_OFFSET,
				bottom: "auto",
				left: "auto",
				right: "calc(var(--arrow-size) * -0.5)",
			};
		case "right":
			return {
				top: ARROW_OFFSET,
				bottom: "auto",
				left: "calc(var(--arrow-size) * -0.5)",
				right: "auto",
			};
		default:
			return {
				top: "calc(var(--arrow-size) * -0.5)",
				bottom: "auto",
				left: ARROW_OFFSET,
				right: "auto",
			};
	}
}

/** Diamond rotation that points the arrow tip back at the trigger. */
function getArrowRotation(placement: PopoverPlacement): number {
	switch (placement) {
		case "top":
			return 225;
		case "left":
			return 135;
		case "right":
			return 315;
		default:
			return 45;
	}
}

function getTransformOrigin(placement: PopoverPlacement): string {
	switch (placement) {
		case "top":
			return "bottom left";
		case "left":
			return "top right";
		case "right":
			return "top left";
		default:
			return "top left";
	}
}

/**
 * Resolves the effective placement and applies it to the positioner + arrow,
 * flipping to the opposite side when the requested placement would overflow
 * the viewport and the opposite side has more room. Also re-clamps the
 * cross axis (e.g. horizontal for a top/bottom placement) so the content
 * never renders off-screen, and re-runs on resize while open.
 */
function positionPopover(root: HTMLElement) {
	if (typeof window === "undefined") return;
	const gap = 8;
	const trigger = root.querySelector<HTMLElement>('[data-part="trigger"]');
	const triggerRect = trigger?.getBoundingClientRect();

	for (const positioner of root.querySelectorAll<HTMLElement>(
		'[data-part="positioner"]',
	)) {
		const preferred =
			(positioner.getAttribute("data-placement") as PopoverPlacement) ||
			"bottom";
		let placement = preferred;
		Object.assign(positioner.style, getPlacementStyle(placement));

		const content = positioner.querySelector<HTMLElement>(
			'[data-part="content"]',
		);
		const contentRect = (content ?? positioner).getBoundingClientRect();

		if (triggerRect) {
			const spaceBelow = window.innerHeight - triggerRect.bottom;
			const spaceAbove = triggerRect.top;
			const spaceRight = window.innerWidth - triggerRect.right;
			const spaceLeft = triggerRect.left;

			if (
				placement === "bottom" &&
				contentRect.height > spaceBelow - gap &&
				spaceAbove > spaceBelow
			) {
				placement = "top";
			} else if (
				placement === "top" &&
				contentRect.height > spaceAbove - gap &&
				spaceBelow > spaceAbove
			) {
				placement = "bottom";
			} else if (
				placement === "right" &&
				contentRect.width > spaceRight - gap &&
				spaceLeft > spaceRight
			) {
				placement = "left";
			} else if (
				placement === "left" &&
				contentRect.width > spaceLeft - gap &&
				spaceRight > spaceLeft
			) {
				placement = "right";
			}

			if (placement !== preferred) {
				Object.assign(positioner.style, getPlacementStyle(placement));
			}
		}

		// Clamp the cross axis so the content stays within the viewport.
		const rect = positioner.getBoundingClientRect();
		if (placement === "top" || placement === "bottom") {
			let shift = 0;
			const overflowRight = rect.right - (window.innerWidth - gap);
			if (overflowRight > 0) shift -= overflowRight;
			if (rect.left + shift < gap) shift += gap - (rect.left + shift);
			positioner.style.left = `${shift}px`;
			positioner.style.right = "auto";
		} else {
			let shift = 0;
			const overflowBottom = rect.bottom - (window.innerHeight - gap);
			if (overflowBottom > 0) shift -= overflowBottom;
			if (rect.top + shift < gap) shift += gap - (rect.top + shift);
			positioner.style.top = `${shift}px`;
			positioner.style.bottom = "auto";
		}

		positioner.setAttribute("data-effective-placement", placement);
		positioner.style.setProperty(
			"--transform-origin",
			getTransformOrigin(placement),
		);

		const arrow = positioner.querySelector<HTMLElement>('[data-part="arrow"]');
		if (arrow) {
			Object.assign(arrow.style, getArrowStyle(placement));
			const tip = arrow.querySelector<HTMLElement>('[data-part="arrow-tip"]');
			if (tip) {
				tip.style.transform = `rotate(${getArrowRotation(placement)}deg)`;
			}
		}
	}
}

type PopoverStyles = ReturnType<typeof popover>;

interface PopoverContextValue {
	id: string;
	open: boolean;
	styles: PopoverStyles;
	placement: PopoverPlacement;
	onClose?: () => void;
	onToggle?: () => void;
}

interface PopoverRootProps extends PropsWithChildren {
	id?: string;
	open?: boolean;
	onClose?: () => void;
	onToggle?: () => void;
	/** Which side of the trigger the content opens on. Default: "bottom". */
	placement?: PopoverPlacement;
	/** Close when Escape is pressed. Default: true. */
	closeOnEscape?: boolean;
	/** Close when interaction occurs outside the popover. Default: true. */
	closeOnInteractOutside?: boolean;
}

interface PopoverTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
	[key: string]: unknown;
}

interface PopoverPositionerProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

interface PopoverContentProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

interface PopoverTitleProps extends PropsWithChildren {
	class?: string;
}

interface PopoverDescriptionProps extends PropsWithChildren {
	class?: string;
}

interface PopoverCloseTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
}

interface PopoverAnchorProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
	[key: string]: unknown;
}

interface PopoverIndicatorProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
	[key: string]: unknown;
}

interface InteractivePopoverProps extends PopoverRootProps {
	defaultOpen?: boolean;
	onOpenChange?: (details: { open: boolean }) => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

const usePopoverContext = () => {
	const context = useContext(PopoverContext);
	return context;
};

function Root(props: PopoverRootProps) {
	const {
		id: idProp,
		open = false,
		placement = "bottom",
		children,
		onClose,
		onToggle,
	} = props;
	const autoId = useId();
	const id = idProp || autoId;
	const styles = popover();

	return (
		<PopoverContext.Provider
			value={{ id, open, styles, placement, onClose, onToggle }}
		>
			{children}
		</PopoverContext.Provider>
	);
}

function RootProvider(props: PopoverRootProps) {
	return <Root {...props} />;
}

function Anchor(props: PopoverAnchorProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles || popover();

	const anchorProps = {
		"data-scope": "popover",
		"data-part": "anchor",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...anchorProps,
			class: cx(styles.anchor, classProp, child.props?.class),
		});
	}

	return (
		<div class={cx(styles.anchor, classProp)} {...anchorProps}>
			{children}
		</div>
	);
}

function Trigger(props: PopoverTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = usePopoverContext();
	const id = context?.id;
	const open = context?.open;
	const styles = context?.styles || popover();

	const triggerProps = {
		id: id ? `popover-trigger-${id}` : undefined,
		"aria-haspopup": "dialog",
		"aria-expanded": open ? "true" : "false",
		"aria-controls": open && id ? `popover-content-${id}` : undefined,
		"data-state": open ? "open" : "closed",
		"data-scope": "popover",
		"data-part": "trigger",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(styles.trigger, classProp, child.props?.class),
		});
	}

	return (
		<button
			type="button"
			class={cx(styles.trigger, classProp)}
			{...triggerProps}
		>
			{children}
		</button>
	);
}

function Positioner(props: PopoverPositionerProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const open = context?.open;
	const styles = context?.styles || popover();
	const placement = context?.placement ?? "bottom";

	return (
		<div
			class={cx(
				styles.positioner,
				classProp,
				!open && css({ display: "none" }),
			)}
			data-state={open ? "open" : "closed"}
			data-scope="popover"
			data-part="positioner"
			data-placement={placement}
			style={{
				position: "absolute",
				zIndex: 1000,
				...getPlacementStyle(placement),
			}}
			{...restProps}
		>
			{children}
		</div>
	);
}

function Content(props: PopoverContentProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const id = context?.id;
	const open = context?.open;
	const styles = context?.styles || popover();

	const titleId = id ? `popover-title-${id}` : undefined;
	const descriptionId = id ? `popover-description-${id}` : undefined;
	const titleRendered = hasPart(children, Title);
	const hasDescription = hasPart(children, Description);

	return (
		<div
			id={id ? `popover-content-${id}` : undefined}
			role="dialog"
			data-scope="popover"
			data-part="content"
			{...(titleRendered ? { "aria-labelledby": titleId } : {})}
			{...(hasDescription ? { "aria-describedby": descriptionId } : {})}
			class={cx(styles.content, classProp)}
			data-state={open ? "open" : "closed"}
			tabIndex={-1}
			{...restProps}
		>
			{children}
		</div>
	);
}

function Header(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles || popover();
	return (
		<header
			class={cx(styles.header, classProp)}
			data-scope="popover"
			data-part="header"
			{...restProps}
		>
			{children}
		</header>
	);
}

function Body(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles || popover();
	return (
		<div
			class={cx(styles.body, classProp)}
			data-scope="popover"
			data-part="body"
			{...restProps}
		>
			{children}
		</div>
	);
}

function Footer(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles || popover();
	return (
		<footer
			class={cx(styles.footer, classProp)}
			data-scope="popover"
			data-part="footer"
			{...restProps}
		>
			{children}
		</footer>
	);
}

function Title(props: PopoverTitleProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const id = context?.id;
	const styles = context?.styles || popover();
	return (
		<h2
			id={id ? `popover-title-${id}` : undefined}
			class={cx(styles.title, classProp)}
			data-scope="popover"
			data-part="title"
			{...restProps}
		>
			{children}
		</h2>
	);
}

function Description(props: PopoverDescriptionProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const id = context?.id;
	const styles = context?.styles || popover();
	return (
		<p
			id={id ? `popover-description-${id}` : undefined}
			class={cx(styles.description, classProp)}
			data-scope="popover"
			data-part="description"
			{...restProps}
		>
			{children}
		</p>
	);
}

function CloseTrigger(props: PopoverCloseTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles || popover();

	const triggerProps = {
		"aria-label": "Close",
		"data-scope": "popover",
		"data-part": "close-trigger",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(styles.closeTrigger, classProp, child.props?.class),
		});
	}

	return (
		<button
			type="button"
			class={cx(styles.closeTrigger, classProp)}
			{...triggerProps}
		>
			{children}
		</button>
	);
}

function Arrow(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles || popover();
	const placement = context?.placement ?? "bottom";
	return (
		<div
			class={cx(styles.arrow, classProp)}
			data-scope="popover"
			data-part="arrow"
			style={getArrowStyle(placement)}
			{...restProps}
		>
			{children}
		</div>
	);
}

function ArrowTip(props: { class?: string }) {
	const { class: classProp, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles || popover();
	const placement = context?.placement ?? "bottom";
	return (
		<div
			class={cx(styles.arrowTip, classProp)}
			data-scope="popover"
			data-part="arrow-tip"
			style={{ transform: `rotate(${getArrowRotation(placement)}deg)` }}
			{...restProps}
		/>
	);
}

function Indicator(props: PopoverIndicatorProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = usePopoverContext();
	const styles = context?.styles || popover();
	const open = context?.open;

	const indicatorProps = {
		"data-scope": "popover",
		"data-part": "indicator",
		"data-state": open ? "open" : "closed",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...indicatorProps,
			class: cx(styles.indicator, classProp, child.props?.class),
		});
	}

	return (
		<div class={cx(styles.indicator, classProp)} {...indicatorProps}>
			{children}
		</div>
	);
}

function Context(props: { children: (context: any) => any }) {
	const context = usePopoverContext();
	return props.children(context);
}

function InteractivePopoverRoot(props: InteractivePopoverProps) {
	const {
		open: openProp,
		children,
		id: idProp,
		closeOnEscape = true,
		closeOnInteractOutside = true,
		defaultOpen,
		onOpenChange,
		...rest
	} = props;
	const [isOpen, setIsOpen] = useState(openProp ?? defaultOpen ?? false);
	const isControlled = openProp !== undefined;
	const open = isControlled ? openProp : isOpen;

	const fallbackId = useId();
	const rootId = idProp || `popover-${fallbackId}`;
	const handleOpenChangeRef = useRef<(nextOpen: boolean) => void>(() => {});
	const closeOnEscapeRef = useRef(closeOnEscape);
	closeOnEscapeRef.current = closeOnEscape;
	const closeOnInteractOutsideRef = useRef(closeOnInteractOutside);
	closeOnInteractOutsideRef.current = closeOnInteractOutside;
	const prevFocusRef = useRef<HTMLElement | null>(null);
	const isFirstRender = useRef(true);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!isControlled) {
			setIsOpen(nextOpen);
		}
		onOpenChange?.({ open: nextOpen });
	};

	useEffect(() => {
		handleOpenChangeRef.current = handleOpenChange;
	}, [isControlled, onOpenChange]);

	const showRef = useRef<() => void>(() => {});
	const hideRef = useRef<(shouldFocus?: boolean) => void>(() => {});

	// Sync the `open` prop/state into the DOM. Runs on every open/close,
	// whether triggered by a click inside the mount effect below or by a
	// controlled parent flipping the `open` prop directly.
	useEffect(() => {
		if (open) {
			showRef.current?.();
		} else {
			hideRef.current?.(!isFirstRender.current);
		}
		isFirstRender.current = false;
	}, [open]);

	// Single mount effect: defines show/hide once (assigned to the refs above)
	// and wires up click delegation, outside-dismiss, and Escape.
	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}

		const root = document.getElementById(rootId);
		if (!root) {
			return;
		}

		const isCurrentlyOpen = () => root.getAttribute("data-state") === "open";

		const show = () => {
			if (isCurrentlyOpen()) return;
			prevFocusRef.current = document.activeElement as HTMLElement | null;
			root.setAttribute("data-state", "open");
			const positioners = Array.from(
				root.querySelectorAll<HTMLElement>('[data-part="positioner"]'),
			);
			positioners.forEach((p) => {
				p.style.setProperty("display", "block", "important");
				p.setAttribute("data-state", "open");
			});
			positionPopover(root);
			const content = root.querySelector<HTMLElement>('[data-part="content"]');
			if (content) {
				content.setAttribute("data-state", "open");
				const focusable = getFocusable(content);
				(focusable[0] ?? content).focus();
			}
			const trigger = root.querySelector<HTMLElement>('[data-part="trigger"]');
			if (trigger) {
				trigger.setAttribute("data-state", "open");
				trigger.setAttribute("aria-expanded", "true");
			}
			const indicators = root.querySelectorAll<HTMLElement>(
				'[data-part="indicator"]',
			);
			indicators.forEach((i) => {
				i.setAttribute("data-state", "open");
			});
		};

		const hide = (shouldFocus = true) => {
			if (!isCurrentlyOpen()) return;
			root.setAttribute("data-state", "closed");
			const positioners = Array.from(
				root.querySelectorAll<HTMLElement>('[data-part="positioner"]'),
			);
			positioners.forEach((p) => {
				p.style.setProperty("display", "none", "important");
				p.setAttribute("data-state", "closed");
			});
			const content = root.querySelector<HTMLElement>('[data-part="content"]');
			if (content) {
				content.setAttribute("data-state", "closed");
			}
			const trigger = root.querySelector<HTMLElement>('[data-part="trigger"]');
			if (trigger) {
				trigger.setAttribute("data-state", "closed");
				trigger.setAttribute("aria-expanded", "false");
			}
			const indicators = root.querySelectorAll<HTMLElement>(
				'[data-part="indicator"]',
			);
			indicators.forEach((i) => {
				i.setAttribute("data-state", "closed");
			});
			if (shouldFocus) {
				(trigger ?? prevFocusRef.current)?.focus();
			}
		};

		showRef.current = show;
		hideRef.current = hide;

		if (open) {
			show();
		}

		const handleClick = (e: Event) => {
			const target = (e.target as HTMLElement).closest(
				"[data-part]",
			) as HTMLElement;
			if (!target) return;
			const dataPart = target.getAttribute("data-part");

			if (dataPart === "trigger") {
				const nextOpen = !isCurrentlyOpen();
				if (nextOpen) {
					show();
				} else {
					hide();
				}
				handleOpenChangeRef.current?.(nextOpen);
			} else if (dataPart === "close-trigger") {
				hide();
				handleOpenChangeRef.current?.(false);
			}
		};

		const handleDocumentPointerDown = (e: Event) => {
			if (!isCurrentlyOpen() || !closeOnInteractOutsideRef.current) return;
			if (root.contains(e.target as Node)) return;
			hide();
			handleOpenChangeRef.current?.(false);
		};

		// Keyboard "light dismiss": tabbing away from the popover onto
		// something outside it closes it, mirroring the pointer-based
		// outside-dismiss above for keyboard-only users.
		const handleFocusOut = (e: FocusEvent) => {
			if (!isCurrentlyOpen() || !closeOnInteractOutsideRef.current) return;
			const next = e.relatedTarget as Node | null;
			if (next && root.contains(next)) return;
			hide();
			handleOpenChangeRef.current?.(false);
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isCurrentlyOpen() || e.key !== "Escape" || !closeOnEscapeRef.current)
				return;
			e.preventDefault();
			hide();
			handleOpenChangeRef.current?.(false);
		};

		const handleResize = () => {
			if (isCurrentlyOpen()) {
				positionPopover(root);
			}
		};

		root.addEventListener("click", handleClick);
		root.addEventListener("focusout", handleFocusOut);
		document.addEventListener("mousedown", handleDocumentPointerDown);
		document.addEventListener("keydown", handleKeyDown);
		window.addEventListener("resize", handleResize);

		return () => {
			root.removeEventListener("click", handleClick);
			root.removeEventListener("focusout", handleFocusOut);
			document.removeEventListener("mousedown", handleDocumentPointerDown);
			document.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("resize", handleResize);
		};
	}, [rootId]);

	return (
		<div
			id={rootId}
			data-state={open ? "open" : "closed"}
			style={{ position: "relative", display: "inline-block" }}
		>
			<Root {...rest} open={open}>
				{children}
			</Root>
		</div>
	);
}

export type {
	InteractivePopoverProps,
	PopoverAnchorProps,
	PopoverCloseTriggerProps,
	PopoverContentProps,
	PopoverContextValue,
	PopoverDescriptionProps,
	PopoverIndicatorProps,
	PopoverPlacement,
	PopoverPositionerProps,
	PopoverRootProps,
	PopoverStyles,
	PopoverTitleProps,
	PopoverTriggerProps,
};
export {
	Anchor,
	Arrow,
	ArrowTip,
	Body,
	CloseTrigger,
	Content,
	Context,
	Description,
	Footer,
	Header,
	Indicator,
	InteractivePopoverRoot,
	Positioner,
	Root,
	RootProvider,
	Title,
	Trigger,
};
