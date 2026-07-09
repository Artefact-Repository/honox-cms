import type { JSX } from "hono/jsx";
import { useRef } from "hono/jsx";
import DialogIsland from "../../islands/dialog";
import { IconButton } from "./button";
import {
	ActionTrigger,
	Backdrop,
	Body,
	CloseTrigger,
	Content,
	Description,
	Root as DialogPrimitiveRoot,
	type RootProps as DialogPrimitiveRootProps,
	Footer,
	Header,
	Positioner,
	Title,
	Trigger,
} from "./dialog-primitive";

interface RootProps extends DialogPrimitiveRootProps {
	interactive?: boolean;
}

const Root = (props: RootProps) => {
	const { interactive = true, ...rest } = props;
	if (interactive) {
		return <DialogIsland {...rest} />;
	}
	return <DialogPrimitiveRoot {...rest} />;
};

const CloseIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<title>Close</title>
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	</svg>
);

export type { RootProps };

export interface DialogProps extends RootProps {
	trigger?: JSX.Element;
	title?: string | JSX.Element;
	description?: string | JSX.Element;
	body?: string | JSX.Element;
	footer?: string | JSX.Element;
	cancel?: JSX.Element;
	confirm?: JSX.Element;
	closable?: boolean;
	/** Dialog variant: a standard modal or an alert dialog. Default: "dialog". */
	role?: "dialog" | "alertdialog";
	/** Accessible name for the dialog when no `title` is provided. */
	"aria-label"?: string;
}

export function Dialog(props: DialogProps) {
	const {
		trigger,
		title,
		description,
		body,
		footer,
		cancel,
		confirm,
		closable = true,
		children,
		rootRef: rootRefProp,
		role,
		"aria-label": ariaLabel,
		...rest
	} = props;

	// Dev aid: a dialog must have an accessible name (WAI-ARIA). Warn client-side only.
	if (typeof window !== "undefined" && !title && !ariaLabel) {
		console.warn(
			"[Dialog] Missing accessible name: provide a `title` or `aria-label` so screen readers can identify the dialog.",
		);
	}

	const localRef = useRef<HTMLElement>(null);
	const rootRef = rootRefProp || localRef;

	return (
		<Root {...rest} rootRef={rootRef} dialogRole={role}>
			{trigger && <Trigger asChild>{trigger}</Trigger>}
			<Backdrop />
			<Positioner>
				<Content aria-label={ariaLabel}>
					{closable && (
						<CloseTrigger asChild>
							<IconButton variant="plain" size="sm" aria-label="Close">
								<CloseIcon />
							</IconButton>
						</CloseTrigger>
					)}
					<Header>
						{title && <Title>{title}</Title>}
						{description && <Description>{description}</Description>}
					</Header>
					{body && <Body>{body}</Body>}
					{children}
					{(footer || cancel || confirm) && (
						<Footer>
							{cancel && (
								<CloseTrigger asChild unstyled>
									{cancel}
								</CloseTrigger>
							)}
							{confirm && <ActionTrigger asChild>{confirm}</ActionTrigger>}
							{footer}
						</Footer>
					)}
				</Content>
			</Positioner>
		</Root>
	);
}

export default Dialog;
