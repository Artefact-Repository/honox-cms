/**
 * content/pages/<slug>.json slugs that collide with a dedicated, more-specific
 * route directory of the same name (e.g. content/pages/blog.json backs
 * app/routes/blog/index.tsx's headerBrand/Nav content, not a standalone page
 * at "/blog"). Anything generically serving "/<slug>" from content/pages
 * must skip these, or it silently shadows the real route with a bare,
 * header-less, content-only page instead.
 *
 * Shared, no-Vite-API module (unlike app/lib/pages.ts, which uses
 * `import.meta.glob`) so both the SSR catch-all (app/routes/[page].tsx) and
 * the build-time static copy (vite.config.ts's copyContentPagesToRootPlugin)
 * can import it without pulling in Vite-only machinery. Keep in sync with any
 * new collection whose own index route might gain a same-named
 * content/pages/<name>.json for header/intro content.
 */
export const RESERVED_PAGE_SLUGS = new Set(["index", "blog", "docs"]);
