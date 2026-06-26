import type { PropsWithChildren } from "hono/jsx";
import { css, cx } from "styled-system/css";
import { stack } from "styled-system/patterns";
import { type SkeletonVariantProps, skeleton } from "styled-system/recipes";

export interface SkeletonProps
	extends PropsWithChildren<SkeletonVariantProps>,
		Omit<import("hono/jsx").JSX.IntrinsicElements["div"], "children"> {
	class?: string;
}

export function Skeleton(props: SkeletonProps) {
	const [variantProps, localProps] = skeleton.splitVariantProps(props);
	const { children, class: classProp, ...restProps } = localProps;

	return (
		<div class={cx(skeleton(variantProps), classProp)} {...restProps}>
			{children}
		</div>
	);
}

export interface SkeletonCircleProps extends SkeletonProps {}

export function SkeletonCircle(props: SkeletonCircleProps) {
	return <Skeleton circle {...props} />;
}

export interface SkeletonTextProps extends SkeletonProps {
	/**
	 * Number of lines to display
	 * @default 3
	 */
	noOfLines?: number;
	gap?: string | number;
}

export function SkeletonText(props: SkeletonTextProps) {
	const {
		noOfLines = 3,
		gap = "2",
		class: classProp,
		...skeletonProps
	} = props;

	return (
		<div class={cx(stack({ gap }), css({ width: "full" }), classProp)}>
			{Array.from({ length: noOfLines }).map((_, index) => (
				<Skeleton
					key={index}
					class={css({
						height: "4",
						_last: { maxW: noOfLines === 1 ? "100%" : "80%" },
					})}
					{...skeletonProps}
				/>
			))}
		</div>
	);
}
