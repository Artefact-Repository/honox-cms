/**
 * Shared i18n utilities for route locale detection and link localization.
 *
 * Route structure: /<locale?>/<collection?>/<item> — locale comes *before*
 * the collection/item everywhere (app/routes/[locale]/docs/*,
 * app/routes/[locale]/blog/*, app/routes/[locale]/pages/*, and the
 * app/routes/[locale]/[page].tsx shorthand that drops "pages" entirely).
 *
 *   /fr/docs/AbsoluteCenter   docs
 *   /zh/blog/my-post          blog
 *   /fr/pages/about           pages, long form (still served, old links)
 *   /fr/about                 pages, short form (canonical — no "pages" segment)
 *
 * Locale-first avoids a real router collision: an index route nested
 * *inside* the collection (e.g. a hypothetical `docs/[locale]/index.tsx`,
 * path `/docs/:locale`) has the identical segment shape to the English
 * detail route (`docs/[doc].tsx`, `/docs/:doc`) — same position, different
 * param name, and only one of two identically-shaped dynamic routes can
 * ever be statically generated. Putting `[locale]` first instead
 * (`/:locale/docs`) makes it a different shape entirely, so both coexist.
 *
 * A collection-first shape (`/docs/fr/...`) is still *recognized* (not
 * generated) for backward compatibility with old links.
 *
 * The default locale (en) has no locale segment: /docs/AbsoluteCenter, /about.
 * Language homepages remain at /<locale> (e.g. /fr, /zh).
 */

/** All supported locales, with the default first. */
export const ALL_LOCALES = ["en", "zh", "es", "pt", "fr", "de"] as const;

/** Translated-content locale codes (excludes the default "en"). */
export const TRANSLATED_LOCALES = ["zh", "es", "pt", "fr", "de"] as const;

/** Human-readable names for the language switcher dropdown. */
export const LOCALE_NAMES: Record<string, string> = {
	en: "English",
	zh: "中文",
	es: "Español",
	pt: "Português",
	fr: "Français",
	de: "Deutsch",
};

/** Route collections that support locale-scoped sub-paths. */
const COLLECTIONS = ["docs", "blog", "pages"] as const;

/**
 * Search box strings for blog pages (index, by-author, by-tag). `placeholder`
 * is used on the blog index (searches all articles in context); `placeholderAll`
 * is used on filtered views (by-author/by-tag) where the box explicitly
 * searches beyond the current filter.
 */
export const BLOG_SEARCH_STRINGS: Record<
	string,
	{ placeholder: string; placeholderAll: string; itemLabel: string }
> = {
	en: {
		placeholder: "Search articles...",
		placeholderAll: "Search all articles...",
		itemLabel: "articles",
	},
	zh: {
		placeholder: "搜索文章...",
		placeholderAll: "搜索所有文章...",
		itemLabel: "文章",
	},
	es: {
		placeholder: "Buscar artículos...",
		placeholderAll: "Buscar todos los artículos...",
		itemLabel: "artículos",
	},
	pt: {
		placeholder: "Buscar artigos...",
		placeholderAll: "Buscar todos os artigos...",
		itemLabel: "artigos",
	},
	fr: {
		placeholder: "Rechercher des articles...",
		placeholderAll: "Rechercher tous les articles...",
		itemLabel: "articles",
	},
	de: {
		placeholder: "Artikel suchen...",
		placeholderAll: "Alle Artikel suchen...",
		itemLabel: "Artikel",
	},
};

export function isLocale(value: string | undefined): value is string {
	return !!value && (TRANSLATED_LOCALES as readonly string[]).includes(value);
}

/**
 * Detects the locale from a request path.
 *
 * Handles both patterns:
 *   /<collection>/<locale>/<...>  →  locale is the 2nd segment
 *   /<locale>                    →  locale is the 1st segment (language homepage)
 * Returns "en" when no locale is found.
 */
