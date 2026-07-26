import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { loadDocs } from "../../../lib/docs";
import { TRANSLATED_LOCALES } from "../../../lib/i18n";
import docRoute from "../[doc]";

// Reuse the exact same per-request handler as the unprefixed /docs/:doc
// route — `createRoute(ssgParamsMiddleware, handler)` is a typed 2-tuple (see
// honox/factory), so index 1 is always the handler. detectLocale() reads the
// locale straight off the URL path, so the handler itself needs no changes to
// also serve this locale-prefixed variant.
const [, docHandler] = docRoute;

export default createRoute(
	ssgParams(async () => {
		const params: { locale: string; doc: string }[] = [];
		for (const locale of TRANSLATED_LOCALES) {
			const docs = await loadDocs(locale);
			for (const doc of docs) {
				params.push({ locale, doc: doc.slug });
			}
		}
		return params;
	}),
	docHandler,
);
