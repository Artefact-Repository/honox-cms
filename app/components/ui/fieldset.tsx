import type { Child, PropsWithChildren } from "hono/jsx";
import { createContext, useContext, useId } from "hono/jsx";
import { cx } from "styled-system/css";
import type { FieldsetVariantProps } from "styled-system/recipes";
import { fieldset } from "styled-system/recipes";

interface FieldsetContextValue {
	id: string;
	disabled?: boolean;
	invalid?: boolean;
	helperTextId: string;
	errorTextId: string;
}

const FieldsetContext = createContext<FieldsetContextValue | null>(null);

const useFieldsetContext = () => useContext(FieldsetContext);

interface FieldsetProps extends FieldsetVariantProps, PropsWithChildren {
	class?: string;
	id?: string;
	disabled?: boolean;
	invalid?: boolean;
	interactive?: boolean;
	legend?: Child;
	helperText?: Child;
	errorText?: Child;
	[key: string]: unknown;
}

function Fieldset(props: FieldsetProps) {
	const [variantProps, localProps] = fieldset.splitVariantProps(props);
	const {
		children,
		class: classProp,
		id: idProp,
		disabled = props.disabled,
		invalid = props.invalid,
		legend,
		helperText,
		errorText,
		...restProps
	} = localProps;

	const autoId = useId();
	const id = idProp || autoId;
	const styles = fieldset(variantProps);

	const contextValue: FieldsetContextValue = {
		id,
		disabled,
		invalid,
		helperTextId: `fieldset::${id}::helper-text`,
		errorTextId: `fieldset::${id}::error-text`,
	};

	const describedBy = [];
	describedBy.push(contextValue.helperTextId);
	if (invalid) describedBy.push(contextValue.errorTextId);

	return (
		<FieldsetContext.Provider value={contextValue}>
			<fieldset
				id={id}
				class={cx(styles.root, classProp)}
				disabled={disabled}
				aria-describedby={describedBy.join(" ")}
				aria-invalid={invalid ? "true" : undefined}
				data-invalid={invalid ? "" : undefined}
				data-disabled={disabled ? "" : undefined}
				{...restProps}
			>
				{legend && <FieldsetLegend>{legend}</FieldsetLegend>}
				{helperText && <FieldsetHelperText>{helperText}</FieldsetHelperText>}
				{children && (
					<FieldsetContent>
						<FieldsetControl>{children}</FieldsetControl>
					</FieldsetContent>
				)}
				{errorText && <FieldsetErrorText>{errorText}</FieldsetErrorText>}
			</fieldset>
		</FieldsetContext.Provider>
	);
}

function FieldsetLegend(props: PropsWithChildren<{ class?: string }>) {
	const context = useFieldsetContext();
	const styles = fieldset();
	return (
		<legend
			class={cx(styles.legend, props.class)}
			data-disabled={context?.disabled ? "" : undefined}
			data-invalid={context?.invalid ? "" : undefined}
		>
			{props.children}
		</legend>
	);
}

function FieldsetHelperText(
	props: PropsWithChildren<{
		class?: string;
	}>,
) {
	const context = useFieldsetContext();
	const styles = fieldset();
	return (
		<p
			id={context?.helperTextId}
			class={cx(styles.helperText, props.class)}
			data-disabled={context?.disabled ? "" : undefined}
			data-invalid={context?.invalid ? "" : undefined}
		>
			{props.children}
		</p>
	);
}

function FieldsetErrorText(props: PropsWithChildren<{ class?: string }>) {
	const context = useFieldsetContext();
	const styles = fieldset();
	if (context?.invalid) {
		return (
			<p
				id={context?.errorTextId}
				class={cx(styles.errorText, props.class)}
				data-disabled={context?.disabled ? "" : undefined}
				data-invalid={context?.invalid ? "" : undefined}
			>
				{props.children}
			</p>
		);
	}
	return null;
}

function FieldsetContent(
	props: PropsWithChildren<{
		class?: string;
		[key: string]: unknown;
	}>,
) {
	const { children, class: classProp, ...restProps } = props;
	const styles = fieldset();
	return (
		<div class={cx(styles.content, classProp)} {...restProps}>
			{children}
		</div>
	);
}

function FieldsetControl(
	props: PropsWithChildren<{
		class?: string;
		[key: string]: unknown;
	}>,
) {
	const { children, class: classProp, ...restProps } = props;
	const styles = fieldset();
	return (
		<div class={cx(styles.control, classProp)} {...restProps}>
			{children}
		</div>
	);
}

export { Fieldset, type FieldsetProps };
export default Fieldset;
