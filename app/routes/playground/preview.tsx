import { createRoute } from "honox/factory";
import PlaygroundPreviewIsland from "../../islands/playground-preview";

export default createRoute(async (c) => {
	return c.render(<PlaygroundPreviewIsland />);
});
