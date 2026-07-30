import type { ColorPalette } from "../components/ui/color-palette";

/** Merges configs.json's `pms.*Colors` maps (edited via the CMS's `keyvalue`
 * widget — free-text keys/values) on top of a code-side status/priority →
 * color default map (see TASK_STATUS_COLOR, TASK_PRIORITY_COLOR,
 * PROJECT_STATUS_COLOR in tasks.ts/projects.ts). A key that doesn't match one
 * of the real status/priority values is ignored rather than thrown, same
 * degrade-gracefully precedent as data-sources.ts's `resolveDataSource` —
 * `keyvalue` can't constrain what a CMS editor types. */
export function mergeColorOverrides<K extends string>(
	defaults: Record<K, ColorPalette>,
	overrides: Record<string, string> | undefined,
): Record<K, ColorPalette> {
	if (!overrides) return defaults;
	const merged = { ...defaults };
	for (const [key, color] of Object.entries(overrides)) {
		if (key in merged && color) merged[key as K] = color as ColorPalette;
	}
	return merged;
}
