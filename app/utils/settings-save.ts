// Direct-commit save path for the /settings page — same fetch→edit→write
// sequence as task-save.ts/project-save.ts, just against the `configs`
// singleton (content/configs.json) instead of one entry file. Only ever
// touches the English (default-locale) file; translated
// configs.<locale>.json files stay a separate CMS concern (see
// public/admin/config.yml's `configs` singleton).
import { fetchFile, requireToken, updateFile } from "./git-backend";

const CONFIGS_PATH = "content/configs.json";

export class SettingsSaveError extends Error {}

/** Merges `fields` (one or more top-level keys of the configs singleton, e.g.
 * `{ blog: {...} }` or `{ fallbackLabel, docOrder, docsUi }`) over whatever is
 * currently in content/configs.json and commits the result. Each caller must
 * pass every field of the object(s) it owns — this replaces those top-level
 * keys wholesale, it doesn't deep-merge, so a partial object would silently
 * drop the fields the form doesn't show. */
export async function saveConfigsFields(
	fields: Record<string, unknown>,
	message: string,
): Promise<void> {
	const token = requireToken();
	const file = await fetchFile(CONFIGS_PATH, token);

	let data: Record<string, unknown>;
	try {
		data = JSON.parse(file.content);
	} catch {
		throw new SettingsSaveError("content/configs.json is not valid JSON.");
	}

	const next = { ...data, ...fields };
	await updateFile(
		CONFIGS_PATH,
		`${JSON.stringify(next, null, 2)}\n`,
		file.sha,
		message,
		token,
	);
}
