import type { PropsWithChildren } from "hono/jsx";
import { css, cx } from "styled-system/css";
import { stack } from "styled-system/patterns";
import { type SkeletonVariantProps, skeleton } from "styled-system/recipes";

interface SkeletonProps
	extends PropsWithChildren<Omit<SkeletonVariantProps, "variant">>,
		Omit<import("hono/jsx").JSX.IntrinsicElements["div"], "children" | "width" | "height" | "size"> {
	class?: string;
	width?: string | number;
	height?: string | number;
	size?: string | number;
	variant?: "pulse" | "shine" | "none" | "circle" | "text";
	noOfLines?: number;
	gap?: string | number;
}

function Skeleton(props: SkeletonProps) {
	const [variantProps, localProps] = skeleton.splitVariantProps(props);
	const { children, class: classProp, width, height, size, noOfLines, gap, ...restProps } = localProps;

	// Check if the user specified the visual variant ("circle" or "text") via the variant prop or explicitly
	const isCircle = variantProps.circle || props.variant === "circle";
	const isText = props.variant === "text";

	if (isText) {
		return <SkeletonText noOfLines={noOfLines} gap={gap} class={classProp} {...restProps} />;
	}

	const styles: Record<string, any> = {};
	if (size !== undefined) {
		styles.boxSize = size;
	}
	if (width !== undefined) {
		styles.width = width;
	}
	if (height !== undefined) {
		styles.height = height;
	}

	const hasStyles = Object.keys(styles).length > 0;

	// Resolve animation variant. If it is circle/text shape variant, default animation is pulse
	const resolvedVariant = (props.variant === "circle" || props.variant === "text")
		? undefined
		: props.variant;

	return (
		<div
			class={cx(
				skeleton({
					...variantProps,
					circle: isCircle,
					variant: resolvedVariant,
				}),
				hasStyles ? css(styles) : undefined,
				classProp,
			)}
			{...restProps}
		>
			{children}
		</div>
	);
}

interface SkeletonCircleProps extends SkeletonProps {}

function SkeletonCircle(props: SkeletonCircleProps) {
	return <Skeleton circle {...props} />;
}

interface SkeletonTextProps extends SkeletonProps {
	/**
	 * Number of lines to display
	 * @default 3
	 */
	noOfLines?: number;
	gap?: string | number;
}

function SkeletonText(props: SkeletonTextProps) {
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

export {
	Skeleton,
	SkeletonCircle,
	SkeletonText,
	type SkeletonProps,
	type SkeletonCircleProps,
	type SkeletonTextProps,
};
