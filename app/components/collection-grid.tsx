import { css } from "design-system/css";
import { ArrowRightIcon } from "../icons/arrow-right";
import type { DocSummary } from "../lib/docs";
import { localiseHref } from "../lib/i18n";
import type { BlogPost } from "../lib/posts";
import { Anchor, Avatar, Badge, Button, Card, Stack, Text } from "./ui";

interface CollectionGridBaseProps {
	currentLocale: string;
	/** Desktop column count (the `lg` breakpoint) — `sm`/`md` step down to 2,
	 * `base` is always 1. CMS-editable via `content/pages/*.json`'s
	 * `collectionGrid.columns`; defaults match this component's pre-migration
	 * hardcoded values so pages/locales that never set the field render
	 * identically to before. */
	columns?: string;
	/** Panda spacing token. CMS-editable via `collectionGrid.gap`. */
	gap?: string;
}

type CollectionGridProps =
	| ({ source: "docs"; docs: DocSummary[] } & CollectionGridBaseProps)
	| ({
			source: "posts";
			posts: BlogPost[];
			matchedSlugs: Set<string>;
	  } & CollectionGridBaseProps);

function DocCard({
	doc,
	currentLocale,
}: {
	doc: DocSummary;
	currentLocale: string;
}) {
	return (
		<Anchor
			href={localiseHref(`/docs/${doc.slug}`, currentLocale)}
			variant="plain"
			class={css({ textDecoration: "none" })}
		>
			<Card
				variant="outline"
				class={css({
					height: "full",
					transition: "all 0.2s",
					_hover: {
						borderColor: "blue.4",
						shadow: "md",
						transform: "translateY(-2px)",
					},
				})}
				title={doc.title}
				bodyClass={css({ p: "5" })}
			>
				<Text size="sm" class={css({ color: "fg.muted" })}>
					{doc.category ?? doc.section}
				</Text>
			</Card>
		</Anchor>
	);
}

function PostCard({
	post,
	index,
	matchedSlugs,
	currentLocale,
}: {
	post: BlogPost;
	index: number;
	matchedSlugs: Set<string>;
	currentLocale: string;
}) {
	const localiseLink = (href: string) => localiseHref(href, currentLocale);
	return (
		<div data-post-slug={post.slug} hidden={!matchedSlugs.has(post.slug)}>
			<Card
				variant="outline"
				class={css({
					transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
					_hover: {
						transform: "translateY(-4px)",
						shadow: "lg",
						borderColor: "blue.4",
					},
					overflow: "hidden",
					position: "relative",
					animation: "fade-in-up",
					animationDelay: `${index * 0.1}s`,
					animationFillMode: "both",
				})}
				image={
					post.cover ? (
						<div
							class={css({
								w: "full",
								h: "48",
								overflow: "hidden",
								position: "relative",
							})}
						>
							<img
								src={post.cover}
								alt={post.title}
								class={css({
									w: "full",
									h: "full",
									objectFit: "cover",
									transition: "transform 0.3s",
									_cardRootHover: {
										transform: "scale(1.05)",
									},
								})}
							/>
							<div
								class={css({
									position: "absolute",
									bottom: "0",
									left: "0",
									right: "0",
									h: "50%",
									bgGradient: "to-t",
									gradientFrom: "gray.a1",
									gradientTo: "transparent",
									pointerEvents: "none",
								})}
							/>
						</div>
					) : undefined
				}
				title={
					<a
						href={localiseLink(`/blog/${post.slug}`)}
						class={css({
							color: "fg",
							textDecoration: "none",
							transition: "color 0.2s",
							_hover: { color: "blue.10" },
						})}
					>
						{post.title}
					</a>
				}
				description={post.description}
				headerClass={css({ p: "6", pb: "0" })}
				bodyClass={css({ p: "6", pt: "3" })}
				footerClass={css({ p: "6", pt: "0" })}
				footer={
					<Stack
						gap="0"
						align="center"
						justify="space-between"
						class={css({
							pt: "4",
							borderTopWidth: "1px",
							borderColor: "border.subtle",
							width: "full",
						})}
					>
						<Stack gap="2.5" align="center">
							<Anchor
								href={localiseLink(`/blog/by-author/${post.author}`)}
								class={css({
									display: "inline-flex",
									alignItems: "center",
									textDecoration: "none",
								})}
							>
								<Avatar size="sm" variant="solid" name={post.author} />
							</Anchor>
							<div>
								<Anchor
									href={localiseLink(`/blog/by-author/${post.author}`)}
									class={css({
										textDecoration: "none",
										color: "fg",
										_hover: { color: "blue.10" },
									})}
								>
									<Text
										size="sm"
										class={css({
											fontWeight: "medium",
											lineHeight: "tight",
											display: "block",
											color: "inherit",
										})}
									>
										{post.author}
									</Text>
								</Anchor>
								<Stack gap="2" align="center" class={css({ mt: "0.5" })}>
									<Text size="xs" class={css({ color: "fg.muted" })}>
										{new Date(post.date).toLocaleDateString(
											currentLocale === "zh" ? "zh-CN" : "en-US",
											{ month: "short", day: "numeric", year: "numeric" },
										)}
									</Text>
									<Text size="xs" class={css({ color: "fg.muted" })}>
										· {post.readTime}
									</Text>
								</Stack>
							</div>
						</Stack>

						<a
							href={localiseLink(`/blog/${post.slug}`)}
							class={css({
								textDecoration: "none",
								display: "inline-flex",
								alignItems: "center",
								gap: "1",
								transition: "all 0.2s",
							})}
						>
							<Button
								variant="plain"
								size="sm"
								class={css({
									px: "2",
									_hover: { bg: "blue.3" },
								})}
							>
								{currentLocale === "zh" ? "阅读更多" : "Read more"}
								<ArrowRightIcon width="14" height="14" />
							</Button>
						</a>
					</Stack>
				}
			>
				<div>
					{post.draft && (
						<div
							class={css({
								position: "absolute",
								top: "3",
								right: "3",
								zIndex: "10",
							})}
						>
							<Badge variant="solid" colorPalette="orange" size="sm">
								{currentLocale === "zh" ? "草稿" : "Draft"}
							</Badge>
						</div>
					)}

					{post.tags.length > 0 && (
						<Stack gap="2" wrap="wrap" class={css({ mb: "3" })}>
							{post.tags.slice(0, 3).map((tag) => (
								<Anchor
									key={tag}
									href={localiseLink(`/blog/by-tag/${tag}`)}
									variant="plain"
									class={css({ textDecoration: "none" })}
								>
									<Badge
										variant="subtle"
										size="sm"
										class={css({
											borderRadius: "full",
											px: "2.5",
											py: "0.5",
											fontSize: "xs",
											transition: "all 0.2s",
											_hover: { bg: "blue.4" },
										})}
									>
										{tag}
									</Badge>
								</Anchor>
							))}
							{post.tags.length > 3 && (
								<Badge
									variant="subtle"
									colorPalette="gray"
									size="sm"
									class={css({
										borderRadius: "full",
										px: "2.5",
										py: "0.5",
										fontSize: "xs",
									})}
								>
									+{post.tags.length - 3}
								</Badge>
							)}
						</Stack>
					)}
				</div>
			</Card>
		</div>
	);
}

