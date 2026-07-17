// Shared search primitives used by the blog route (SSR filtering for the
// no-JS ?q= fallback), the /api/posts/search.json route (SSG static index),
// and the Search island (instant client-side filtering + autocomplete), so
// server, build output, and client always agree on what matches.

export interface SearchIndexEntry {
	/** Stable id (e.g. post slug) — matched against DOM filter attributes */
	key: string;
	/** Navigation target when the entry is picked from autocomplete */
	href: string;
	title: string;
	description?: string;
	tags?: string[];
	/** Precomputed lowercase text blob the query tokens are matched against */
	haystack: string;
}

/** Shape of the SSG-generated /api/posts/search.json document */
export interface SearchIndexDocument {
	generated: string;
	entries: SearchIndexEntry[];
}

export function buildHaystack(
	parts: Array<string | string[] | undefined | null>,
): string {
	return parts
		.flat()
		.filter((part): part is string => typeof part === "string" && part !== "")
		.join(" ")
		.toLowerCase();
}

export function tokenize(query: string): string[] {
	return query.toLowerCase().split(/\s+/).filter(Boolean);
}

// Every whitespace-separated token must appear somewhere in the haystack.
// An empty query matches everything.
export function filterEntries<T extends { haystack: string }>(
	entries: T[],
	query: string,
): T[] {
	const tokens = tokenize(query);
	if (tokens.length === 0) {
		return entries;
	}
	return entries.filter((entry) =>
		tokens.every((token) => entry.haystack.includes(token)),
	);
}
