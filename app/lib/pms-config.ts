import type { ColorPalette } from "../components/ui/color-palette";
import type { PmsColorOverride } from "./configs";

/** Merges configs.json's `pms.*Colors` overrides on top of a code-side
 * status/priority → color default map (see TASK_STATUS_COLOR,
 * TASK_PRIORITY_COLOR, PROJECT_STATUS_COLOR in tasks.ts/projects.ts).
 * `key` picks which side of the override entry to match against — `"status"`
 * for statusColors/projectStatusColors, `"priority"` for priorityColors.
 * Unknown/misspelled keys are ignored rather than thrown, same
 * degrade-gracefully precedent as data-sources.ts's `resolveDataSource`. */
export function mergeColorOverrides<K extends string>(
	defaults: Record<K, ColorPalette>,
	overrides: PmsColorOverride[] | undefined,
	key: "status" | "priority",
): Record<K, ColorPalette> {
	if (!overrides?.length) return defaults;
	const merged = { ...defaults };
	for (const entry of overrides) {
		const k = entry[key] as K | undefined;
		if (k && k in merged) merged[k] = entry.colorPalette as ColorPalette;
	}
	return merged;
}
