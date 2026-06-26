import { defineSlotRecipe } from "@pandacss/dev";

export const fieldset = defineSlotRecipe({
	className: "fieldset",
	slots: ["root", "content", "control", "errorText", "helperText", "legend"],
	base: {
		root: {
			display: "flex",
			flexDirection: "column",
			gap: "4",
			width: "full",
		},
		content: {
			display: "flex",
			flexDirection: "column",
			gap: "1.5",
		},
		control: {
			display: "flex",
			flexDirection: "column",
			gap: "1.5",
		},
		errorText: {
			color: "error",
			textStyle: "xs",
		},
		helperText: {
			color: "fg.muted",
			textStyle: "xs",
		},
		legend: {
			color: "fg.default",
			fontWeight: "semibold",
			textStyle: "sm",
		},
	},
});
