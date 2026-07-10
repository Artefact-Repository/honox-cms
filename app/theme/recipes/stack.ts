import { defineRecipe } from "@pandacss/dev";

export const stack = defineRecipe({
	className: "stack",
	base: {
		display: "flex",
	},
	defaultVariants: {
		direction: "horizontal",
		gap: "2",
	},
	variants: {
		direction: {
			horizontal: {
				flexDirection: "row",
			},
			vertical: {
				flexDirection: "column",
			},
		},
		align: {
			start: { alignItems: "flex-start" },
			center: { alignItems: "center" },
			end: { alignItems: "flex-end" },
			stretch: { alignItems: "stretch" },
			baseline: { alignItems: "baseline" },
		},
		justify: {
			start: { justifyContent: "flex-start" },
			center: { justifyContent: "center" },
			end: { justifyContent: "flex-end" },
			between: { justifyContent: "space-between" },
			around: { justifyContent: "space-around" },
			evenly: { justifyContent: "space-evenly" },
		},
		wrap: {
			wrap: { flexWrap: "wrap" },
			nowrap: { flexWrap: "nowrap" },
			"wrap-reverse": { flexWrap: "wrap-reverse" },
		},
		gap: {
			"0": { gap: "0" },
			"0.5": { gap: "0.5" },
			"1": { gap: "1" },
			"1.5": { gap: "1.5" },
			"2": { gap: "2" },
			"2.5": { gap: "2.5" },
			"3": { gap: "3" },
			"4": { gap: "4" },
			"5": { gap: "5" },
			"6": { gap: "6" },
			"7": { gap: "7" },
			"8": { gap: "8" },
			"9": { gap: "9" },
			"10": { gap: "10" },
			"12": { gap: "12" },
			"14": { gap: "14" },
			"16": { gap: "16" },
			"20": { gap: "20" },
		},
	},
});
