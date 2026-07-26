import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { isLocale, TRANSLATED_LOCALES } from "../../lib/i18n";
import indexRoute from "../index";

// Reuse the exact same per-request handler as the unprefixed "/" route —
// detectLocale() reads the locale straight off the URL path, so the handler
// itself needs no changes to also serve this locale-prefixed variant.
const [indexHandler] = indexRoute;

export default createRoute(
	ssgParams(() => TRANSLATED_LOCALES.map((locale) => ({ locale }))),
	// app/routes/[page].tsx falls through to `next()` for *any* unmatched
	// page slug (not just locale codes), so without this guard a typo'd or
	// missing page slug would land here and silently render the homepage
	// instead of 404ing.
	(c, next) => {
		if (!isLocale(c.req.param("locale"))) return next();
		return indexHandler(c);
	},
);
