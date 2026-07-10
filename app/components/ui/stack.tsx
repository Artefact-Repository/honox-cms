import type { PropsWithChildren } from "hono/jsx";
import { cx } from "styled-system/css";
import type { StackVariantProps } from "styled-system/recipes";
import { stack } from "styled-system/recipes";

export interface StackProps
	extends StackVariantProps,
		PropsWithChildren<{
			class?: string;
		}> {}

export function Stack(props: StackProps) {
	const [variantProps, localProps] = stack.splitVariantProps(props);
	const { children, class: classProp, ...restProps } = localProps;

	return (
		<div class={cx(stack(variantProps), classProp)} {...restProps}>
			{children}
		</div>
	);
}
