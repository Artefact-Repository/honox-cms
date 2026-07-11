import { css } from "styled-system/css";
import {
	Alert,
	AlertIcon,
	Badge,
	Button,
	Card,
	Checkbox,
	Collapsible,
	Combobox,
	Dialog,
	Drawer,
	Field,
	Fieldset,
	Group,
	Heading,
	HoverCard,
	Menu,
	PaginatedTable,
	Pagination,
	Popover,
	Progress,
	RadioGroup,
	SegmentGroup,
	Select,
	Skeleton,
	Slider,
	Stack,
	Switch,
	Text,
} from "./ui";

interface ComponentBlock {
	type: string;
	// biome-ignore lint/suspicious/noExplicitAny: component properties are parsed from dynamic JSON
	[key: string]: any;
}

interface PageRendererProps {
	content: ComponentBlock[];
}

function RenderBlock({ block }: { block: ComponentBlock }) {
	const { type, ...props } = block;

	switch (type) {
		case "stack": {
			const { children, ...stackProps } = props;
			return (
				<Stack {...stackProps}>
					<PageRenderer content={children} />
				</Stack>
			);
		}
		case "button": {
			const { text, ...buttonProps } = props;
			return <Button {...buttonProps}>{text}</Button>;
		}
		case "badge": {
			const { text, ...badgeProps } = props;
			return <Badge {...badgeProps}>{text}</Badge>;
		}
		case "alert": {
			const { title, description, status, variant, ...alertProps } = props;
			return (
				<Alert
					title={title}
					description={description}
					status={status}
					variant={variant}
					indicator={<AlertIcon />}
					{...alertProps}
				/>
			);
		}
		case "heading": {
			const { text, ...headingProps } = props;
			return <Heading {...headingProps}>{text}</Heading>;
		}
		case "text": {
			const { content, ...textProps } = props;
			return <Text {...textProps}>{content}</Text>;
		}
		case "card": {
			const {
				title,
				description,
				body,
				image,
				imagePosition,
				children,
				...cardProps
			} = props;
			return (
				<Card
					title={title}
					description={description}
					body={body}
					image={image}
					imagePosition={imagePosition}
					{...cardProps}
				>
					{children && <PageRenderer content={children} />}
				</Card>
			);
		}
		case "checkbox": {
			const {
				label,
				checked,
				disabled,
				invalid,
				size,
				colorPalette,
				...checkboxProps
			} = props;
			return (
				<Checkbox
					interactive
					checked={checked}
					disabled={disabled}
					invalid={invalid}
					size={size}
					colorPalette={colorPalette}
					{...checkboxProps}
				>
					{label}
				</Checkbox>
			);
		}
		case "collapsible": {
			const {
				triggerText,
				showIndicator,
				indicatorPlacement,
				open,
				disabled,
				children,
				...collapsibleProps
			} = props;
			const trigger = triggerText || "Toggle";
			const indicator = showIndicator ? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class={css({
						transition: "transform 0.2s",
						"[data-state=open] &": { transform: "rotate(180deg)" },
					})}
				>
					<title>Chevron Down</title>
					<path d="m6 9 6 6 6-6" />
				</svg>
			) : undefined;

			return (
				<Collapsible
					interactive
					trigger={trigger}
					indicator={indicator}
					indicatorPlacement={indicatorPlacement}
					defaultOpen={open}
					disabled={disabled}
					content={<div>{children && <PageRenderer content={children} />}</div>}
					{...collapsibleProps}
				/>
			);
		}
		case "combobox": {
			const { label, placeholder, items, ...comboboxProps } = props;
			return (
				<Combobox
					interactive
					label={label}
					placeholder={placeholder}
					items={items || []}
					{...comboboxProps}
				/>
			);
		}
		case "dialog": {
			const {
				title,
				description,
				triggerText,
				confirmText,
				cancelText,
				role,
				children,
				...dialogProps
			} = props;
			const trigger = triggerText ? (
				<Button variant="outline">{triggerText}</Button>
			) : undefined;
			const confirm = confirmText ? <Button>{confirmText}</Button> : undefined;
			const cancel = cancelText ? (
				<Button variant="outline">{cancelText}</Button>
			) : undefined;

			return (
				<Dialog
					interactive
					title={title}
					description={description}
					trigger={trigger}
					confirm={confirm}
					cancel={cancel}
					role={role}
					{...dialogProps}
				>
					{children && <PageRenderer content={children} />}
				</Dialog>
			);
		}
		case "drawer": {
			const {
				title,
				description,
				triggerText,
				confirmText,
				cancelText,
				children,
				...drawerProps
			} = props;
			const trigger = triggerText ? (
				<Button variant="outline">{triggerText}</Button>
			) : undefined;
			const confirm = confirmText ? <Button>{confirmText}</Button> : undefined;
			const cancel = cancelText ? (
				<Button variant="outline">{cancelText}</Button>
			) : undefined;

			return (
				<Drawer
					interactive
					title={title}
					description={description}
					trigger={trigger}
					confirm={confirm}
					cancel={cancel}
					{...drawerProps}
				>
					{children && <PageRenderer content={children} />}
				</Drawer>
			);
		}
		case "field": {
			const {
				label,
				helperText,
				errorText,
				defaultValue,
				disabled,
				invalid,
				required,
				readOnly,
				children,
				...fieldProps
			} = props;
			return (
				<Field
					interactive
					label={label}
					helperText={helperText}
					errorText={errorText}
					defaultValue={defaultValue}
					disabled={disabled}
					invalid={invalid}
					required={required}
					readOnly={readOnly}
					{...fieldProps}
				>
					{children && <PageRenderer content={children} />}
				</Field>
			);
		}
		case "fieldset": {
			const {
				legend,
				helperText,
				errorText,
				disabled,
				invalid,
				children,
				...fieldsetProps
			} = props;
			return (
				<Fieldset
					legend={legend}
					helperText={helperText}
					errorText={errorText}
					disabled={disabled}
					invalid={invalid}
					{...fieldsetProps}
				>
					{children && <PageRenderer content={children} />}
				</Fieldset>
			);
		}
		case "group": {
			const { attached, grow, orientation, children, ...groupProps } = props;
			return (
				<Group
					attached={attached}
					grow={grow}
					orientation={orientation}
					{...groupProps}
				>
					{children && <PageRenderer content={children} />}
				</Group>
			);
		}
		case "hover-card":
		case "hoverCard": {
			const {
				triggerText,
				showArrow,
				title,
				description,
				children,
				...hoverCardProps
			} = props;
			const trigger = triggerText ? (
				<Button variant="outline">{triggerText}</Button>
			) : undefined;
			const content =
				children || title || description ? (
					<>
						{title && <Text fontWeight="bold">{title}</Text>}
						{description && (
							<Text size="sm" class={css({ color: "fg.muted", mt: "1" })}>
								{description}
							</Text>
						)}
						{children && <PageRenderer content={children} />}
					</>
				) : undefined;
			return (
				<HoverCard
					interactive
					trigger={trigger}
					showArrow={showArrow}
					content={content}
					{...hoverCardProps}
				/>
			);
		}
		case "menu": {
			const { triggerText, items, ...menuProps } = props;
			const trigger = triggerText ? (
				<Button variant="outline">{triggerText}</Button>
			) : undefined;
			return (
				<Menu
					interactive
					trigger={trigger}
					items={items || []}
					{...menuProps}
				/>
			);
		}
		case "popover": {
			const {
				triggerText,
				title,
				description,
				body,
				footer,
				showArrow,
				closable,
				children,
				...popoverProps
			} = props;
			const trigger = triggerText ? (
				<Button variant="outline">{triggerText}</Button>
			) : undefined;
			const content = children ? (
				<PageRenderer content={children} />
			) : undefined;
			return (
				<Popover
					interactive
					trigger={trigger}
					title={title}
					description={description}
					body={body}
					footer={footer}
					showArrow={showArrow}
					closable={closable}
					{...popoverProps}
				>
					{content}
				</Popover>
			);
		}
		case "skeleton": {
			const { variant, noOfLines, loaded, children, ...skeletonProps } = props;
			if (variant === "text") {
				return (
					<Skeleton
						loaded={loaded}
						class={css({ width: "full" })}
						{...skeletonProps}
					>
						{children ? (
							<PageRenderer content={children} />
						) : (
							<div
								class={css({
									display: "flex",
									flexDirection: "column",
									gap: "2",
									width: "full",
								})}
							>
								{Array.from({ length: noOfLines || 3 }).map((_, index) => (
									<Skeleton
										key={index}
										class={css({
											height: "4",
											width: "full",
											_last: { maxWidth: "80%" },
										})}
									/>
								))}
							</div>
						)}
					</Skeleton>
				);
			}
			return (
				<Skeleton
					circle={variant === "circle"}
					loaded={loaded}
					{...skeletonProps}
				>
					{children && <PageRenderer content={children} />}
				</Skeleton>
			);
		}
		case "paginatedTable":
		case "paginated-table": {
			return <PaginatedTable {...props} />;
		}
		case "pagination": {
			return <Pagination interactive {...props} />;
		}
		case "progress": {
			return <Progress {...props} />;
		}
		case "radioGroup":
		case "radio-group": {
			return <RadioGroup interactive {...props} />;
		}
		case "segmentGroup":
		case "segment-group": {
			return <SegmentGroup interactive {...props} />;
		}
		case "select": {
			const { label, placeholder, items, multiple, ...selectProps } = props;
			return (
				<Select
					interactive
					label={label}
					placeholder={placeholder}
					items={items || []}
					multiple={multiple}
					{...selectProps}
				/>
			);
		}
		case "slider": {
			return <Slider interactive {...props} />;
		}
		case "switch": {
			return <Switch interactive {...props} />;
		}
		default:
			return (
				<div>
					Unknown component type: {type}
					<pre>{JSON.stringify(props, null, 2)}</pre>
				</div>
			);
	}
}

export function PageRenderer({ content }: PageRendererProps) {
	if (!content || !Array.isArray(content)) return null;

	return (
		<>
			{content.map((block, index) => (
				<RenderBlock key={`${block.type}-${index}`} block={block} />
			))}
		</>
	);
}
