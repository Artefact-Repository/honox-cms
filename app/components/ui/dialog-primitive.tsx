import type { PropsWithChildren } from "hono/jsx";
import {
	cloneElement,
	createContext,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from "hono/jsx";
import { css, cx } from "styled-system/css";
import type { DialogVariantProps } from "styled-system/recipes";
import { dialog } from "styled-system/recipes";

type DialogStyles = ReturnType<typeof dialog>;

interface DialogContextValue {
	styles: DialogStyles;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	id: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const useDialogContext = () => {
	const context = useContext(DialogContext);
	return context;
};

export interface RootProps extends DialogVariantProps, PropsWithChildren {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	id?: string;
	rootRef?: any;
}

export function Root(props: RootProps) {
	const [variantProps, localProps] = dialog.splitVariantProps(props);
	const { children, open, onOpenChange, id: idProp, rootRef } = localProps;
	const styles = dialog(variantProps);
	const generatedId = useId();
	const id = idProp || generatedId;

	const value = {
		styles,
		open,
		onOpenChange,
		id,
	};

	return (
		<div id={id} ref={rootRef}>
			<DialogContext.Provider value={value}>{children}</DialogContext.Provider>
		</div>
	);
}

export interface TriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
}

export function Trigger(props: TriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;
	const context = useDialogContext();
	const open = context?.open;

	const triggerProps = {
		"aria-haspopup": "dialog",
		"aria-expanded": open,
		"data-part": "trigger",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(classProp, child.props?.class),
		});
	}

	return (
		<button type="button" {...triggerProps}>
			{children}
		</button>
	);
}

export interface BackdropProps extends PropsWithChildren {
	class?: string;
}

