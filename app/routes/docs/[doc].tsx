import { css } from "design-system/css";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import type { ComponentBlock } from "../../components/block-types";
import { renderBlocks } from "../../components/page-registry";
import {
	Anchor,
	Badge,
	Collapsible,
	Heading,
	Layout,
	type LayoutProps,
	Stack,
	Text,
} from "../../components/ui";
import { ArrowLeftIcon as ArrowLeftIconImport } from "../../icons/arrow-left";
import { ArrowRightIcon as ArrowRightIconImport } from "../../icons/arrow-right";
import { ChevronDownIcon } from "../../icons/chevron-down";
import { ExternalLinkIcon as ExternalLinkIconImport } from "../../icons/external-link";
import { GitHubIcon as GitHubIconImport } from "../../icons/github";
import {
	DEFAULT_DOCS_UI,
	type DocsConfig,
	type DocsNavLinkConfig,
	type HydrationTierConfig,
	loadDocsConfig,
} from "../../lib/configs";
import { type DocSummary, loadDocBySlug, loadDocs } from "../../lib/docs";
import { detectLocale, isLocale, localiseHref } from "../../lib/i18n";
import { markdownContentClass } from "../../utils/markdown-content-style";

// ---------------------------------------------------------------------------
// Inlined docs nav shell.
//
// Previously extracted into `app/components/docs-nav.tsx` and imported by every
// docs route. Intentionally un-DRY now: the header, sidenav and shell styling
// live directly in this page so there is no shared nav component to import.
// (Only the pure data types come from `lib/docs.ts` — importing a type is not
// importing a component.)
// ---------------------------------------------------------------------------

function isGithubLink(link: DocsNavLinkConfig): boolean {
	try {
		return new URL(link.href).hostname === "github.com";
	} catch {
		return false;
	}
}

const GitHubIcon = () => <GitHubIconImport width="20" height="20" />;
const ExternalLinkIcon = () => (
	<ExternalLinkIconImport width="16" height="16" />
);

interface DocGroup {
	label: string;
	items: DocSummary[];
}

// Sorts by position in `order` (a list of slugs from the CMS singleton's
// `docOrder`), pushing anything not listed to the end in its incoming
// (alphabetical, per loadDocs) order. `order` is undefined/empty for
// collections that haven't configured manual ordering yet, in which case
// this is a no-op.
function applyDocOrder(items: DocSummary[], order?: string[]): DocSummary[] {
	if (!order || order.length === 0) return items;
	const rank = new Map(order.map((slug, index) => [slug, index]));
	return [...items].sort((a, b) => {
		const rankA = rank.get(a.slug);
		const rankB = rank.get(b.slug);
		if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
		if (rankA !== undefined) return -1;
		if (rankB !== undefined) return 1;
		return 0;
	});
}

// Fully data-driven: each configured group claims every doc matching its
// `section` and/or `category` filter (both are AND'd when both are set),
// ordered by the CMS singleton's `docOrder` (falling back to the incoming
// alphabetical order for anything not listed there). Anything no group
// claims falls into a trailing fallback group, so this stays usable for any
// doc collection shape without editing this file.
//
// `config` is already the locale-specific configs.<locale>.json (see
// loadDocsConfig in lib/configs.ts): group `label`/`fallbackLabel` are
// genuinely translated per locale (i18n: true), while `section`/`category`/
// `docOrder` are matching keys that stay in English across every locale file
// (i18n: duplicate) — matching the `category` frontmatter field on doc/mdx
// content, which is also i18n: duplicate and therefore always English
// regardless of the doc's own locale. So no runtime translation/lookup is
// needed here: loading the right file already gives the right language.
function buildDocGroups(docs: DocSummary[], config: DocsConfig): DocGroup[] {
	const claimed = new Set<string>();

	const groups = config.groups
		.map((groupConfig) => {
			const items = docs.filter((doc) => {
				if (groupConfig.section && doc.section !== groupConfig.section) {
					return false;
				}
				if (groupConfig.category && doc.category !== groupConfig.category) {
					return false;
				}
				return true;
			});
			for (const doc of items) claimed.add(doc.slug);
			return {
				label: groupConfig.label,
				items: applyDocOrder(items, config.docOrder),
			};
		})
		.filter((group) => group.items.length > 0);

	const unclaimed = docs.filter((doc) => !claimed.has(doc.slug));
	if (unclaimed.length > 0) {
		groups.push({
			label: config.fallbackLabel || "Other",
			items: applyDocOrder(unclaimed, config.docOrder),
		});
	}

	return groups;
}

