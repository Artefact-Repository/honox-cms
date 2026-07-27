import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { TRANSLATED_LOCALES } from "../../../lib/i18n";
import docsRoute from "../../docs/index";

// Reuse the exact same per-request handler as the unprefixed /docs route —
// detectLocale() reads the locale straight off the URL path, so the handler
// itself needs no changes to also serve this locale-prefixed variant.
//
// Safe to reuse directly (no `next()`/2-arg guard needed) because moving
// `[locale]` to be the *first* segment (`/:locale/docs`) means this route's
// shape no longer collides with `../[doc].tsx` (`/docs/:doc`) the way
// `docs/[locale]/index.tsx` (`/docs/:locale`) used to — that collision (same
// segment shape, different param name, only one ever wins during SSG) is why
// this used to require 5 hardcoded per-locale directories instead.
const [docsHandler] = docsRoute;

export default createRoute(
	ssgParams(() => TRANSLATED_LOCALES.map((locale) => ({ locale }))),
	docsHandler,
);
