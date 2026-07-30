// Direct-commit save path for the /settings page's "CMS Admin" card — same
// git host (fetch→edit→write) as settings-save.ts, but against
// public/admin/config.yml (YAML, Sveltia CMS's own bootstrap config) instead
// of content/configs.json. Parsed/rewritten via the `yaml` package's Document
// API (not a plain parse-to-object-then-stringify round trip) so the file's
// heavy use of anchors/aliases for the page-builder component schema, and its
// comments, survive untouched — only the specific fields this card owns are
// replaced. `maxAliasCount: -1` disables the parser's default anti-DoS alias
// limit (100), which this file's shared option lists trip well past — same
// reason git-backend.ts's getRepoConfig needs it to read this file at all.
import { parseDocument } from "yaml";
import { fetchFile, requireToken, updateFile } from "./git-backend";

const CONFIG_YML_PATH = "public/admin/config.yml";

export class CmsConfigSaveError extends Error {}

export interface CmsAdminSettings {
	backend: {
		name: string;
		repo: string;
		branch: string;
		baseUrl: string;
	};
	i18n: {
		structure: string;
		locales: string[];
		defaultLocale: string;
		omitDefaultLocaleFromFilePath: boolean;
	};
	media: {
		mediaFolder: string;
		publicFolder: string;
	};
}

/** Commits `next` into public/admin/config.yml, replacing only the fields
 * this card owns (backend/i18n/media_folder/public_folder) — everything
 * else in the file (collections, singletons, anchors, comments) passes
 * through the Document model untouched. */
export async function saveCmsAdminSettings(
	next: CmsAdminSettings,
): Promise<void> {
	const token = requireToken();
	const file = await fetchFile(CONFIG_YML_PATH, token);

	let doc: ReturnType<typeof parseDocument>;
	try {
		doc = parseDocument(file.content, { maxAliasCount: -1 });
	} catch {
		throw new CmsConfigSaveError("public/admin/config.yml is not valid YAML.");
	}

	doc.setIn(["backend", "name"], next.backend.name);
	doc.setIn(["backend", "repo"], next.backend.repo);
	doc.setIn(["backend", "branch"], next.backend.branch);
	doc.setIn(["backend", "base_url"], next.backend.baseUrl);

	doc.setIn(["i18n", "structure"], next.i18n.structure);
	// Built via createNode + flow:true rather than handing the plain array to
	// setIn, so it re-serializes as the original file's compact inline
	// `[en, zh, es]` style instead of a multi-line block list.
	const localesNode = doc.createNode(next.i18n.locales);
	localesNode.flow = true;
	doc.setIn(["i18n", "locales"], localesNode);
	doc.setIn(["i18n", "default_locale"], next.i18n.defaultLocale);
	doc.setIn(
		["i18n", "omit_default_locale_from_file_path"],
		next.i18n.omitDefaultLocaleFromFilePath,
	);

	doc.set("media_folder", next.media.mediaFolder);
	doc.set("public_folder", next.media.publicFolder);

	await updateFile(
		CONFIG_YML_PATH,
		doc.toString(),
		file.sha,
		"Update CMS admin settings",
		token,
	);
}