/** Flattens the sidenav's grouped/ordered doc list back into one sequence,
 * so the previous/next pager below the doc content follows exactly the
 * order a reader sees in the sidenav (config.groups order, docOrder within
 * each, fallback group last) rather than re-deriving its own ordering. */
function flattenDocGroups(groups: DocGroup[]): DocSummary[] {
	return groups.flatMap((group) => group.items);
}

interface DocsSidenavProps {
	groups: DocGroup[];
	activeSlug?: string;
	links?: DocsNavLinkConfig[];
	currentLocale?: string;
}

function DocsSidenav({
	groups,
	activeSlug,
	links,
	currentLocale = "en",
}: DocsSidenavProps) {
	const localiseLink = (href: string) => localiseHref(href, currentLocale);

	return (
		<nav
			class={css({
				display: "flex",
				flexDirection: "column",
				gap: "6",
			})}
		>
			{groups.map((group) => (
				<Collapsible
					key={group.label}
					interactive
					defaultOpen
					trigger={
						<button
							type="button"
							class={css({
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								width: "full",
								mb: "2",
							})}
						>
							<Text
								size="xs"
								class={css({
									fontWeight: "semibold",
									textTransform: "uppercase",
									letterSpacing: "wide",
									color: "fg.muted",
								})}
							>
								{group.label}
							</Text>
						</button>
					}
					indicator={
						<ChevronDownIcon
							width="14"
							height="14"
							class={css({
								color: "fg.muted",
								transition: "transform 0.2s",
								"[data-state=open] &": { transform: "rotate(180deg)" },
							})}
						/>
					}
					content={
						<div
							class={css({
								display: "flex",
								flexDirection: "column",
								gap: "0.5",
							})}
						>
							{group.items.map((doc) => {
								const isActive = doc.slug === activeSlug;
								return (
									<a
										key={doc.slug}
										href={localiseLink(`/docs/${doc.slug}`)}
										aria-current={isActive ? "page" : undefined}
										class={css({
											display: "block",
											px: "3",
											// ~44px touch target on mobile; compact on desktop
											py: { base: "2.5", md: "1.5" },
											borderRadius: "md",
											fontSize: "sm",
											textDecoration: "none",
											color: isActive ? "fg" : "fg.muted",
											bg: isActive ? "colorPalette.4" : "transparent",
											fontWeight: isActive ? "semibold" : "normal",
											_hover: {
												bg: isActive ? "colorPalette.4" : "bg.subtle",
												color: "fg",
											},
										})}
									>
										{doc.title}
									</a>
								);
							})}
						</div>
					}
				/>
			))}
			{links && links.length > 0 && (
				<div
					class={css({
						borderTopWidth: "1px",
						borderColor: "border",
						pt: "4",
						display: "flex",
						flexDirection: "column",
						gap: "0.5",
					})}
				>
					{links.map((link) => (
						<Anchor
							key={link.href}
							href={link.href}
							target="_blank"
							rel="noopener noreferrer"
							variant="plain"
							class={css({
								display: "flex",
								alignItems: "center",
								gap: "2",
								px: "3",
								py: { base: "2.5", md: "1.5" },
								borderRadius: "md",
								fontSize: "sm",
								textDecoration: "none",
								color: "fg.muted",
								_hover: {
									bg: "bg.subtle",
									color: "fg",
								},
							})}
						>
							{isGithubLink(link) ? <GitHubIcon /> : <ExternalLinkIcon />}
							{link.label}
						</Anchor>
					))}
				</div>
			)}
		</nav>
	);
}

