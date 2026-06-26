import type { PropsWithChildren } from "hono/jsx";
import { cx } from "styled-system/css";
import type { AbsoluteCenterVariantProps } from "styled-system/recipes";
import { absoluteCenter } from "styled-system/recipes";

export interface AbsoluteCenterProps
	extends AbsoluteCenterVariantProps,
		PropsWithChildren<{
			class?: string;
		}> {}

export function AbsoluteCenter(props: AbsoluteCenterProps) {
	const [variantProps, localProps] = absoluteCenter.splitVariantProps(props);
	const { children, class: classProp, ...restProps } = localProps;

	return (
		<div class={cx(absoluteCenter(variantProps), classProp)} {...restProps}>
			{children}
		</div>
	);
}
