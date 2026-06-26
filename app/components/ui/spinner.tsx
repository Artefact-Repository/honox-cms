import type { JSX } from "hono/jsx";
import { cx } from "styled-system/css";
import type { SpinnerVariantProps } from "styled-system/recipes";
import { spinner } from "styled-system/recipes";

export interface SpinnerProps
	extends SpinnerVariantProps,
		Omit<JSX.IntrinsicElements["div"], "children"> {
	label?: string;
}

export function Spinner(props: SpinnerProps) {
	const [variantProps, localProps] = spinner.splitVariantProps(props);
	const { class: classProp, label, ...restProps } = localProps;

	return (
		<div
			class={cx(spinner(variantProps), classProp)}
			role="status"
			{...restProps}
		>
			{label && <span class="sr-only">{label}</span>}
		</div>
	);
}
