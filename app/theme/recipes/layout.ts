import { defineSlotRecipe } from "@pandacss/dev";

export const layout = defineSlotRecipe({
	className: "layout",
	slots: ["root", "body", "header", "sider", "content", "footer"],
	base: {
		root: {
			display: "flex",
			flexDirection: "column",
			flex: "auto",
			minWidth: "0",
			"&[data-has-sider]": {
				flexDirection: "row",
			},
		},
		// Row wrapper rendered around sider + content when a sider is present.
		body: {
			display: "flex",
			flex: "auto",
			minWidth: "0",
		},
		header: {
			flexShrink: "0",
		},
		sider: {
			flexShrink: "0",
		},
		content: {
			flex: "1",
			minWidth: "0",
			minHeight: "0",
		},
		footer: {
			flexShrink: "0",
		},
	},
	defaultVariants: {
		siderWidth: "md",
	},
	variants: {
		/** Page-level shells: fill the viewport height. */
		fullHeight: {
			true: {
				root: {
					minHeight: "screen",
				},
			},
		},
		/** Header pins to the top of the page scroll. */
		stickyHeader: {
			true: {
				header: {
					position: "sticky",
					top: "0",
					zIndex: "20",
				},
			},
		},
		/** Sider pins below a sticky header and scrolls its own overflow.
		 * Consumers with a taller header can override `top`/`maxHeight` via
		 * `siderClass` — utility-layer css() always wins over the recipes
		 * layer. */
		stickySider: {
			true: {
				sider: {
					position: "sticky",
					alignSelf: "flex-start",
					top: "6",
					maxHeight: "calc(100vh - 3rem)",
					overflowY: "auto",
				},
			},
		},
		siderWidth: {
			sm: {
				sider: { width: "56" },
			},
			md: {
				sider: { width: "64" },
			},
			lg: {
				sider: { width: "72" },
			},
		},
		/** Hide the sider under the given breakpoint (pair it with an
		 * in-flow disclosure nav for small screens). */
		siderHideBelow: {
			sm: {
				sider: { display: { base: "none", sm: "block" } },
			},
			md: {
				sider: { display: { base: "none", md: "block" } },
			},
			lg: {
				sider: { display: { base: "none", lg: "block" } },
			},
		},
	},
});
