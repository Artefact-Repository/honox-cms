import { cx } from "design-system/css";
import type { InputVariantProps } from "design-system/recipes";
import { input } from "design-system/recipes";
import { useFieldContext } from "./field-primitive";

export interface InputProps extends InputVariantProps {
	class?: string;
	value?: string;
	onValueChange?: (value: string) => void;
	onInput?: (e: any) => void;
	[key: string]: any;
}

export function Input(props: InputProps) {
	const field = useFieldContext();
	const [variantProps, localProps] = input.splitVariantProps(props);
	const {
		class: classProp,
		value: valueProp,
		onInput,
		onValueChange,
		...restProps
	} = localProps;
	const styles = input(variantProps);

	const describedBy = [];
	if (field?.hasHelperText) describedBy.push(field.helperTextId);
	if (field?.invalid && field?.hasErrorText)
		describedBy.push(field.errorTextId);

	const value = valueProp !== undefined ? valueProp : field?.value;

	const handleInput = (e: any) => {
		if (onInput) onInput(e);
		const newValue = e.target.value;
		if (onValueChange) onValueChange(newValue);
		if (field?.onValueChange) {
			field.onValueChange(newValue);
		}
	};

	return (
		<input
			id={field?.id}
			aria-describedby={
				describedBy.length > 0 ? describedBy.join(" ") : undefined
			}
			aria-invalid={field?.invalid ? "true" : undefined}
			aria-required={field?.required ? "true" : undefined}
			disabled={field?.disabled}
			readOnly={field?.readOnly}
			class={cx(styles, classProp)}
			value={value}
			onInput={handleInput}
			{...(restProps as any)}
		/>
	);
}

export default Input;
