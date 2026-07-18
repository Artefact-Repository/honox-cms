import type {} from "hono";
import type { FC } from "hono/jsx";

declare module "hono" {
	interface Env {
		Variables: Record<string, unknown>;
		Bindings: Record<string, unknown>;
	}
}

declare module "*.mdx" {
	const MDXComponent: FC;
	export default MDXComponent;
}
