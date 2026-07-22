import { cx } from "design-system/css";
import { layout } from "design-system/recipes";
import type { JSX, PropsWithChildren } from "hono/jsx";
import { createContext, Fragment, useContext } from "hono/jsx";

type LayoutStyles = ReturnType<typeof layout>;

export interface LayoutContextValue {
	classes: LayoutStyles;
}

export const LayoutContext = createContext<LayoutContextValue | null>(null);

export const useLayoutContext = () => useContext(LayoutContext);

export interface HeaderProps
	extends PropsWithChildren<{
		class?: string;
		sticky?: boolean;
	}> {}

export function Header(props: HeaderProps) {
	const { children, class: classProp, sticky, ...rest } = props;
	const context = useLayoutContext();

	let headerClass: string;
	if (sticky !== undefined) {
		headerClass = layout({ stickyHeader: sticky }).header;
	} else {
		headerClass = context?.classes.header ?? layout({}).header;
	}

	return (
		<header class={cx(headerClass, classProp)} {...rest}>
			{children}
		</header>
	);
}

export interface SiderProps
	extends PropsWithChildren<{
		class?: string;
		width?: "sm" | "md" | "lg";
		hideBelow?: "sm" | "md" | "lg";
		sticky?: boolean;
	}> {}

export function Sider(props: SiderProps) {
	const {
		children,
		class: classProp,
		width,
		hideBelow,
		sticky,
		...rest
	} = props;
	const context = useLayoutContext();

	let siderClass: string;
	if (width !== undefined || hideBelow !== undefined || sticky !== undefined) {
		siderClass = layout({
			siderWidth: width,
			siderHideBelow: hideBelow,
			stickySider: sticky,
		}).sider;
	} else {
		siderClass = context?.classes.sider ?? layout({}).sider;
	}

	return (
		<aside class={cx(siderClass, classProp)} {...rest}>
			{children}
		</aside>
	);
}

export interface BodyProps
	extends PropsWithChildren<{
		class?: string;
	}> {}

/** Groups `<Layout.Sider>` + `<Layout.Content>` into the row Panda's `body`
 * slot lays out (it's `display: flex` unconditionally, no variant needed).
 * Required when a compound-mode layout also has a Header/Footer: without
 * it, the only way to lay Sider+Content out side by side is flipping the
 * *root* to `flexDirection: row` via `data-has-sider`, which drags Header
 * and Footer into that row too instead of leaving them as full-width bars.
 * The shorthand (`sider`/`content` props) form gets this for free by always
 * wrapping sider+content in its own `body` div; `<Layout.Body>` gives
 * compound-mode consumers the same structure explicitly. */
export function Body(props: BodyProps) {
	const { children, class: classProp, ...rest } = props;
	const context = useLayoutContext();
	const bodyClass = context?.classes.body ?? layout({}).body;

	return (
		<div class={cx(bodyClass, classProp)} {...rest}>
			{children}
		</div>
	);
}

export interface ContentProps
	extends PropsWithChildren<{
		class?: string;
	}> {}

export function Content(props: ContentProps) {
	const { children, class: classProp, ...rest } = props;
	const context = useLayoutContext();
	const contentClass = context?.classes.content ?? layout({}).content;

	return (
		<main class={cx(contentClass, classProp)} {...rest}>
			{children}
		</main>
	);
}

export interface FooterProps
	extends PropsWithChildren<{
		class?: string;
	}> {}

export function Footer(props: FooterProps) {
	const { children, class: classProp, ...rest } = props;
	const context = useLayoutContext();
	const footerClass = context?.classes.footer ?? layout({}).footer;

	return (
		<footer class={cx(footerClass, classProp)} {...rest}>
			{children}
		</footer>
	);
}

