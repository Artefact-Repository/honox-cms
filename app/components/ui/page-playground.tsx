import PlaygroundIsland, {
	type PlaygroundIslandProps,
} from "../../islands/playground";

export function PagePlayground(props: PlaygroundIslandProps) {
	return <PlaygroundIsland {...props} />;
}

export type { PlaygroundIslandProps as PagePlaygroundProps };
