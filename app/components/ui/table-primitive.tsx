import { css, cx } from "design-system/css";
import type { TableVariantProps } from "design-system/recipes";
import { table } from "design-system/recipes";
import type { JSX, PropsWithChildren } from "hono/jsx";
import { createContext, useContext } from "hono/jsx";
import { ChevronUpIcon } from "../../icons/chevron-up";

// Numbers are padded to a fixed width so lexical (string) comparison — which
// is all `TableSortIsland` can do, since it sorts by reading DOM attributes,
// not by re-running `sortValue` — agrees with numeric comparison (plain
// `String(5)` vs `String(10)` would otherwise sort "10" before "5"). Strings
// (e.g. ISO due dates) are already lexically sortable as-is.
function encodeSortKey(value: string | number | undefined): string {
	if (value === undefined) return "";
	if (typeof value === "number") {
		const sign = value < 0 ? "-" : "0";
		return `${sign}${String(Math.abs(value)).padStart(15, "0")}`;
	}
	return value;
}

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
	/** Enables click-to-sort on this column's header (requires hydration —
	 * `Table` auto-hydrates when any column sets this). */
	sortable?: boolean;
	/** Value to compare when sorting; defaults to `row[column.key]`. */
	sortValue?: (row: T) => string | number | undefined;
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
	/** Extra props (e.g. `data-*` attrs, `id`, `hidden`) merged onto each <tr>. */
	getRowProps?: (row: T, rowIndex: number) => JSX.IntrinsicElements["tr"];

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
		getRowProps,
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
							{column.sortable ? (
								// Static markup, no vdom click handler: `TableSortIsland` (a
								// wrapping controller island, not this table's own hydration)
								// attaches a real DOM listener to `[data-sort-key]` and
								// reorders <tr> by their `data-sort-<key>` attribute — see
								// that file for why a normal onClick prop can't do this.
								<button
									type="button"
									data-sort-key={column.key}
									class={css({
										all: "unset",
										display: "inline-flex",
										alignItems: "center",
										gap: "1",
										cursor: "pointer",
										font: "inherit",
										color: "inherit",
									})}
								>
									{column.header}
									<span
										data-sort-indicator
										data-active="false"
										class={css({
											display: "inline-flex",
											opacity: "0.5",
											transition: "opacity 0.15s, transform 0.15s",
											"&[data-active=true]": { opacity: "1" },
											"&[data-active=true][data-direction=desc]": {
												transform: "rotate(180deg)",
											},
										})}
									>
										<ChevronUpIcon width="14" height="14" />
									</span>
								</button>
							) : (
								column.header
							)}
						</Header>
					))}
				</Row>
			</Head>
			<Body class={bodyClass}>
				{rows.map((row: any, rowIndex) => {
					const rowProps: Record<string, unknown> = getRowProps
						? getRowProps(row, rowIndex)
						: {};
					const sortAttrs: Record<string, string> = {};
					for (const column of columns) {
						if (!column.sortable) continue;
						const value = column.sortValue
							? column.sortValue(row)
							: (row[column.key] as string | number | undefined);
						sortAttrs[`data-sort-${column.key}`] = encodeSortKey(value);
					}
					return (
						<Row
							key={(rowProps.id as string | undefined) ?? rowIndex}
							class={row.class || rowClass}
							{...(interactive && row.onClick ? { onClick: row.onClick } : {})}
							{...(row.disabled ? { "data-disabled": true } : {})}
							{...sortAttrs}
							{...rowProps}
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
					);
				})}
			</Body>
			{footer && <Foot class={footClass}>{footer}</Foot>}
		</Root>
	);
}

export type { RootProps };
export { Body, Caption, Cell, Foot, Head, Header, Root, Row };
