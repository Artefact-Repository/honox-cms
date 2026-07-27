import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { TRANSLATED_LOCALES } from "../../../lib/i18n";
import blogRoute from "../../blog/index";

// Reuse the exact same per-request handler as the unprefixed /blog route —
// detectLocale() reads the locale straight off the URL path, so the handler
// itself needs no changes to also serve this locale-prefixed variant.
//
// Safe to reuse directly (no `next()`/2-arg guard needed) — see the sibling
// comment in ../docs/index.tsx for why moving `[locale]` first avoids the
// same-shape collision that used to require 5 hardcoded per-locale
// directories here.
const [blogHandler] = blogRoute;

export default createRoute(
	ssgParams(() => TRANSLATED_LOCALES.map((locale) => ({ locale }))),
	blogHandler,
);