interface HeaderActionsProps {
	headerItems?: ComponentBlock[];
	/** The (already per-doc-patched, for the desktop header — see
	 * `withDocEditLink`) Edit/Admin link block, reused here verbatim so the
	 * mobile disclosure shows the exact same block rather than a second,
	 * separately-hardcoded one. */
	adminBlock?: ComponentBlock;
	currentPath: string;
	currentLocale: string;
	/** Smaller text/controls for the mobile disclosure panel vs. the desktop
	 * header row. */
	compact?: boolean;
}

// The actions shared between the desktop header row (`nav`, hidden below
// `md`) and Layout's built-in mobile disclosure (`mobileNav`, which takes
// over below `md` via `siderHideBelow`) — headerItems (incl. the GitHub
// icon link, CMS-authored via `config.headerItems`) plus the Edit/Admin
// link. Rendered from a single function so both stay in sync.
function HeaderActions({
	headerItems,
	adminBlock,
	currentPath,
	currentLocale,
	compact,
}: HeaderActionsProps) {
	const textStyle = compact ? "xs" : "sm";

	return (
		<>
			{renderBlocks(headerItems, {
				locale: currentLocale,
				currentPath,
				class: css({ textStyle, fontWeight: "medium" }),
			})}
			{adminBlock &&
				renderBlocks([adminBlock], {
					locale: currentLocale,
					currentPath,
					class: css({ textStyle, fontWeight: "medium" }),
				})}
		</>
	);
}

/** `config.header` (see `DocsConfig.header`) is a fully static, self-
 * contained content tree — except its nav cluster's hand-authored Admin
 * link (`href: "/admin"`), which on an individual doc page should instead
 * be an Edit deep-link for *this* doc. The CMS can't know which doc a
 * reader is on, so this patches that one block at render time rather than
 * threading per-request state into page-registry.tsx. Matches on `href` (a
 * stable, already-meaningful field), not array position, and recurses into
 * `children` since the link sits inside a nested nav `stack`. */
function withDocEditLink(
	blocks: ComponentBlock[] | undefined,
	editUrl: string,
	editLabel: string,
): ComponentBlock[] | undefined {
	if (!blocks) return blocks;
	return blocks.map((block) => {
		if (block.blockType === "link" && block["href"] === "/admin") {
			return {
				...block,
				href: editUrl,
				children: [{ blockType: "text", content: editLabel }],
			};
		}
		if (Array.isArray(block["children"])) {
			return {
				...block,
				children: withDocEditLink(block["children"], editUrl, editLabel),
			};
		}
		return block;
	});
}

/** Finds the first block matching `predicate`, recursing into `children`.
 * Used to pull the (already per-doc-patched) Edit/Admin link back out of
 * `config.header`'s tree so the mobile disclosure (`HeaderActions`) can
 * render the exact same block instead of a second hardcoded one. */
function findBlock(
	blocks: ComponentBlock[] | undefined,
	predicate: (block: ComponentBlock) => boolean,
): ComponentBlock | undefined {
	if (!blocks) return undefined;
	for (const block of blocks) {
		if (predicate(block)) return block;
		const found = findBlock(block["children"], predicate);
		if (found) return found;
	}
	return undefined;
}

/** CMS Edit deep-link for a doc, honoring the Collections mapping from the
 * DocsConfig singleton. `||` rather than `??`: an untouched optional CMS
 * field arrives as "" and must fall back to the folder name too. */
function docEditUrl(doc: DocSummary, config: DocsConfig): string {
	const cmsCollection =
		config.collections?.find((c) => c.folder === doc.collection)
			?.cmsCollection || doc.collection;
	return `/admin/#/collections/${cmsCollection}/entries/${doc.slug}`;
}

/** Shared `<Layout>` props for the docs shell, so every docs route renders
 * the identical frame: viewport-filling canvas, sticky glass header, and a
 * sticky sider rail that hides below `md` (Layout's built-in `mobileNav`
 * disclosure takes over there). Spread first, then pass the route's
 * header/sider/content/mobileNavActions. */
