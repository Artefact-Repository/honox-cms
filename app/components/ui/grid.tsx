import type { PropsWithChildren } from "hono/jsx";
import { createContext, useContext } from "hono/jsx";
import { css, cx } from "styled-system/css";
import { gridCol, gridRow } from "styled-system/recipes";

type Breakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl";

type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

type ColSizeObject = {
	span?: number | string;
	offset?: number | string;
	order?: number | string;
	pull?: number | string;
	push?: number | string;
	flex?: string | number;
};

type ColSize = number | string | ColSizeObject;

interface RowProps
	extends PropsWithChildren<{
		class?: string;
		align?: Responsive<"top" | "middle" | "bottom" | "stretch">;
		justify?: Responsive<
			| "start"
			| "end"
			| "center"
			| "space-around"
			| "space-between"
			| "space-evenly"
		>;
		gutter?:
			| Responsive<number | string>
			| [Responsive<number | string>, Responsive<number | string>];
		wrap?: boolean;
		[key: string]: unknown;
	}> {}

interface ColProps
	extends PropsWithChildren<{
		class?: string;
		span?: Responsive<number | string>;
		offset?: Responsive<number | string>;
		order?: Responsive<number | string>;
		pull?: Responsive<number | string>;
		push?: Responsive<number | string>;
		flex?: Responsive<string | number>;
		xs?: ColSize;
		sm?: ColSize;
		md?: ColSize;
		lg?: ColSize;
		xl?: ColSize;
		xxl?: ColSize;
		"2xl"?: ColSize;
		[key: string]: unknown;
	}> {}

const breakpoints = ["base", "sm", "md", "lg", "xl", "2xl"] as const;

const RowContext = createContext<{
	paddingLeft?: unknown;
	paddingRight?: unknown;
	paddingTop?: unknown;
	paddingBottom?: unknown;
}>({});

function divideAndFormat(val: unknown, sign = 1): unknown {
	if (val === undefined || val === null) return undefined;

	const processValue = (v: string | number) => {
		let num = 0;
		let unit = "px";
		if (typeof v === "number") {
			num = v;
		} else {
			const match = String(v).match(/^([\d.-]+)([a-zA-Z%]*)$/);
			if (match) {
				num = Number.parseFloat(match[1]);
				unit = match[2] || "px";
			} else {
				return v;
			}
		}
		return `${(num / 2) * sign}${unit}`;
	};

	if (typeof val === "object" && val !== null) {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(val)) {
			out[key] = processValue((val as Record<string, string | number>)[key]);
		}
		return out;
	}
	return processValue(val as string | number);
}

function cleanResponsiveObj(obj: Record<Breakpoint, unknown>): unknown {
	const keys = Object.keys(obj) as Breakpoint[];
	if (keys.length === 0) return undefined;
	if (keys.length === 1 && keys[0] === "base") {
		return obj.base;
	}
	const clean: Record<string, unknown> = {};
	for (const k of keys) {
		if (obj[k] !== undefined) {
			clean[k] = obj[k];
		}
	}
	return Object.keys(clean).length > 0 ? clean : undefined;
}

function Row(props: RowProps) {
	const {
		children,
		class: classProp,
		align,
		justify,
		gutter,
		wrap = true,
		...rest
	} = props;

	let gutterX: unknown;
	let gutterY: unknown;

	if (Array.isArray(gutter)) {
		gutterX = gutter[0];
		gutterY = gutter[1];
	} else {
		gutterX = gutter;
		gutterY = undefined;
	}

	const marginLeft = divideAndFormat(gutterX, -1);
	const marginRight = divideAndFormat(gutterX, -1);
	const marginTop = divideAndFormat(gutterY, -1);
	const marginBottom = divideAndFormat(gutterY, -1);

	const paddingLeft = divideAndFormat(gutterX, 1);
	const paddingRight = divideAndFormat(gutterX, 1);
	const paddingTop = divideAndFormat(gutterY, 1);
	const paddingBottom = divideAndFormat(gutterY, 1);

	const rowMarginStyles = css({
		marginLeft: marginLeft as string | Record<string, string>,
		marginRight: marginRight as string | Record<string, string>,
		marginTop: marginTop as string | Record<string, string>,
		marginBottom: marginBottom as string | Record<string, string>,
	});

	const variantProps = {
		align,
		justify,
		wrap,
	};

	return (
		<RowContext.Provider
			value={{ paddingLeft, paddingRight, paddingTop, paddingBottom }}
		>
			<div
				class={cx(
					gridRow(
						variantProps as Record<string, unknown> as Parameters<
							typeof gridRow
						>[0],
					),
					rowMarginStyles,
					classProp,
				)}
				{...(rest as Record<string, unknown>)}
			>
				{children}
			</div>
		</RowContext.Provider>
	);
}

