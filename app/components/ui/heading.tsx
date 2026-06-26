import type { Child, ElementType } from "hono/jsx";
import { cx } from "styled-system/css";
import type { HeadingVariantProps } from "styled-system/recipes";
import { heading } from "styled-system/recipes";

export interface HeadingProps extends HeadingVariantProps {
	as?: ElementType;
	children?: Child;
	class?: string;
	interactive?: boolean;
	[key: string]: unknown;
}

export function Heading(props: HeadingProps) {
	const [variantProps, localProps] = heading.splitVariantProps(props);
	const {
		as: Component = "h2",
		children,
		class: classProp,
		...restProps
	} = localProps;

	return (
		<Component class={cx(heading(variantProps), classProp)} {...restProps}>
			{children}
		</Component>
	);
}
