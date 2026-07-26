import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { TRANSLATED_LOCALES } from "../../../lib/i18n";
import docsRoute from "../index";

// Reuse the exact same per-request handler as the unprefixed /docs route —
// detectLocale() reads the locale straight off the URL path, so the handler
// itself needs no changes to also serve this locale-prefixed variant.
const [docsHandler] = docsRoute;

export default createRoute(
	ssgParams(() => TRANSLATED_LOCALES.map((locale) => ({ locale }))),
	docsHandler,
);