function Col(props: ColProps) {
	const {
		children,
		class: classProp,
		span,
		offset,
		order,
		pull,
		push,
		flex,
		xs,
		sm,
		md,
		lg,
		xl,
		xxl,
		"2xl": panda2xl,
		...rest
	} = props;

	const resolvedSpan: Record<Breakpoint, unknown> = {
		base: undefined,
		sm: undefined,
		md: undefined,
		lg: undefined,
		xl: undefined,
		"2xl": undefined,
	};
	const resolvedOffset: Record<Breakpoint, unknown> = {
		base: undefined,
		sm: undefined,
		md: undefined,
		lg: undefined,
		xl: undefined,
		"2xl": undefined,
	};
	const resolvedOrder: Record<Breakpoint, unknown> = {
		base: undefined,
		sm: undefined,
		md: undefined,
		lg: undefined,
		xl: undefined,
		"2xl": undefined,
	};
	const resolvedPull: Record<Breakpoint, unknown> = {
		base: undefined,
		sm: undefined,
		md: undefined,
		lg: undefined,
		xl: undefined,
		"2xl": undefined,
	};
	const resolvedPush: Record<Breakpoint, unknown> = {
		base: undefined,
		sm: undefined,
		md: undefined,
		lg: undefined,
		xl: undefined,
		"2xl": undefined,
	};
	const resolvedFlex: Record<Breakpoint, unknown> = {
		base: undefined,
		sm: undefined,
		md: undefined,
		lg: undefined,
		xl: undefined,
		"2xl": undefined,
	};

	const parseResponsiveProp = (
		propVal: unknown,
		targetRecord: Record<Breakpoint, unknown>,
	) => {
		if (propVal === undefined || propVal === null) return;
		if (typeof propVal === "object") {
			for (const key of Object.keys(propVal)) {
				let bKey: Breakpoint | undefined;
				if (key === "xs") bKey = "base";
				else if (key === "xxl" || key === "2xl") bKey = "2xl";
				else if (breakpoints.includes(key as Breakpoint))
					bKey = key as Breakpoint;

				if (bKey) {
					targetRecord[bKey] = (propVal as Record<string, unknown>)[key];
				}
			}
		} else {
			targetRecord.base = propVal;
		}
	};

	const parseBreakpointProp = (bpVal: unknown, bKey: Breakpoint) => {
		if (bpVal === undefined || bpVal === null) return;
		if (typeof bpVal === "object") {
			const obj = bpVal as ColSizeObject;
			if (obj.span !== undefined) resolvedSpan[bKey] = obj.span;
			if (obj.offset !== undefined) resolvedOffset[bKey] = obj.offset;
			if (obj.order !== undefined) resolvedOrder[bKey] = obj.order;
			if (obj.pull !== undefined) resolvedPull[bKey] = obj.pull;
			if (obj.push !== undefined) resolvedPush[bKey] = obj.push;
			if (obj.flex !== undefined) resolvedFlex[bKey] = obj.flex;
		} else {
			resolvedSpan[bKey] = bpVal;
		}
	};

	parseResponsiveProp(span, resolvedSpan);
	parseResponsiveProp(offset, resolvedOffset);
	parseResponsiveProp(order, resolvedOrder);
	parseResponsiveProp(pull, resolvedPull);
	parseResponsiveProp(push, resolvedPush);
	parseResponsiveProp(flex, resolvedFlex);

	parseBreakpointProp(xs, "base");
	parseBreakpointProp(sm, "sm");
	parseBreakpointProp(md, "md");
	parseBreakpointProp(lg, "lg");
	parseBreakpointProp(xl, "xl");
	parseBreakpointProp(xxl, "2xl");
	parseBreakpointProp(panda2xl, "2xl");

	const finalSpan = cleanResponsiveObj(resolvedSpan);
	const finalOffset = cleanResponsiveObj(resolvedOffset);
	const finalOrder = cleanResponsiveObj(resolvedOrder);
	const finalPull = cleanResponsiveObj(resolvedPull);
	const finalPush = cleanResponsiveObj(resolvedPush);
	const finalFlex = cleanResponsiveObj(resolvedFlex);

	const variantProps = {
		span: finalSpan,
		offset: finalOffset,
		order: finalOrder,
		pull: finalPull,
		push: finalPush,
	};

	const { paddingLeft, paddingRight, paddingTop, paddingBottom } =
		useContext(RowContext);

	const colPaddingStyles = css({
		paddingLeft: paddingLeft as string | Record<string, string>,
		paddingRight: paddingRight as string | Record<string, string>,
		paddingTop: paddingTop as string | Record<string, string>,
		paddingBottom: paddingBottom as string | Record<string, string>,
	});

	const flexStyles =
		finalFlex !== undefined
			? css({
					flex: finalFlex as string | number | Record<string, string | number>,
				})
			: undefined;

	return (
		<div
			class={cx(
				gridCol(
					variantProps as Record<string, unknown> as Parameters<
						typeof gridCol
					>[0],
				),
				colPaddingStyles,
				flexStyles,
				classProp,
			)}
			{...(rest as Record<string, unknown>)}
		>
			{children}
		</div>
	);
}

export type { ColProps, RowProps };
export { Col, Row };