const docsShellProps = {
	fullHeight: true,
	stickyHeader: true,
	stickySider: true,
	siderHideBelow: "md",
	mobileNav: true,
	class: css({ bg: "bg.canvas" }),
	headerClass: css({
		borderBottomWidth: "1px",
		borderColor: { _light: "white.a4", _dark: "black.a4" },
		bg: { _light: "white.a7", _dark: "black.a7" },
		backdropFilter: "blur(20px) saturate(180%)",
		boxShadow: {
			_light:
				"inset 0 1px 0 0 rgba(255, 255, 255, 0.5), 0 4px 30px rgba(0, 0, 0, 0.03)",
			_dark:
				"inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 4px 30px rgba(0, 0, 0, 0.2)",
		},
	}),
	bodyClass: css({
		maxWidth: "7xl",
		width: "full",
		mx: "auto",
		px: { base: "4", md: "6", lg: "8" },
		py: { base: "8", md: "12" },
		gap: "10",
	}),
	// The sider top clears the sticky glass header (~4.5rem tall) plus a gap
	// so the first nav group isn't blurred behind it while scrolling.
	siderClass: css({
		top: "24",
		maxH: "calc(100vh - 7rem)",
	}),
} satisfies Partial<LayoutProps>;

const TIER_COLOR: Record<number, string> = {
	1: "purple",
	2: "blue",
	3: "gray",
};

function tierLabel(
	tiers: HydrationTierConfig[] | undefined,
	tier: number,
): string {
	return tiers?.find((t) => t.tier === tier)?.label ?? `Tier ${tier}`;
}

interface DocPagerLinkProps {
	doc: DocSummary;
	direction: "prev" | "next";
	label: string;
	currentLocale: string;
}

function DocPagerLink({
	doc,
	direction,
	label,
	currentLocale,
}: DocPagerLinkProps) {
	const isPrev = direction === "prev";
	return (
		<Anchor
			href={localiseHref(`/docs/${doc.slug}`, currentLocale)}
			variant="plain"
			class={css({
				display: "flex",
				flexDirection: "column",
				gap: "1",
				flex: "1",
				px: "4",
				py: "3",
				borderWidth: "1px",
				borderColor: "border",
				borderRadius: "lg",
				textDecoration: "none",
				alignItems: isPrev ? "flex-start" : "flex-end",
				textAlign: isPrev ? "left" : "right",
				_hover: {
					borderColor: "colorPalette.7",
					bg: "bg.subtle",
				},
			})}
		>
			<Stack direction="horizontal" gap="1" align="center">
				{isPrev && <ArrowLeftIconImport width="14" height="14" />}
				<Text size="xs" class={css({ color: "fg.muted" })}>
					{label}
				</Text>
				{!isPrev && <ArrowRightIconImport width="14" height="14" />}
			</Stack>
			<Text size="sm" class={css({ fontWeight: "medium", color: "fg" })}>
				{doc.title}
			</Text>
		</Anchor>
	);
}

interface DocPagerProps {
	prevDoc?: DocSummary;
	nextDoc?: DocSummary;
	currentLocale: string;
	previousLabel: string;
	nextLabel: string;
}

// Two-up prev/next footer nav, driven entirely by `flattenDocGroups`'s
// sidenav-order sequence (see there) — no separate ordering logic here.
function DocPager({
	prevDoc,
	nextDoc,
	currentLocale,
	previousLabel,
	nextLabel,
}: DocPagerProps) {
	if (!prevDoc && !nextDoc) return null;
	return (
		<Stack
			direction="horizontal"
			gap="4"
			class={css({
				mt: "10",
				pt: "6",
				borderTopWidth: "1px",
				borderColor: "border",
			})}
		>
			{prevDoc ? (
				<DocPagerLink
					doc={prevDoc}
					direction="prev"
					label={previousLabel}
					currentLocale={currentLocale}
				/>
			) : (
				<div class={css({ flex: "1" })} />
			)}
			{nextDoc && (
				<DocPagerLink
					doc={nextDoc}
					direction="next"
					label={nextLabel}
					currentLocale={currentLocale}
				/>
			)}
		</Stack>
	);
}

