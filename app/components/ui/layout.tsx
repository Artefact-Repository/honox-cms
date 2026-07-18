import { cx } from "design-system/css";
import { layout } from "design-system/recipes";
import type { JSX, PropsWithChildren } from "hono/jsx";

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

/**
 * Flat page-shell component: pass the parts as props and get semantic
 * `<header>` / `<aside>` / `<main>` / `<footer>` structure back, with the
 * sider + content row appearing automatically when `sider` is set. Purely
 * presentational — no island, no hydration. Nest a `<Layout>` inside
 * `content` for composite shells.
 *
 * ```tsx
 * <Layout
 *   fullHeight
 *   stickyHeader
 *   header={<Nav />}
 *   sider={<Sidenav />}
 *   siderHideBelow="md"
 *   content={<Article />}
 *   footer={<Copyright />}
 * />
 * ```
 */
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

	const main = (
		<main class={cx(classes.content, contentClass)}>
			{content}
			{children}
		</main>
	);

	return (
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
	);
}
