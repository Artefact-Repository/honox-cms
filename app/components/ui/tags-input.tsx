import type { PropsWithChildren } from "hono/jsx";
import TagsInputIsland from "../../islands/tags-input";
import * as Primitives from "./tags-input-primitive";
import { shouldHydrate } from "./island-utils";

export interface TagsInputProps extends Primitives.RootProps {
	/**
	 * Whether to enable interactivity (hydration).
	 * - `true`  → always hydrate (explicit opt-in)
	 * - `false` → never hydrate, render pure static markup (explicit opt-out)
	 * - omitted → smart auto-detect: hydrate iff a behavioural signal is present
	 *   (a handler, controlled state, or uncontrolled initial value)
	 */
	interactive?: boolean;
	onValueChange?: (details: { value: string[] }) => void;
	onInputValueChange?: (details: { inputValue: string }) => void;
}

export function TagsInput(props: TagsInputProps) {
	const {
		value,
		defaultValue,
		onValueChange,
		inputValue,
		defaultInputValue,
		onInputValueChange,
		interactive,
		children,
		...rest
	} = props;

	// Tier-2 smart auto-detect: hydrate when any behavioural signal is present —
	// an event handler, controlled state (value / inputValue), or uncontrolled
	// initial state (defaultValue / defaultInputValue). An explicit `interactive`
	// knob overrides this: `true` forces, `false` forbids.
	const hasSignal =
		onValueChange !== undefined ||
		onInputValueChange !== undefined ||
		value !== undefined ||
		inputValue !== undefined ||
		defaultValue !== undefined ||
		defaultInputValue !== undefined;

	if (shouldHydrate(interactive, hasSignal)) {
		return (
			<TagsInputIsland
				value={value}
				defaultValue={defaultValue}
				onValueChange={onValueChange}
				inputValue={inputValue}
				defaultInputValue={defaultInputValue}
				onInputValueChange={onInputValueChange}
				{...rest}
			>
				{children}
			</TagsInputIsland>
		);
	}

	return (
		<Primitives.Root
			value={value}
			defaultValue={defaultValue}
			inputValue={inputValue}
			defaultInputValue={defaultInputValue}
			{...rest}
		>
			{children || (
				<>
					{rest.label && <Primitives.Label>{rest.label}</Primitives.Label>}
					<Primitives.Control>
						<Primitives.Items />
						<Primitives.Input />
					</Primitives.Control>
					<Primitives.HiddenInput />
				</>
			)}
		</Primitives.Root>
	);
}

export const Root = Primitives.Root;
export const Label = Primitives.Label;
export const Control = Primitives.Control;
export const Input = Primitives.Input;
export const Item = Primitives.Item;
export const ItemPreview = Primitives.ItemPreview;
export const ItemText = Primitives.ItemText;
export const ItemInput = Primitives.ItemInput;
export const ItemDeleteTrigger = Primitives.ItemDeleteTrigger;
export const ClearTrigger = Primitives.ClearTrigger;
export const HiddenInput = Primitives.HiddenInput;
export const Items = Primitives.Items;

Object.assign(TagsInput, {
	Root: Primitives.Root,
	Label: Primitives.Label,
	Control: Primitives.Control,
	Input: Primitives.Input,
	Item: Primitives.Item,
	ItemPreview: Primitives.ItemPreview,
	ItemText: Primitives.ItemText,
	ItemInput: Primitives.ItemInput,
	ItemDeleteTrigger: Primitives.ItemDeleteTrigger,
	ClearTrigger: Primitives.ClearTrigger,
	HiddenInput: Primitives.HiddenInput,
	Items: Primitives.Items,
});
