import { useEffect, useRef, useState } from "hono/jsx";
import {
	RadioGroupStructure,
	type RadioGroupIslandProps,
	Root,
} from "../components/ui/radio-group-primitive";

export default function RadioGroupIsland(props: RadioGroupIslandProps) {
	const {
		value: valueProp,
		defaultValue,
		onValueChange,
		children,
		items,
		indicator,
		...rest
	} = props;
	const [value, setValue] = useState(valueProp ?? defaultValue);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (valueProp !== undefined) {
			setValue(valueProp);
		}
	}, [valueProp]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;

		const handleClick = (e: MouseEvent) => {
			const item = (e.target as HTMLElement).closest<HTMLElement>(
				'[data-part="item"]',
			);
			if (item && !item.hasAttribute("data-disabled")) {
				const newValue = item.getAttribute("data-value")!;
				setValue(newValue);
				onValueChange?.(newValue);
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const root = rootRef.current;
			if (!root) return;

			const items = Array.from(
				root.querySelectorAll<HTMLElement>(
					'[data-part="item"]:not([data-disabled])',
				),
			);

			const currentItem =
				(e.target as HTMLElement).closest<HTMLElement>('[data-part="item"]') ||
				root.querySelector<HTMLElement>(
					'[data-part="item"][data-state="checked"]:not([data-disabled])',
				) ||
				items[0];

			if (!currentItem) return;

			const index = items.indexOf(currentItem);

			let nextIndex = -1;
			if (e.key === "ArrowRight" || e.key === "ArrowDown") {
				nextIndex = (index + 1) % items.length;
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
				nextIndex = (index - 1 + items.length) % items.length;
			} else if (e.key === "Home") {
				nextIndex = 0;
			} else if (e.key === "End") {
				nextIndex = items.length - 1;
			}

			if (nextIndex !== -1) {
				const nextItem = items[nextIndex];
				nextItem.focus();
				const newValue = nextItem.getAttribute("data-value")!;
				setValue(newValue);
				onValueChange?.(newValue);
				e.preventDefault();
			}
		};

		root.addEventListener("click", handleClick);
		root.addEventListener("keydown", handleKeyDown);

		return () => {
			root.removeEventListener("click", handleClick);
			root.removeEventListener("keydown", handleKeyDown);
		};
	}, [value, onValueChange]);

	return (
		<Root
			{...rest}
			value={value}
			onValueChange={setValue}
			rootRef={rootRef}
			data-hydrated="true"
		>
			{children ||
				(items && (
					<RadioGroupStructure items={items} indicator={indicator} />
				))}
		</Root>
	);
}
// island
export type { RadioGroupIslandProps };