export function detectLocale(path: string): string {
	const segments = path.split("/").filter(Boolean);
	// Locale-first (canonical for docs/blog): /<locale>/<collection>/...
	if (
		segments.length >= 2 &&
		isLocale(segments[0]) &&
		(COLLECTIONS as readonly string[]).includes(segments[1]!)
	) {
		return segments[0];
	}
	// Collection-first (canonical for pages; still recognized for docs/blog
	// too, for any old /docs/<locale>/... links): /<collection>/<locale?>/...
	if (
		segments.length >= 1 &&
		(COLLECTIONS as readonly string[]).includes(segments[0]!)
	) {
		if (isLocale(segments[1])) return segments[1];
		return "en";
	}
	// Root route: /<locale?>
	if (isLocale(segments[0])) return segments[0];
	return "en";
}

/**
 * Prefixes a bare in-app href with the current locale — always before the
 * item, with the collection segment ("docs"/"blog") kept but "pages"
 * dropped entirely (see the top-of-file doc comment).
 *
 *   /docs/Button   → /fr/docs/Button   (locale = "fr")
 *   /blog          → /fr/blog
 *   /about         → /fr/about         (root-level content page)
 *   /              → /fr
 *
 * No-op for the default locale, external hrefs, or already-localised paths.
 */
export function localiseHref(href: string, locale: string): string {
	if (locale === "en" || !href.startsWith("/")) return href;

	const segments = href.split("/").filter(Boolean);

	// Already localised? Don't double-prefix. Since locale-first is the
	// canonical shape, `isLocale(segments[0])` alone (a CMS-authored href
	// that's already e.g. "/zh/blog" or "/zh/about") is enough to no-op —
	// every anchor/link href passes through this function unconditionally
	// (see the `anchor`/`link` cases in page-registry.tsx), so re-processing
	// an already-correct href must never rewrite it.
	if (isLocale(segments[0])) return href; // e.g. /fr, /fr/blog, /fr/about
	if (isLocale(segments[1])) return href; // e.g. /docs/fr/... (legacy shape)

	// Collection route.
	if (
		segments.length >= 1 &&
		(COLLECTIONS as readonly string[]).includes(segments[0]!)
	) {
		const collection = segments[0]!;
		const rest = segments.slice(1).join("/");
		// "pages" is special: unlike docs/blog, its bare English rendering is
		// itself only a build-time duplicate of the true canonical `/<slug>`
		// (see app/routes/[page].tsx + vite.config.ts's
		// copyContentPagesToRootPlugin) — so a `/pages/<slug>` href reaching
		// here localises straight to the short form (`/<locale>/<slug>`,
		// dropping "pages" entirely) instead of `/<locale>/pages/<slug>`.
		if (collection === "pages") {
			return `/${locale}${rest ? `/${rest}` : ""}`;
		}
		// docs/blog: locale comes *first* (`/docs/Foo` → `/de/docs/Foo`, not
		// `/docs/de/Foo`) — app/routes/[locale]/docs/[doc].tsx et al. put the
		// `[locale]` directory ahead of the collection so the index route
		// (`app/routes/[locale]/docs/index.tsx`, path `/:locale/docs`) doesn't
		// collide with `docs/[doc].tsx` (`/docs/:doc`) — same segment shape,
		// only one of two same-shape dynamic routes can ever be statically
		// generated, which is exactly what broke when `[locale]` was nested
		// inside the collection instead (`docs/[locale]/index.tsx`, `/docs/:locale`).
		return rest
			? `/${locale}/${collection}/${rest}`
			: `/${locale}/${collection}`;
	}

	// Bare single-segment path outside any known collection (e.g. "/about") —
	// a root-level content page (`content/pages/<slug>.json`, served at
	// `/<slug>` for English by `app/routes/[page].tsx`). Its translations are
	// canonically `/<locale>/<slug>` (e.g. "/zh/about", via
	// `app/routes/[locale]/[page].tsx`) — shorter than, but otherwise
	// equivalent to, `/<locale>/pages/<slug>` (still served as-is by
	// `app/routes/[locale]/pages/[slug].tsx` for existing links/bookmarks).
	if (segments.length === 1) {
		return `/${locale}/${segments[0]}`;
	}

	// Homepage: prefix with locale, no trailing slash (`/` → `/fr`, not `/fr/`)
	// — the language homepage route is `/<locale>`, and a trailing slash
	// doesn't match it on every static host.
	if (href === "/") return `/${locale}`;

	// Non-collection path (e.g. "/some/nested/path"): prefix with locale.
	return `/${locale}${href}`;
}

