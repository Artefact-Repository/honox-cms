import {
	type Child,
	cloneElement,
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from "hono/jsx";
import { cx } from "styled-system/css";
import { tooltip } from "styled-system/recipes";

type TooltipStyles = ReturnType<typeof tooltip>;

interface TooltipContextValue {
	id: string;
	open: boolean;
	styles: TooltipStyles;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

const useTooltipContext = () => {
	const context = useContext(TooltipContext);
	return context;
};

export interface TooltipRootProps extends PropsWithChildren {
	id?: string;
	open?: boolean;
	disabled?: boolean;
	interactive?: boolean;
}

export function TooltipRoot(props: TooltipRootProps) {
	const { id: idProp, open = false, children } = props;
	const autoId = useId();
	const id = idProp || autoId;
	const styles = tooltip();

	return (
		<TooltipContext.Provider value={{ id, open, styles }}>
			{children}
		</TooltipContext.Provider>
	);
}

export interface TooltipTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
	[key: string]: unknown;
}

export function TooltipTrigger(props: TooltipTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = useTooltipContext();
	const id = context?.id;
	const open = context?.open;
	const styles = context?.styles;

	const triggerProps = {
		id: id ? `tooltip-trigger-${id}` : undefined,
		"aria-describedby": open && id ? `tooltip-content-${id}` : undefined,
		"data-state": open ? "open" : "closed",
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
		<div
			style={{ display: "inline-block" }}
			class={cx(styles?.trigger, classProp)}
			{...triggerProps}
		>
			{children}
		</div>
	);
}

export interface TooltipPositionerProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function TooltipPositioner(props: TooltipPositionerProps) {
	const { children, class: classProp, style: styleProp, ...restProps } = props;
	const context = useTooltipContext();
	const open = context?.open;
	const styles = context?.styles;

	if (!open) return null;

	return (
		<div
			class={cx(styles?.positioner, classProp)}
			data-state={open ? "open" : "closed"}
			style={{
				position: "absolute",
				bottom: "100%",
				left: "50%",
				transform: "translateX(-50%) translateY(-8px)",
				width: "max-content",
				pointerEvents: "none",
				zIndex: 1000,
				...(styleProp as any),
			}}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface TooltipContentProps extends PropsWithChildren {
	class?: string;
	[key: string]: unknown;
}

export function TooltipContent(props: TooltipContentProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useTooltipContext();
	const id = context?.id;
	const open = context?.open;
	const styles = context?.styles;

	return (
		<div
			id={id ? `tooltip-content-${id}` : undefined}
			role="tooltip"
			class={cx(styles?.content, classProp)}
			data-state={open ? "open" : "closed"}
			{...restProps}
		>
			{children}
		</div>
	);
}

export function TooltipArrow(props: PropsWithChildren<{ class?: string }>) {
	const { children, class: classProp, ...restProps } = props;
	const context = useTooltipContext();
	const styles = context?.styles;
	return (
		<div class={cx(styles?.arrow, classProp)} {...restProps}>
			{children}
		</div>
	);
}

export function TooltipArrowTip(props: { class?: string }) {
	const { class: classProp, ...restProps } = props;
	const context = useTooltipContext();
	const styles = context?.styles;
	return <div class={cx(styles?.arrowTip, classProp)} {...restProps} />;
}

export interface TooltipBaseProps extends TooltipRootProps {
	content?: Child;
	showArrow?: boolean;
	triggerProps?: TooltipTriggerProps;
	contentProps?: TooltipContentProps;
	asChild?: boolean;
}

export function TooltipBase(props: TooltipBaseProps) {
	const {
		children,
		content,
		showArrow,
		triggerProps,
		contentProps,
		asChild,
		...rootProps
	} = props;

	if (rootProps.disabled) return children;

	const positionerStyle: any = {};
	if (rootProps.interactive) {
		positionerStyle.pointerEvents = "auto";
	}

	return (
		<TooltipRoot {...rootProps}>
			<div style={{ position: "relative", display: "inline-block" }}>
				<TooltipTrigger asChild={asChild} {...triggerProps}>
					{children}
				</TooltipTrigger>
				<TooltipPositioner style={positionerStyle}>
					<TooltipContent {...contentProps}>
						{showArrow && (
							<TooltipArrow>
								<TooltipArrowTip />
							</TooltipArrow>
						)}
						{content}
					</TooltipContent>
				</TooltipPositioner>
			</div>
		</TooltipRoot>
	);
}

export function InteractiveTooltip(props: TooltipBaseProps) {
	const { open: openProp, interactive = true, ...rest } = props;
	const [isOpen, setIsOpen] = useState(openProp ?? false);
	const closeTimeoutRef = useRef<number | null>(null);

	const openTooltip = () => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
		setIsOpen(true);
	};

	const closeTooltip = () => {
		if (interactive) {
			closeTimeoutRef.current = window.setTimeout(() => {
				setIsOpen(false);
			}, 100) as unknown as number;
		} else {
			setIsOpen(false);
		}
	};

	useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

	return (
		<TooltipBase
			{...rest}
			open={isOpen}
			interactive={interactive}
			triggerProps={{
				onMouseEnter: openTooltip,
				onMouseLeave: closeTooltip,
				onFocus: openTooltip,
				onBlur: closeTooltip,
				tabIndex: 0,
				...props.triggerProps,
			}}
			contentProps={{
				onMouseEnter: openTooltip,
				onMouseLeave: closeTooltip,
				...props.contentProps,
			}}
		/>
	);
}
