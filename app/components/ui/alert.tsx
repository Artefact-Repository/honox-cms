import type { Child } from "hono/jsx";
import { cx } from "styled-system/css";
import type { AlertVariantProps } from "styled-system/recipes";
import { alert } from "styled-system/recipes";

export interface AlertProps extends AlertVariantProps {
	title?: string;
	description?: string;
	indicator?: Child;
	children?: Child;
	class?: string;
	/**
	 * The aria-live setting of the alert.
	 * @default 'polite'
	 */
	"aria-live"?: "polite" | "assertive" | "off";
}

export function Alert(props: AlertProps) {
	const [variantProps, localProps] = alert.splitVariantProps(props);
	const styles = alert(variantProps);
	const {
		title,
		description,
		indicator,
		children,
		class: classProp,
		"aria-live": ariaLive = "polite",
		...restProps
	} = localProps;

	const hasContent = title || description || children;

	return (
		<div
			role="alert"
			aria-live={ariaLive}
			class={cx(styles.root, classProp)}
			{...restProps}
		>
			{indicator && <span class={styles.indicator}>{indicator}</span>}
			{hasContent && (
				<div class={styles.content}>
					{title && <h3 class={styles.title}>{title}</h3>}
					{description && <div class={styles.description}>{description}</div>}
					{children}
				</div>
			)}
		</div>
	);
}

// Default info icon SVG for Alert indicator
export function AlertIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<title>Info</title>
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="16" x2="12" y2="12" />
			<line x1="12" y1="8" x2="12.01" y2="8" />
		</svg>
	);
}