export function Backdrop(props: BackdropProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDialogContext();
	const styles = context?.styles || dialog();
	const open = context?.open;
	return (
		<div
			class={cx(
				styles.backdrop,
				"dialog__backdrop",
				classProp,
				!open && css({ display: "none" }),
			)}
			data-state={open ? "open" : "closed"}
			data-part="backdrop"
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface PositionerProps extends PropsWithChildren {
	class?: string;
}

export function Positioner(props: PositionerProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDialogContext();
	const styles = context?.styles || dialog();
	const open = context?.open;

	return (
		<div
			class={cx(
				styles.positioner,
				"dialog__positioner",
				classProp,
				!open && css({ display: "none" }),
			)}
			data-state={open ? "open" : "closed"}
			data-part="positioner"
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface ContentProps extends PropsWithChildren {
	class?: string;
}

export function Content(props: ContentProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDialogContext();
	const styles = context?.styles || dialog();
	const open = context?.open;
	const id = context?.id;
	return (
		<div
			role="dialog"
			data-part="content"
			aria-modal="true"
			aria-labelledby={id ? `${id}-title` : undefined}
			aria-describedby={id ? `${id}-description` : undefined}
			class={cx(
				styles.content,
				"dialog__content",
				classProp,
				!open && css({ display: "none" }),
			)}
			data-state={open ? "open" : "closed"}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface HeaderProps extends PropsWithChildren {
	class?: string;
}

export function Header(props: HeaderProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDialogContext();
	const styles = context?.styles || dialog();

	return (
		<div class={cx(styles.header, "dialog__header", classProp)} {...restProps}>
			{children}
		</div>
	);
}

export interface BodyProps extends PropsWithChildren {
	class?: string;
}

export function Body(props: BodyProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDialogContext();
	const styles = context?.styles || dialog();

	return (
		<div class={cx(styles.body, "dialog__body", classProp)} {...restProps}>
			{children}
		</div>
	);
}

export interface FooterProps extends PropsWithChildren {
	class?: string;
}

export function Footer(props: FooterProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDialogContext();
	const styles = context?.styles || dialog();

	return (
		<div class={cx(styles.footer, "dialog__footer", classProp)} {...restProps}>
			{children}
		</div>
	);
}

export interface TitleProps extends PropsWithChildren {
	class?: string;
}

export function Title(props: TitleProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDialogContext();
	const styles = context?.styles || dialog();
	const id = context?.id;

	return (
		<h2
			id={id ? `${id}-title` : undefined}
			class={cx(styles.title, "dialog__title", classProp)}
			{...restProps}
		>
			{children}
		</h2>
	);
}

export interface DescriptionProps extends PropsWithChildren {
	class?: string;
}

export function Description(props: DescriptionProps) {
	const { children, class: classProp, ...restProps } = props;
	const context = useDialogContext();
	const styles = context?.styles || dialog();
	const id = context?.id;

	return (
		<div
			id={id ? `${id}-description` : undefined}
			class={cx(styles.description, "dialog__description", classProp)}
			{...restProps}
		>
			{children}
		</div>
	);
}

export interface CloseTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
	unstyled?: boolean;
}

export function CloseTrigger(props: CloseTriggerProps) {
	const { children, class: classProp, asChild, unstyled, ...restProps } = props;
	const context = useDialogContext();
	const styles = context?.styles || dialog();

	const triggerProps = {
		"data-part": "close-trigger",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(
				!unstyled && styles.closeTrigger,
				!unstyled && "dialog__closeTrigger",
				classProp,
				child.props?.class,
			),
		});
	}

	return (
		<button
			type="button"
			aria-label="Close"
			class={cx(
				!unstyled && styles.closeTrigger,
				!unstyled && "dialog__closeTrigger",
				classProp,
			)}
			{...triggerProps}
		>
			{children}
		</button>
	);
}

export interface ActionTriggerProps extends PropsWithChildren {
	class?: string;
	asChild?: boolean;
}

export function ActionTrigger(props: ActionTriggerProps) {
	const { children, class: classProp, asChild, ...restProps } = props;

	const triggerProps = {
		"data-part": "action-trigger",
		...restProps,
	};

	if (asChild && typeof children === "object" && children !== null) {
		const child = children as any;
		return cloneElement(child, {
			...triggerProps,
			class: cx(classProp, child.props?.class),
		});
	}

	return (
		<button type="button" class={cx(classProp)} {...triggerProps}>
			{children}
		</button>
	);
}

// Interactive version with state management and event listeners
export interface InteractiveDialogProps extends RootProps {
	defaultOpen?: boolean;
}

export function InteractiveDialog(props: InteractiveDialogProps) {
	const {
		open: openProp,
		onOpenChange: onOpenChangeProp,
		defaultOpen,
		id: idProp,
		...rest
	} = props;
	const [isOpen, setIsOpen] = useState(openProp ?? defaultOpen ?? false);

	const isControlled = openProp !== undefined;
	const open = isControlled ? openProp : isOpen;

	const fallbackId = useId();
	const rootId = idProp || `dialog-${fallbackId}`;
	const rootRef = useRef<HTMLElement>(null);

	const handleOpenChangeRef = useRef<(nextOpen: boolean) => void>(() => {});

	const handleOpenChange = (nextOpen: boolean) => {
		if (!isControlled) {
			setIsOpen(nextOpen);
		}
		onOpenChangeProp?.(nextOpen);
	};

	// Store the handler in a ref
	useEffect(() => {
		handleOpenChangeRef.current = handleOpenChange;
	}, [isControlled, onOpenChangeProp]);

	// Attach event listeners using event delegation
	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;

		// Handle all clicks via event delegation
		const handleClick = (e: Event) => {
			const target = (e.target as HTMLElement).closest(
				"[data-part]",
			) as HTMLElement;
			if (!target) return;
			const dataPart = target.getAttribute("data-part");

			const getElements = () => {
				return {
					positioners: Array.from(
						root.querySelectorAll<HTMLElement>('[data-part="positioner"]'),
					),
					backdrops: Array.from(
						root.querySelectorAll<HTMLElement>('[data-part="backdrop"]'),
					),
					contents: Array.from(
						root.querySelectorAll<HTMLElement>('[data-part="content"]'),
					),
				};
			};

			const hide = () => {
				const { positioners, backdrops, contents } = getElements();
				root.setAttribute("data-state", "closed");
				positioners.forEach((p) => {
					p.style.cssText =
						"display: none !important; visibility: hidden !important;";
					p.setAttribute("data-state", "closed");
				});
				backdrops.forEach((b) => {
					b.style.cssText =
						"display: none !important; visibility: hidden !important;";
					b.setAttribute("data-state", "closed");
				});
				contents.forEach((c) => {
					c.setAttribute("data-state", "closed");
					c.style.cssText =
						"display: none !important; visibility: hidden !important;";
				});
			};

			const show = () => {
				const { positioners, backdrops, contents } = getElements();
				root.setAttribute("data-state", "open");
				positioners.forEach((p) => {
					p.style.cssText =
						"display: flex !important; visibility: visible !important;";
					p.setAttribute("data-state", "open");
				});
				backdrops.forEach((b) => {
					b.style.cssText =
						"display: block !important; visibility: visible !important;";
					b.setAttribute("data-state", "open");
				});
				contents.forEach((c) => {
					c.setAttribute("data-state", "open");
					c.style.cssText =
						"display: flex !important; visibility: visible !important;";
				});
			};

			if (dataPart === "backdrop") {
				hide();
				handleOpenChangeRef.current?.(false);
			} else if (dataPart === "trigger") {
				const currentOpen = root.getAttribute("data-state") === "open";
				const nextOpen = !currentOpen;
				if (nextOpen) show();
				else hide();
				handleOpenChangeRef.current?.(nextOpen);
			} else if (
				dataPart === "close-trigger" ||
				dataPart === "action-trigger"
			) {
				hide();
				handleOpenChangeRef.current?.(false);
			}
		};

		// Use event delegation on root
		root.addEventListener("click", handleClick);

		return () => {
			root.removeEventListener("click", handleClick);
		};
	}, []);

	return (
		<Root
			{...rest}
			id={rootId}
			open={open}
			onOpenChange={handleOpenChange}
			rootRef={rootRef}
		/>
	);
}