export default createRoute(
	ssgParams(async () => {
		const docs = await loadDocs();
		return docs.map((doc) => ({ doc: doc.slug }));
	}),

	async function handler(c) {
		const slug = c.req.param("doc");
		if (isLocale(slug)) {
			const next = arguments[1];
			return next();
		}
		const currentPath = c.req.path;
		// Content locale drives loadDocs/loadDocBySlug/loadDocsConfig and the
		// header/sidenav chrome (search placeholder, Edit/Admin, link labels,
		// locale switcher) uniformly for every locale.
		const currentLocale = detectLocale(currentPath);
		const [doc, docs, config] = await Promise.all([
			loadDocBySlug(slug, currentLocale),
			loadDocs(currentLocale),
			loadDocsConfig(currentLocale),
		]);

		if (!doc) {
			return c.notFound();
		}

		const groups = buildDocGroups(docs, config);
		const flatDocs = flattenDocGroups(groups);
		const currentIndex = flatDocs.findIndex((d) => d.slug === slug);
		const prevDoc = currentIndex > 0 ? flatDocs[currentIndex - 1] : undefined;
		const nextDoc =
			currentIndex >= 0 && currentIndex < flatDocs.length - 1
				? flatDocs[currentIndex + 1]
				: undefined;
		const DocContent = doc.Component;
		const ui = { ...DEFAULT_DOCS_UI, ...config.docsUi };
		const editUrl = docEditUrl(doc, config);
		const headerBlocks = withDocEditLink(config.header, editUrl, ui.edit);
		const adminBlock = findBlock(
			headerBlocks,
			(block) => block.blockType === "link" && block["href"] === editUrl,
		);

		return c.render(
			<Layout
				{...docsShellProps}
				// Fully CMS content (`config.header` — see `DocsConfig.header`),
				// aside from `withDocEditLink`'s one per-doc patch above. No
				// hardcoded shell left. `renderBlocks` (not `<PageRenderer>`,
				// which doesn't take a second argument) so `locale`/`currentPath`
				// reach the search box and language dropdown nested inside it.
				header={
					<>
						{renderBlocks(headerBlocks, {
							locale: currentLocale,
							currentPath,
						})}
					</>
				}
				sider={
					<DocsSidenav
						groups={groups}
						activeSlug={slug}
						links={config.links}
						currentLocale={currentLocale}
					/>
				}
				mobileNavLabel={ui.menu}
				mobileNavActions={
					<HeaderActions
						adminBlock={adminBlock}
						headerItems={config.headerItems}
						currentPath={currentPath}
						currentLocale={currentLocale}
						compact
					/>
				}
				content={
					<>
						<title>{doc.title} - Docs - Artefact</title>

						{/* Bigger than the content's own h1s (markdownContentClass fixes
						    those at "2xl") so the page title reads as a distinct, higher
						    level of hierarchy rather than just another section heading.
						    Deliberately a flat literal size, not a responsive object: this
						    repo's staticCss config can't statically generate responsive
						    recipe-variant classes (no `jsx: [...]` mapping — see
						    panda.config.ts's staticCss.recipes comment), so a `{ base, md }`
						    value here renders the right classes in HTML but with no
						    matching CSS ever emitted for the breakpoint-scoped one. */}
						<Heading as="h1" size="3xl" class={css({ mb: "6" })}>
							{doc.title}
						</Heading>

						{(doc.category || doc.hydration) && (
							<Stack
								direction="horizontal"
								gap="2"
								align="center"
								class={css({ mb: "6" })}
							>
								{doc.category && (
									<Badge variant="subtle" colorPalette="cyan" size="sm">
										{doc.category}
									</Badge>
								)}
								{doc.hydration && (
									<Badge
										variant="subtle"
										colorPalette={TIER_COLOR[doc.hydration] ?? "gray"}
										size="sm"
									>
										{tierLabel(config.hydrationTiers, doc.hydration)}
									</Badge>
								)}
							</Stack>
						)}

						{DocContent ? (
							<div class={markdownContentClass}>
								<DocContent />
							</div>
						) : (
							<div
								class={markdownContentClass}
								dangerouslySetInnerHTML={{ __html: doc.html ?? "" }}
							/>
						)}

						<DocPager
							prevDoc={prevDoc}
							nextDoc={nextDoc}
							currentLocale={currentLocale}
							previousLabel={ui.previous}
							nextLabel={ui.next}
						/>
					</>
				}
			/>,
		);
	},
);
