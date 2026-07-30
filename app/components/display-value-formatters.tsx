// Named escape hatches for a `displayValue` block's `formatValue` field (see
// page-registry.tsx's `displayValue` renderer) — CMS JSON can only store a
// string, not a function, so a content author picks one of these by name and
// the renderer looks up the real formatter here. Same string->function
// registry pattern as `customRenderer` in custom-table-renderers.tsx.
import { formatDate } from "../utils/date";
import { formatBytes } from "./ui/file-upload-primitive";

export const displayValueFormatters: Record<
	string,
	// biome-ignore lint/suspicious/noExplicitAny: registry spans formatters with different value types (string dates, numeric byte counts)
	(value: any) => string | null | undefined
> = {
	date: formatDate,
	bytes: formatBytes,
};
