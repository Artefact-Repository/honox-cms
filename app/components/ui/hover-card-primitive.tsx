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
import { hoverCard } from "styled-system/recipes";

type HoverCardStyles = ReturnType<typeof hoverCard>;

interface HoverCardContextValue {
	id: string;
	open: boolean;
	styles: HoverCardStyles;
}

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

const useHoverCardContext = () => {
	const context = useContext(HoverCardContext);
	return context;
};

export interface HoverCardRootProps extends PropsWithChildren {
	id?: string;
	open?: boolean;
	openDelay?: number;
	closeDelay?: number;
}

export function HoverCardRoot(props: HoverCardRootProps) {
	const { id: idProp, open = false, children } = props;
	const autoId = useId();
	const id = idProp || autoId;
	const styles = hoverCard();

	return (
		<HoverCardContext.Provider value={{ id, open, styles }}>
			{children}
		</HoverCardContext.Provider>
	);
}

export interface HoverCardTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
	[key: string]: unknown;
}

export function HoverCardTrigger(props: HoverCardTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = useHoverCardContext();
	const id = context?.id;
	const open = context?.open;
	const styles = context?.styles;

	const triggerProps = {
		id: id ? `hover-card-trigger-${id}` : undefined,
		"aria-haspopup": "dialog",
		"aria-expanded": open ? "true" : "false",
		"aria-controls": open && id ? `hover-card-content-${id}` : undefined,
		"data-state": open ? "open" : "closed",
		"data-part": "trigger",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as { props?: { class?: string } };
		return cloneElement(children as unknown as JSX.Element, {
			...triggerProps,
			class: cx(styles?.trigger, classProp, child.props?.class),
		});
	}

	return (
		<div class={cx(styles?.trigger, classProp)} {...triggerProps}>
			{children}
		</div>
	);
}

export interface HoverCardPositionerProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function HoverCardPositioner(props: HoverCardPositionerProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useHoverCardContext();
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

export interface HoverCardContentProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function HoverCardContent(props: HoverCardContentProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useHoverCardContext();
	const id = context?.id;
	const open = context?.open;
	const styles = context?.styles;

	return (
		<div
			id={id ? `hover-card-content-${id}` : undefined}
			role="dialog"
			class={cx(styles?.content, classProp)}
			data-state={open ? "open" : "closed"}
			data-part="content"
			{...restProps}
		>
			{children}
		</div>
	);
}

export function HoverCardArrow(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = useHoverCardContext();
	const styles = context?.styles;
	return (
		<div class={cx(styles?.arrow, classProp)} data-part="arrow" {...restProps}>
			{children || <HoverCardArrowTip />}
		</div>
	);
}

export function HoverCardArrowTip(props: { class?: string }) {
	const { class: classProp, ...restProps } = props;
	const context = useHoverCardContext();
	const styles = context?.styles;
	return (
		<div
			class={cx(styles?.arrowTip, classProp)}
			data-part="arrow-tip"
			{...restProps}
		/>
	);
}

export function InteractiveHoverCardRoot(props: HoverCardRootProps) {
	const {
		open: openProp,
		children,
		id: idProp,
		openDelay = 600,
		closeDelay = 300,
		...rest
	} = props;
	const [isOpen, setIsOpen] = useState(openProp ?? false);

	const fallbackId = useId();
	const rootId = idProp || `hover-card-${fallbackId}`;
	const rootRef = useRef<HTMLDivElement>(null);
	const openTimerRef = useRef<number | null>(null);
	const closeTimerRef = useRef<number | null>(null);

	const handleOpen = () => {
		if (closeTimerRef.current) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
		if (openTimerRef.current) return;

		openTimerRef.current = window.setTimeout(() => {
			setIsOpen(true);
			openTimerRef.current = null;

			// Manual style update for immediate visibility in Hono islands
			const positioner = rootRef.current?.querySelector(
				'[data-part="positioner"]',
			) as HTMLElement | null;
			if (positioner) {
				positioner.style.display = "block";
			}
		}, openDelay);
	};

	const handleClose = () => {
		if (openTimerRef.current) {
			clearTimeout(openTimerRef.current);
			openTimerRef.current = null;
		}
		if (closeTimerRef.current) return;

		closeTimerRef.current = window.setTimeout(() => {
			setIsOpen(false);
			closeTimerRef.current = null;

			const positioner = rootRef.current?.querySelector(
				'[data-part="positioner"]',
			) as HTMLElement | null;
			if (positioner) {
				positioner.style.display = "none";
			}
		}, closeDelay);
	};

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;

		const trigger = root.querySelector('[data-part="trigger"]');
		const content = root.querySelector('[data-part="content"]');

		if (trigger) {
			trigger.addEventListener("mouseenter", handleOpen);
			trigger.addEventListener("mouseleave", handleClose);
		}

		if (content) {
			content.addEventListener("mouseenter", handleOpen);
			content.addEventListener("mouseleave", handleClose);
		}

		// If the pointer is already over the trigger at hydration time, open.
		// A one-time hover fired before hydration would otherwise be missed
		// since no further mouseenter is dispatched while the pointer is still.
		if (trigger?.matches(":hover")) {
			handleOpen();
		}

		return () => {
			if (trigger) {
				trigger.removeEventListener("mouseenter", handleOpen);
				trigger.removeEventListener("mouseleave", handleClose);
			}
			if (content) {
				content.removeEventListener("mouseenter", handleOpen);
				content.removeEventListener("mouseleave", handleClose);
			}
			if (openTimerRef.current) clearTimeout(openTimerRef.current);
			if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		};
	}, [handleOpen, handleClose, openDelay, closeDelay]);

	return (
		<div id={rootId} ref={rootRef}>
			<HoverCardRoot {...rest} open={isOpen}>
				{children}
			</HoverCardRoot>
		</div>
	);
}
