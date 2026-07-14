import type { PropsWithChildren } from "hono/jsx";
import { cx } from "styled-system/css";
import { grid } from "styled-system/patterns";

type Breakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl";

type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

export interface GridProps
	extends PropsWithChildren<{
		class?: string;
		/** Number of columns in the grid. Can be responsive. */
		columns?: Responsive<number | string>;
		/** Number of rows in the grid. Can be responsive. */
		rows?: Responsive<number | string>;
		/** Minimum width of a child column. Can be responsive. */
		minChildWidth?: Responsive<number | string>;
		/** Gap between cells. */
		gap?: string | number | Partial<Record<Breakpoint, string | number>>;
		/** Column gap. */
		columnGap?: string | number | Partial<Record<Breakpoint, string | number>>;
		/** Row gap. */
		rowGap?: string | number | Partial<Record<Breakpoint, string | number>>;
	}> {}

export function Grid(props: GridProps) {
	const {
		children,
		class: classProp,
		columns,
		rows,
		minChildWidth,
		gap,
		columnGap,
		rowGap,
		...rest
	} = props;

	// Helper to resolve responsive values
	const resolveGridTemplateRows = (r: unknown): unknown => {
		if (r === undefined || r === null) return undefined;
		if (typeof r === "object") {
			const resolved: Record<string, string> = {};
			for (const key of Object.keys(r)) {
				const val = (r as Record<string, unknown>)[key];
				resolved[key] = `repeat(${val}, minmax(0, 1fr))`;
			}
			return resolved;
		}
		return `repeat(${r}, minmax(0, 1fr))`;
	};

	const styles = {
		columns,
		minChildWidth,
		gap: gap ?? "2",
		columnGap,
		rowGap,
		gridTemplateRows: resolveGridTemplateRows(rows),
	};

	return (
		<div
			class={cx(grid(styles as Parameters<typeof grid>[0]), classProp)}
			{...(rest as Record<string, unknown>)}
		>
			{children}
		</div>
	);
}
