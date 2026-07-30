import { css } from "design-system/css";
import { InfoIcon } from "../icons/info";
import { Tooltip } from "./ui/tooltip";

/** A small "ⓘ" trigger appended after a settings field's label, showing a
 * fuller explanation on hover/focus — for the setting that need more room
 * than a one-line label, without permanently taking up page space the way an
 * always-visible helper text paragraph would. Reused as the description
 * source for the settings search index too (app/lib/settings-fields.ts). */
export function FieldInfo({ description }: { description: string }) {
	return (
		<Tooltip
			content={description}
			showArrow
			triggerProps={{ "aria-label": `More info: ${description}` }}
		>
			<InfoIcon
				width="14"
				height="14"
				class={css({
					color: "fg.muted",
					cursor: "help",
					verticalAlign: "text-bottom",
				})}
			/>
		</Tooltip>
	);
}
