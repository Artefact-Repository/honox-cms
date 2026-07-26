import type { ComponentBlock } from "./block-types";
import { renderBlocks } from "./page-registry";

interface PageRendererProps {
	content: ComponentBlock[];
	/** Request-scoped extras (current locale / path) — forwarded to every
	 * top-level block and, recursively, into nested `children` (see
	 * `renderBlocks`/`renderChildren`). Needed for anything that resolves a
	 * per-request value server-side, e.g. a `dropdown`/`anchor`'s
	 * `toggleLocale` (see `page-registry.tsx`'s `localeToggleUrl`), which
	 * otherwise has no current path to build a locale-swapped href from. */
	locale?: string;
	currentPath?: string;
}

// Public entry point. The block → component mapping and the recursive
// rendering logic live in `./page-registry`; this file is intentionally thin
// so the public contract (signature, null-on-empty, keying) stays in one place.
export function PageRenderer({
	content,
	locale,
	currentPath,
}: PageRendererProps) {
	if (!content || !Array.isArray(content)) return null;

	return <>{renderBlocks(content, { locale, currentPath })}</>;
}