export interface LayoutProps
	extends PropsWithChildren<{
		class?: string;
		/** Rendered inside a semantic `<header>` above the body. */
		header?: string | JSX.Element;
		/** Rendered inside a semantic `<aside>` rail. Its presence switches
		 * the body to a row of sider + content. */
		sider?: string | JSX.Element;
		/** Rendered inside a semantic `<main>`. `children` are appended after
		 * it, so either (or both) can carry the page content. */
		content?: string | JSX.Element;
		/** Rendered inside a semantic `<footer>` below the body. */
		footer?: string | JSX.Element;
		/** Fill the viewport height — for the outermost page shell. */
		fullHeight?: boolean;
		/** Pin the header to the top of the page scroll. */
		stickyHeader?: boolean;
		/** Pin the sider below a sticky header; it scrolls internally. */
		stickySider?: boolean;
		/** Sider rail width: sm (14rem), md (16rem, default), lg (18rem). */
		siderWidth?: "sm" | "md" | "lg";
		/** Hide the sider under this breakpoint. Pair with an in-flow
		 * disclosure (e.g. a `<details>` menu) so small screens keep a nav. */
		siderHideBelow?: "sm" | "md" | "lg";
		/** Force layout direction to horizontal/hasSider */
		hasSider?: boolean;
		/** Extra class for the `<header>` part. */
		headerClass?: string;
		/** Extra class for the `<aside>` part. */
		siderClass?: string;
		/** Extra class for the `<main>` part. */
		contentClass?: string;
		/** Extra class for the `<footer>` part. */
		footerClass?: string;
		/** Extra class for the row wrapper around sider + content (only
		 * rendered when `sider` is set). */
		bodyClass?: string;
	}> {}

// Detects a bare `<Layout.Sider>` among compound-mode children so root can
// switch to `flexDirection: row` on its own. Only correct when Sider (and
// Content) are root's only children — if a Header/Footer is also present,
// wrap Sider+Content in `<Layout.Body>` instead of relying on this, since
// flipping root to a row would drag the Header/Footer into it too. Doesn't
// (and shouldn't) look inside `<Layout.Body>` for this reason: once Sider is
// nested there, root correctly stays a column and `Body`'s own unconditional
// `display: flex` handles the row.
function hasSiderChild(children: unknown): boolean {
	if (!children) return false;
	const arr = Array.isArray(children) ? children : [children];
	for (const child of arr) {
		if (child && typeof child === "object") {
			const node = child as Record<string, unknown>;
			if (node.tag === Sider) {
				return true;
			}
			if (node.tag === Fragment && node.children) {
				if (hasSiderChild(node.children)) {
					return true;
				}
			}
		}
	}
	return false;
}

export function Layout(props: LayoutProps) {
	const {
		children,
		class: classProp,
		header,
		sider,
		content,
		footer,
		fullHeight,
		stickyHeader,
		stickySider,
		siderWidth,
		siderHideBelow,
		hasSider,
		headerClass,
		siderClass,
		contentClass,
		footerClass,
		bodyClass,
		...rest
	} = props;

	const classes = layout({
		fullHeight,
		stickyHeader,
		stickySider,
		siderWidth,
		siderHideBelow,
	});

	const isShorthand =
		header !== undefined ||
		sider !== undefined ||
		content !== undefined ||
		footer !== undefined;

	const mergedHasSider = hasSider || (!isShorthand && hasSiderChild(children));

	const contextValue = { classes };

	if (isShorthand) {
		const main = (
			<main class={cx(classes.content, contentClass)}>
				{content}
				{children}
			</main>
		);

		return (
			<LayoutContext.Provider value={contextValue}>
				<div class={cx(classes.root, classProp)} {...rest}>
					{header !== undefined && (
						<header class={cx(classes.header, headerClass)}>{header}</header>
					)}
					{sider !== undefined ? (
						<div class={cx(classes.body, bodyClass)}>
							<aside class={cx(classes.sider, siderClass)}>{sider}</aside>
							{main}
						</div>
					) : (
						main
					)}
					{footer !== undefined && (
						<footer class={cx(classes.footer, footerClass)}>{footer}</footer>
					)}
				</div>
			</LayoutContext.Provider>
		);
	}

	return (
		<LayoutContext.Provider value={contextValue}>
			<div
				class={cx(classes.root, classProp)}
				data-has-sider={mergedHasSider || undefined}
				{...rest}
			>
				{children}
			</div>
		</LayoutContext.Provider>
	);
}

export const LayoutComponent = Object.assign(Layout, {
	Header,
	Footer,
	Content,
	Sider,
	Body,
});

export default LayoutComponent;
