/**
 * Shared i18n utilities for route locale detection and link localization.
 *
 * Route structure:
 *   - docs/blog: /<locale?>/<collection>/<item>
 *     e.g. /fr/docs/AbsoluteCenter, /zh/blog/my-post — locale comes *before*
 *     the collection (app/routes/[locale]/docs/*, app/routes/[locale]/blog/*)
 *     so the locale-index route (`/:locale/docs`) doesn't collide with the
 *     English detail route (`/docs/:doc`) — same segment shape otherwise,
 *     and only one of two identically-shaped dynamic routes can ever be
 *     statically generated (see app/lib/i18n.ts's git history / PR notes for
 *     the collision this replaced).
 *   - pages (root-level content pages): /<item>/<locale?> (short form, e.g.
 *     /about/fr) or /pages/<locale?>/<item> (long form, still served as-is
 *     for existing links) — no collision risk there, so no reason to prefer
 *     locale-first.
 * The default locale (en) has no locale segment: /docs/AbsoluteCenter, /about.
 *
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
 * Prefixes a bare in-app href with the current locale — before the
 * collection segment for docs/blog, after it (short form) for pages.
 *
 *   /docs/Button   → /fr/docs/Button   (locale = "fr")
 *   /blog          → /fr/blog
 *   /about         → /about/fr         (root-level content page)
 *   /              → /fr
 *
 * No-op for the default locale, external hrefs, or already-localized paths.
 */
export function localiseHref(href: string, locale: string): string {
	if (locale === "en" || !href.startsWith("/")) return href;

	const segments = href.split("/").filter(Boolean);

	// Already localized in the old format? Let's convert it to the new format!
	if (
		segments.length >= 2 &&
		isLocale(segments[0]) &&
		(COLLECTIONS as readonly string[]).includes(segments[1]!)
	) {
		const lang = segments[0];
		const collection = segments[1]!;
		const rest = segments.slice(2).join("/");
		return rest ? `/${collection}/${lang}/${rest}` : `/${collection}/${lang}`;
	}

	// Already localized? Don't double-prefix.
	if (isLocale(segments[0])) return href; // e.g. /fr (homepage)
	if (isLocale(segments[1])) return href; // e.g. /docs/fr/...

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
		// here localizes straight to the short form (`/<slug>/<locale>`)
		// instead of `/pages/<locale>/<slug>`.
		if (collection === "pages") {
			return rest ? `/${rest}/${locale}` : `/${collection}/${locale}`;
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
	// canonically `/<slug>/<locale>` (e.g. "/about/zh", via
	// `app/routes/[page]/[locale].tsx`) — shorter than, but otherwise
	// equivalent to, `/pages/<locale>/<slug>` (still served as-is by
	// `app/routes/pages/<locale>/[slug].tsx` for existing links/bookmarks).
	if (segments.length === 1) {
		return `/${segments[0]}/${locale}`;
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

	// Old format: /<locale>/<collection>/<...>
	if (
		segments.length >= 2 &&
		segments[0] === locale &&
		(COLLECTIONS as readonly string[]).includes(segments[1]!)
	) {
		const collection = segments[1]!;
		const rest = segments.slice(2).join("/");
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

	// Short content-page route: /<slug>/<locale> (see localiseHref above) —
	// segments[0] deliberately isn't a known collection, so this can't
	// collide with the collection-route case just above (e.g. /blog/fr).
	if (
		segments.length === 2 &&
		segments[1] === locale &&
		!(COLLECTIONS as readonly string[]).includes(segments[0]!)
	) {
		return `/${segments[0]}`;
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
