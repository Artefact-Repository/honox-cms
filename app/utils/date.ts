/** `"Jan 5, 2026"` style formatting shared by every task/project date display
 * (due dates, start dates) — same options everywhere, so there's one place
 * to change the format instead of seven identical copies. */
export function formatDate(value?: string): string | undefined {
	if (!value) return undefined;
	return new Date(value).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}
