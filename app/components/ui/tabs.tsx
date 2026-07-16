import InteractiveTabsIsland from "../../islands/tabs";
import { shouldHydrate } from "./island-utils";
import {
	AddTrigger,
	Content,
	Indicator,
	List,
	Root,
	type RootProps as InteractiveRootProps,
	TabsStructure,
	type TabsStructureProps,
	Trigger,
} from "./tabs-primitive";

type TabsItemFromPrimitive = import("./tabs-primitive").TabsItem;

interface TabsProps extends InteractiveRootProps, TabsStructureProps {
	interactive?: boolean;
}

const TabsRoot = (props: TabsProps) => {
	const { interactive, ...rest } = props;

	const hasSignal =
		rest.value !== undefined ||
		rest.defaultValue !== undefined ||
		rest.onValueChange !== undefined ||
		rest.closable !== undefined ||
		rest.editable !== undefined ||
		rest.onTabClose !== undefined ||
		rest.onTabAdd !== undefined;

	if (shouldHydrate(interactive, hasSignal)) {
		return <InteractiveTabsIsland {...rest} />;
	}

	return (
		<Root {...rest}>
			{props.children || (
				<TabsStructure
					items={rest.items}
					indicator={rest.indicator}
					closable={rest.closable}
					editable={rest.editable}
					onTabClose={rest.onTabClose}
					onTabAdd={rest.onTabAdd}
					addAriaLabel={rest.addAriaLabel}
					extra={rest.extra}
				/>
			)}
		</Root>
	);
};

export const Tabs = TabsRoot;
export type { TabsItemFromPrimitive as TabsItem, TabsProps };
export {
	AddTrigger as TabsAddTrigger,
	Content as TabsContent,
	Indicator as TabsIndicator,
	List as TabsList,
	Trigger as TabsTrigger,
};

export default Tabs;
