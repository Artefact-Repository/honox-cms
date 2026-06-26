import type { PropsWithChildren } from "hono/jsx";
import { cx } from "styled-system/css";
import type { GroupVariantProps } from "styled-system/recipes";
import { group } from "styled-system/recipes";

export interface GroupProps
	extends GroupVariantProps,
		PropsWithChildren<{
			class?: string;
		}> {}

export function Group(props: GroupProps) {
	const [variantProps, localProps] = group.splitVariantProps(props);
	const { children, class: classProp, ...restProps } = localProps;

	return (
		<div class={cx(group(variantProps), classProp)} {...restProps}>
			{children}
		</div>
	);
}