/** Shared, CMS-configurable (via `content/pages/*.json`'s `collectionGrid`
 * field — see `public/admin/config.yml`) card grid for the docs and blog
 * index pages. Not a `page-registry.tsx` block type: that registry's
 * `BlockRenderer` is synchronous while `loadDocs`/`loadPosts` are async, so
 * the collection data is fetched by the route and handed in as a prop
 * instead. `source` is fixed by the caller (not CMS-editable) since an
 * editor-set mismatch between `source` and the supplied data prop would
 * silently render nothing. */
// Panda's static extractor needs each possible `gridTemplateColumns` value to
// appear as a literal string in source — a `columns` prop interpolated into
// a template string (e.g. `repeat(${columns}, 1fr)`) can't be discovered at
// build time and would silently emit no CSS for the `lg` breakpoint (the
// same class of bug documented for CMS-driven `colorPalette` values in
// `panda.config.ts`'s `staticCss` comment). So the CMS's small enumerated
// `columns` option set ("2"/"3"/"4") is mapped through a lookup of fully
// literal objects instead of interpolated.
const DOCS_GRID_TEMPLATES = {
	"2": { base: "1fr", sm: "repeat(2, 1fr)" },
	"3": { base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
	"4": { base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
} as const;

const POSTS_GRID_TEMPLATES = {
	"2": { base: "1fr", md: "repeat(2, 1fr)" },
	"3": { base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
	"4": { base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
} as const;

type GridColumns = keyof typeof DOCS_GRID_TEMPLATES;

function isGridColumns(value: string | undefined): value is GridColumns {
	return value === "2" || value === "3" || value === "4";
}

export function CollectionGrid(props: CollectionGridProps) {
	const { source, currentLocale, columns, gap } = props;
	const resolvedColumns = isGridColumns(columns) ? columns : "3";
	const gridTemplateColumns =
		source === "docs"
			? DOCS_GRID_TEMPLATES[resolvedColumns]
			: POSTS_GRID_TEMPLATES[resolvedColumns];

	return (
		<div
			class={css({
				display: "grid",
				gridTemplateColumns,
				gap: gap ?? (source === "posts" ? "6" : "4"),
			})}
		>
			{source === "docs"
				? props.docs.map((doc) => (
						<DocCard key={doc.slug} doc={doc} currentLocale={currentLocale} />
					))
				: props.posts.map((post, index) => (
						<PostCard
							key={post.slug}
							post={post}
							index={index}
							matchedSlugs={props.matchedSlugs}
							currentLocale={currentLocale}
						/>
					))}
		</div>
	);
}
