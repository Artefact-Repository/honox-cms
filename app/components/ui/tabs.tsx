import InteractiveTabsIsland from "../../islands/tabs";
import {
	type RootProps as InteractiveRootProps,
	Root,
	TabsStructure,
	type TabsStructureProps,
} from "./tabs-primitive";

type TabsItemFromPrimitive = import("./tabs-primitive").TabsItem;

interface TabsProps extends InteractiveRootProps, TabsStructureProps {
	interactive?: boolean;
}

const TabsRoot = (props: TabsProps) => {
	const { interactive = true, ...rest } = props;

	if (interactive) {
		return <InteractiveTabsIsland {...rest} />;
	}

	return (
		<Root {...rest}>
			{props.children || (
				<TabsStructure items={rest.items} indicator={rest.indicator} />
			)}
		</Root>
	);
};

export const Tabs = TabsRoot;
export type { TabsItemFromPrimitive as TabsItem, TabsProps };

export default Tabs;
