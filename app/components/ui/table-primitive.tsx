import type { JSX, PropsWithChildren } from "hono/jsx";
import { createContext, useContext } from "hono/jsx";
import { cx } from "styled-system/css";
import type { TableVariantProps } from "styled-system/recipes";
import { table } from "styled-system/recipes";

type TableStyles = ReturnType<typeof table>;

const TableContext = createContext<TableStyles | null>(null);

const useTableContext = () => {
	const context = useContext(TableContext);
	if (!context) {
		throw new Error("Table components must be wrapped in <Table.Root />");
	}
	return context;
};

type TableRootProps = TableVariantProps &
	JSX.IntrinsicElements["table"] &
	PropsWithChildren;

interface RootProps extends TableRootProps {}

function Root(props: RootProps) {
	const [variantProps, localProps] = table.splitVariantProps(props);
	const { children, class: classProp, ...restProps } = localProps;
	const styles = table(variantProps);

	return (
		<TableContext.Provider value={styles}>
			<table class={cx(styles.root, classProp)} {...restProps}>
				{children}
			</table>
		</TableContext.Provider>
	);
}

function Body(props: JSX.IntrinsicElements["tbody"] & PropsWithChildren) {
	const styles = useTableContext();
	const { class: classProp, children, ...restProps } = props;
	return (
		<tbody class={cx(styles.body, classProp)} {...restProps}>
			{children}
		</tbody>
	);
}

function Caption(props: JSX.IntrinsicElements["caption"] & PropsWithChildren) {
	const styles = useTableContext();
	const { class: classProp, children, ...restProps } = props;
	return (
		<caption class={cx(styles.caption, classProp)} {...restProps}>
			{children}
		</caption>
	);
}

function Cell(props: JSX.IntrinsicElements["td"] & PropsWithChildren) {
	const styles = useTableContext();
	const { class: classProp, children, ...restProps } = props;
	return (
		<td class={cx(styles.cell, classProp)} {...restProps}>
			{children}
		</td>
	);
}

function Foot(props: JSX.IntrinsicElements["tfoot"] & PropsWithChildren) {
	const styles = useTableContext();
	const { class: classProp, children, ...restProps } = props;
	return (
		<tfoot class={cx(styles.foot, classProp)} {...restProps}>
			{children}
		</tfoot>
	);
}

function Head(props: JSX.IntrinsicElements["thead"] & PropsWithChildren) {
	const styles = useTableContext();
	const { class: classProp, children, ...restProps } = props;
	return (
		<thead class={cx(styles.head, classProp)} {...restProps}>
			{children}
		</thead>
	);
}

function Header(props: JSX.IntrinsicElements["th"] & PropsWithChildren) {
	const styles = useTableContext();
	const { class: classProp, children, ...restProps } = props;
	return (
		<th class={cx(styles.header, classProp)} {...restProps}>
			{children}
		</th>
	);
}

function Row(props: JSX.IntrinsicElements["tr"] & PropsWithChildren) {
	const styles = useTableContext();
	const { class: classProp, children, ...restProps } = props;
	return (
		<tr class={cx(styles.row, classProp)} {...restProps}>
			{children}
		</tr>
	);
}

export interface TableColumn<T = Record<string, unknown>> {
	header: string | JSX.Element;
	key: string;
	render?: (row: T, rowIndex: number) => JSX.Element;
	class?: string;
	headerClass?: string;
	align?: "start" | "center" | "end";
}

export interface TableRow {
	[key: string]: unknown;
	onClick?: () => void;
	class?: string;
	disabled?: boolean;
}

export interface TableProps<T = Record<string, unknown>> {
	// Data
	columns?: TableColumn<T>[];
	rows?: T[];

	// Sections
	caption?: string | JSX.Element;
	footer?: JSX.Element;

	// Variant
	variant?: "plain" | "surface";
	striped?: boolean;
	interactive?: boolean;
	stickyHeader?: boolean;
	columnBorder?: boolean;

	// Styling
	class?: string;
	captionClass?: string;
	headClass?: string;
	bodyClass?: string;
	footClass?: string;
	rowClass?: string;
	cellClass?: string;
	headerClass?: string;
}

export function TableBase<T = Record<string, unknown>>(props: TableProps<T>) {
	const {
		columns,
		rows,
		caption,
		footer,
		variant,
		striped,
		interactive,
		stickyHeader,
		columnBorder,
		class: classProp,
		captionClass,
		headClass,
		bodyClass,
		footClass,
		rowClass,
		cellClass,
		headerClass,
		...rest
	} = props;

	// If no columns/rows provided, act as Root for backward compatibility or custom usage
	if (!columns || !rows) {
		return (
			<Root
				variant={variant}
				striped={striped}
				interactive={interactive}
				stickyHeader={stickyHeader}
				columnBorder={columnBorder}
				class={classProp}
				{...rest}
			>
				{(props as any).children}
			</Root>
		);
	}

	return (
		<Root
			variant={variant}
			striped={striped}
			interactive={interactive}
			stickyHeader={stickyHeader}
			columnBorder={columnBorder}
			class={classProp}
			{...rest}
		>
			{caption && <Caption class={captionClass}>{caption}</Caption>}
			<Head class={headClass}>
				<Row>
					{columns.map((column) => (
						<Header
							key={column.key}
							class={column.headerClass || headerClass}
							style={column.align ? { textAlign: column.align } : undefined}
						>
							{column.header}
						</Header>
					))}
				</Row>
			</Head>
			<Body class={bodyClass}>
				{rows.map((row: any, rowIndex) => (
					<Row
						key={rowIndex}
						class={row.class || rowClass}
						{...(interactive && row.onClick ? { onclick: row.onClick } : {})}
						{...(row.disabled ? { "data-disabled": true } : {})}
					>
						{columns.map((column) => (
							<Cell
								key={column.key}
								class={column.class || cellClass}
								style={column.align ? { textAlign: column.align } : undefined}
							>
								{column.render
									? column.render(row, rowIndex)
									: (row[column.key] as any)}
							</Cell>
						))}
					</Row>
				))}
			</Body>
			{footer && <Foot class={footClass}>{footer}</Foot>}
		</Root>
	);
}

export type { RootProps };
export { Body, Caption, Cell, Foot, Head, Header, Root, Row };
