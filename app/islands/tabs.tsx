import { useEffect, useRef, useState } from "hono/jsx";
import {
	InteractiveRoot,
	type RootProps,
	TabsStructure,
	type TabsStructureProps,
} from "../components/ui/tabs-primitive";

export interface TabsIslandProps extends RootProps, TabsStructureProps {}

export default function TabsIsland(props: TabsIslandProps) {
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

	const updateIndicator = (activeTrigger: HTMLElement) => {
		const root = rootRef.current;
		if (!root) return;

		const rect = activeTrigger.getBoundingClientRect();
		const rootRect = root.getBoundingClientRect();

		root.style.setProperty("--width", `${rect.width}px`);
		root.style.setProperty("--height", `${rect.height}px`);
		root.style.setProperty("--left", `${rect.left - rootRect.left}px`);
		root.style.setProperty("--top", `${rect.top - rootRect.top}px`);
	};

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;

		const activeTrigger = root.querySelector<HTMLElement>(
			`[data-part="trigger"][data-value="${value}"]`,
		);

		if (activeTrigger) {
			requestAnimationFrame(() => {
				updateIndicator(activeTrigger);
			});
		}

		const handleClick = (e: MouseEvent) => {
			const trigger = (e.target as HTMLElement).closest<HTMLElement>(
				'[data-part="trigger"]',
			);
			if (trigger && !trigger.hasAttribute("data-disabled")) {
				const newValue = trigger.getAttribute("data-value")!;
				setValue(newValue);
				onValueChange?.(newValue);
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const trigger = (e.target as HTMLElement).closest<HTMLElement>(
				'[data-part="trigger"]',
			);
			if (!trigger) return;

			const triggers = Array.from(
				root.querySelectorAll<HTMLElement>(
					'[data-part="trigger"]:not([data-disabled])',
				),
			);
			const index = triggers.indexOf(trigger);

			let nextIndex = -1;
			if (e.key === "ArrowRight" || e.key === "ArrowDown") {
				nextIndex = (index + 1) % triggers.length;
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
				nextIndex = (index - 1 + triggers.length) % triggers.length;
			} else if (e.key === "Home") {
				nextIndex = 0;
			} else if (e.key === "End") {
				nextIndex = triggers.length - 1;
			}

			if (nextIndex !== -1) {
				const nextTrigger = triggers[nextIndex];
				nextTrigger.focus();
				if (props.activationMode !== "manual") {
					const newValue = nextTrigger.getAttribute("data-value")!;
					setValue(newValue);
					onValueChange?.(newValue);
				}
				e.preventDefault();
			}
		};

		root.addEventListener("click", handleClick);
		root.addEventListener("keydown", handleKeyDown);

		return () => {
			root.removeEventListener("click", handleClick);
			root.removeEventListener("keydown", handleKeyDown);
		};
	}, [value, onValueChange, props.activationMode]);

	return (
		<InteractiveRoot
			{...rest}
			value={value}
			onValueChange={setValue}
			rootRef={rootRef}
			data-hydrated="true"
		>
			{children || <TabsStructure items={items} indicator={indicator} />}
		</InteractiveRoot>
	);
}
// island