/**
 * Strips the locale segment from a path, returning the bare (default-locale)
 * path. Handles collection routes in either segment order (locale-first is
 * canonical for docs/blog, but a collection-first `/docs/fr/...` still
 * strips correctly too, for any old links), plus the language homepage.
 *
 *   /fr/docs/AbsoluteCenter  → /docs/AbsoluteCenter  (locale = "fr")
 *   /fr/blog                 → /blog
 *   /fr                      → /
 */
export function stripLocale(path: string, locale: string): string {
	const segments = path.split("/").filter(Boolean);

	// "pages" collection route at the default locale (e.g. /pages/about, the
	// shape SSG actually renders `/about` with — see the copy-plugin comment
	// in localiseHref above) — its true bare form drops the "pages" prefix
	// entirely, unlike docs/blog which keep theirs even at the default locale.
	if (locale === "en" && segments.length === 2 && segments[0] === "pages") {
		return `/${segments[1]}`;
	}

	if (locale === "en") return path;

	// Locale-first: /<locale>/<collection>/<...> — canonical shape for
	// docs/blog/pages routes (app/routes/[locale]/docs|blog|pages/*).
	if (
		segments.length >= 2 &&
		segments[0] === locale &&
		(COLLECTIONS as readonly string[]).includes(segments[1]!)
	) {
		const collection = segments[1]!;
		const rest = segments.slice(2).join("/");
		// "pages" strips fully bare (see the localiseHref comment above).
		if (collection === "pages" && rest) {
			return `/${rest}`;
		}
		return rest ? `/${collection}/${rest}` : `/${collection}`;
	}

	// Collection route: /<collection>/<locale>/<...>
	if (
		segments.length >= 2 &&
		(COLLECTIONS as readonly string[]).includes(segments[0]!) &&
		segments[1] === locale
	) {
		const collection = segments[0]!;
		const rest = segments.slice(2).join("/");
		// "pages" strips fully bare (see the localiseHref comment above).
		if (collection === "pages" && rest) {
			return `/${rest}`;
		}
		return rest ? `/${collection}/${rest}` : `/${collection}`;
	}

	// Short content-page route: /<locale>/<page> (see localiseHref above) —
	// segments[1] deliberately isn't a known collection, so this can't
	// collide with the locale-first collection-route case above (e.g. /fr/blog).
	if (
		segments.length === 2 &&
		segments[0] === locale &&
		!(COLLECTIONS as readonly string[]).includes(segments[1]!)
	) {
		return `/${segments[1]}`;
	}

	// Root route: /<locale>/<...>
	if (segments.length >= 1 && segments[0] === locale) {
		const rest = segments.slice(1).join("/");
		return rest ? `/${rest}` : "/";
	}

	return path;
}

/**
 * Builds the URL for the same page in a different locale.
 *
 *   /docs/fr/AbsoluteCenter, fr → en : /docs/AbsoluteCenter
 *   /docs/AbsoluteCenter,  en → fr : /docs/fr/AbsoluteCenter
 *   /fr,                   fr → en : /
 *   /,                     en → fr : /fr
 */
export function localeToggleUrl(
	currentPath: string,
	currentLocale: string,
	targetLocale: string,
): string {
	const bare = stripLocale(currentPath, currentLocale);
	if (targetLocale === "en") return bare;
	return localiseHref(bare, targetLocale);
}
