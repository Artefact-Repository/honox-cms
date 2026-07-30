// Direct browser → git host REST API client for writing content file changes
// straight to `main`, the same "simple" (no editorial workflow / no PR)
// publish model the Sveltia CMS admin uses (see public/admin/config.yml's
// `backend`). Supports the same three backends Sveltia itself does
// (https://sveltiacms.app/en/docs/backends) — github, gitlab, gitea/forgejo —
// dispatched from `backend.name` in config.yml, so switching backends there
// doesn't need any code change here.
//
// Token source, in priority order:
//  1. Sveltia's own logged-in session, read straight out of its storage key.
//     Traced through Sveltia CMS's actual source (github.com/sveltia/sveltia-cms
//     @ main): fetchUserProfile() in
//     src/lib/services/backends/git/shared/user.js sets `user.account` (incl.
//     `token`/`refreshToken`) in src/lib/services/user/account.svelte.js,
//     whose `$effect.root` persists the whole object via
//     `LocalStorage.set('sveltia-cms.user', _user)` — and LocalStorage there
//     (github.com/sveltia/sveltia-utils @ main,
//     src/lib/storage/local-storage.js) is a plain wrapper:
//     `localStorage.setItem(key, JSON.stringify(value))`. So the raw token
//     sits at `JSON.parse(localStorage.getItem('sveltia-cms.user')).token`.
//     Unofficial/unversioned — Sveltia is loaded unpinned from a CDN
//     (public/admin/index.html), so this key could change on any release.
//  2. A manually-pasted personal access token, stored under our own key —
//     the fallback when (1) is absent or breaks. Needs whatever scope the
//     configured backend requires for repo contents read/write (GitHub:
//     `repo` or fine-grained Contents r/w; GitLab: `api`; Gitea/Forgejo:
//     the `repo` scope on a token generated for this instance).
//
// CORS note: GitHub and gitlab.com both serve `Access-Control-Allow-Origin: *`
// on their REST APIs (verified directly), so browser calls work with zero
// extra setup. Self-hosted GitLab generally ships the same. Gitea/Forgejo is
// the exception — Sveltia's own docs warn CORS isn't on by default for
// self-hosted instances and must be configured by the admin, or every
// request here will fail as an opaque network error (not a clean 4xx).

import { parse as parseYaml } from "yaml";

type BackendName = "github" | "gitlab" | "gitea";

interface RepoConfig {
	name: BackendName;
	owner: string;
	repo: string;
	branch: string;
	/** Resolved REST API root, already backend-specific (see resolveApiRoot). */
	apiRoot: string;
}

let repoConfigPromise: Promise<RepoConfig> | null = null;

function stripTrailingSlash(url: string): string {
	return url.endsWith("/") ? url.slice(0, -1) : url;
}

// GitHub and GitLab (gitlab.com) have one fixed API root; GitLab can also be
// self-hosted (base_url overrides it, same as Gitea); Gitea/Forgejo has no
// public default at all — it's always self-hosted, so base_url is required.
function resolveApiRoot(name: BackendName, baseUrl?: string): string {
	if (name === "gitea") {
		if (!baseUrl) {
			throw new Error(
				"public/admin/config.yml's backend needs a base_url for gitea/forgejo (there's no public default instance).",
			);
		}
		return `${stripTrailingSlash(baseUrl)}/api/v1`;
	}
	if (name === "gitlab") {
		return baseUrl
			? `${stripTrailingSlash(baseUrl)}/api/v4`
			: "https://gitlab.com/api/v4";
	}
	return "https://api.github.com";
}

// Reads backend.{name,repo,branch,base_url} straight from the CMS's own
// public/admin/config.yml instead of hardcoding a second copy here — same
// source of truth Sveltia itself reads, so this can never drift from it.
function getRepoConfig(): Promise<RepoConfig> {
	if (!repoConfigPromise) {
		repoConfigPromise = fetch("/admin/config.yml")
			.then((response) => response.text())
			.then((yaml) => {
				// This config.yml is our own trusted, self-authored file (not
				// third-party/user input), and its many collections reuse enough
				// YAML anchors (e.g. the shared status/priority option lists) to trip
				// the `yaml` package's default anti-DoS `maxAliasCount` (100) —
				// disable that check rather than fighting it.
				const config = parseYaml(yaml, { maxAliasCount: -1 }) as {
					backend?: {
						name?: string;
						repo?: string;
						branch?: string;
						base_url?: string;
					};
				};
				const name = (config.backend?.name as BackendName) || "github";
				const repoPath = config.backend?.repo ?? "";
				const [owner, repo] = repoPath.split("/");
				if (!owner || !repo) {
					throw new Error(
						"public/admin/config.yml's backend.repo is missing or malformed.",
					);
				}
				return {
					name,
					owner,
					repo,
					branch: config.backend?.branch || "main",
					apiRoot: resolveApiRoot(name, config.backend?.base_url),
				};
			})
			.catch((error) => {
				// Don't cache a rejected promise forever — let the next save retry
				// (e.g. after a transient network blip) instead of failing every
				// subsequent attempt for the rest of the page's lifetime.
				repoConfigPromise = null;
				throw error;
			});
	}
	return repoConfigPromise;
}

const SVELTIA_USER_STORAGE_KEY = "sveltia-cms.user";
const TOKEN_STORAGE_KEY = "honox-board-github-token";

/** Reads the token out of Sveltia's own logged-in session, if any — see the
 * module-level comment for exactly where this key comes from. */
export function getSveltiaToken(): string | null {
	if (typeof localStorage === "undefined") return null;
	const raw = localStorage.getItem(SVELTIA_USER_STORAGE_KEY);
	if (!raw) return null;
	try {
		const user = JSON.parse(raw) as { token?: string };
		return user.token ?? null;
	} catch {
		return null;
	}
}

export interface SveltiaUser {
	name: string | null;
	login: string | null;
	avatarURL: string | null;
}

/** Reads the logged-in identity out of Sveltia's own session (same storage
 * key as `getSveltiaToken`) — `name`/`login`/`avatarURL` are set by Sveltia's
 * `fetchUserProfile()` alongside the token. There's no server-side session
 * here (see git-backend.ts module comment), so this is the only "who's
 * logged in" signal the app has, and it only exists client-side. */
export function getSveltiaUser(): SveltiaUser | null {
	if (typeof localStorage === "undefined") return null;
	const raw = localStorage.getItem(SVELTIA_USER_STORAGE_KEY);
	if (!raw) return null;
	try {
		const user = JSON.parse(raw) as {
			name?: string;
			login?: string;
			avatarURL?: string;
		};
		if (!user.name && !user.login) return null;
		return {
			name: user.name ?? null,
			login: user.login ?? null,
			avatarURL: user.avatarURL ?? null,
		};
	} catch {
		return null;
	}
}

export function getStoredToken(): string | null {
	if (typeof localStorage === "undefined") return null;
	return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
	localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
	localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/** Sveltia's session first (if logged into /admin in this browser), falling
 * back to our own manually-connected token. */
export function resolveToken(): {
	token: string | null;
	source: "sveltia" | "manual" | null;
} {
	const sveltiaToken = getSveltiaToken();
	if (sveltiaToken) return { token: sveltiaToken, source: "sveltia" };
	const manualToken = getStoredToken();
	if (manualToken) return { token: manualToken, source: "manual" };
	return { token: null, source: null };
}

/** Resolves a token the same way every direct-commit editor does — throws a
 * user-facing message if neither a Sveltia session nor a manual token is
 * available, so callers can just try/catch and show it. */
export function requireToken(): string {
	const { token } = resolveToken();
	if (!token) {
		throw new Error(
			"No git host connection found — connect one to save edits.",
		);
	}
	return token;
}

// btoa/atob only handle Latin1; TextEncoder/decoder round-trip gets a
// correct UTF-8-safe base64 for arbitrary file content (accented names,
// em dashes in task titles, etc).
function encodeBase64Utf8(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function decodeBase64Utf8(base64: string): string {
	const binary = atob(base64.replace(/\n/g, ""));
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

export class GitBackendError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = "GitBackendError";
		this.status = status;
	}
}

function authHeaders(name: BackendName, token: string): Record<string, string> {
	if (name === "gitlab") return { "PRIVATE-TOKEN": token };
	if (name === "gitea") return { Authorization: `token ${token}` };
	return { Authorization: `Bearer ${token}` }; // github
}

function errorMessage(status: number, path: string, branch: string): string {
	if (status === 401)
		return "The connected token was rejected — reconnect with a valid one.";
	if (status === 404) return `${path} not found on the ${branch} branch.`;
	if (status === 409 || status === 400) {
		return "File changed on the remote since it was last read — reload and retry.";
	}
	return `Git host API error (${status}).`;
}

export interface GitFile {
	content: string;
	/** Blob SHA (GitHub/Gitea) or blob_id (GitLab) — pass back on write. */
	sha: string;
}

export async function fetchFile(path: string, token: string): Promise<GitFile> {
	const config = await getRepoConfig();
	const headers = authHeaders(config.name, token);

	if (config.name === "gitlab") {
		const projectId = encodeURIComponent(`${config.owner}/${config.repo}`);
		const filePath = encodeURIComponent(path);
		const url = `${config.apiRoot}/projects/${projectId}/repository/files/${filePath}?ref=${config.branch}`;
		const response = await fetch(url, { headers });
		if (!response.ok) {
			throw new GitBackendError(
				errorMessage(response.status, path, config.branch),
				response.status,
			);
		}
		const json = (await response.json()) as {
			content: string;
			blob_id: string;
		};
		return { content: decodeBase64Utf8(json.content), sha: json.blob_id };
	}

	// github and gitea share the same Contents API shape
	const url = `${config.apiRoot}/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;
	const response = await fetch(url, { headers });
	if (!response.ok) {
		throw new GitBackendError(
			errorMessage(response.status, path, config.branch),
			response.status,
		);
	}
	const json = (await response.json()) as { content: string; sha: string };
	return { content: decodeBase64Utf8(json.content), sha: json.sha };
}

/** Whether `path` already exists on the configured branch — a plain 404 from
 * `fetchFile` means no, anything else (including a real network/auth error)
 * still propagates. Used by every direct-commit "create" path to check the
 * target filename is free before writing (create/update use different API
 * calls, so there's no single conflict-status check across every backend). */
export async function fileExists(path: string, token: string): Promise<boolean> {
	try {
		await fetchFile(path, token);
		return true;
	} catch (error) {
		if (error instanceof GitBackendError && error.status === 404) return false;
		throw error;
	}
}

/** Creates a new file at `path` — same Contents API as `updateFile`, but
 * omitting `sha` (github/gitea) or using `POST` instead of `PUT` (gitlab),
 * whichever each backend requires to distinguish "create" from "update". */
export async function createFile(
	path: string,
	content: string,
	message: string,
	token: string,
): Promise<void> {
	const config = await getRepoConfig();
	const headers = authHeaders(config.name, token);

	if (config.name === "gitlab") {
		const projectId = encodeURIComponent(`${config.owner}/${config.repo}`);
		const filePath = encodeURIComponent(path);
		const url = `${config.apiRoot}/projects/${projectId}/repository/files/${filePath}`;
		const response = await fetch(url, {
			method: "POST",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				branch: config.branch,
				content: encodeBase64Utf8(content),
				encoding: "base64",
				commit_message: message,
			}),
		});
		if (!response.ok) {
			throw new GitBackendError(
				response.status === 400
					? `${path} already exists on the ${config.branch} branch.`
					: errorMessage(response.status, path, config.branch),
				response.status,
			);
		}
		return;
	}

	// github and gitea share the same Contents API shape — omitting `sha`
	// creates a new file instead of updating one.
	const url = `${config.apiRoot}/repos/${config.owner}/${config.repo}/contents/${path}`;
	const response = await fetch(url, {
		method: "PUT",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify({
			message,
			content: encodeBase64Utf8(content),
			branch: config.branch,
		}),
	});
	if (!response.ok) {
		throw new GitBackendError(
			response.status === 422
				? `${path} already exists on the ${config.branch} branch.`
				: errorMessage(response.status, path, config.branch),
			response.status,
		);
	}
}

/** Deletes an existing file at `path` — same Contents API as `updateFile`,
 * `DELETE` instead of `PUT`, needs the current blob `sha`/`blob_id` like an
 * update does (proves the caller last read the file that's actually there). */
export async function deleteFile(
	path: string,
	sha: string,
	message: string,
	token: string,
): Promise<void> {
	const config = await getRepoConfig();
	const headers = authHeaders(config.name, token);

	if (config.name === "gitlab") {
		const projectId = encodeURIComponent(`${config.owner}/${config.repo}`);
		const filePath = encodeURIComponent(path);
		const url = `${config.apiRoot}/projects/${projectId}/repository/files/${filePath}`;
		const response = await fetch(url, {
			method: "DELETE",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				branch: config.branch,
				commit_message: message,
			}),
		});
		if (!response.ok) {
			throw new GitBackendError(
				errorMessage(response.status, path, config.branch),
				response.status,
			);
		}
		return;
	}

	// github and gitea share the same Contents API shape
	const url = `${config.apiRoot}/repos/${config.owner}/${config.repo}/contents/${path}`;
	const response = await fetch(url, {
		method: "DELETE",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify({
			message,
			sha,
			branch: config.branch,
		}),
	});
	if (!response.ok) {
		throw new GitBackendError(
			errorMessage(response.status, path, config.branch),
			response.status,
		);
	}
}

export async function updateFile(
	path: string,
	content: string,
	sha: string,
	message: string,
	token: string,
): Promise<void> {
	const config = await getRepoConfig();
	const headers = authHeaders(config.name, token);

	if (config.name === "gitlab") {
		const projectId = encodeURIComponent(`${config.owner}/${config.repo}`);
		const filePath = encodeURIComponent(path);
		const url = `${config.apiRoot}/projects/${projectId}/repository/files/${filePath}`;
		const response = await fetch(url, {
			method: "PUT",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				branch: config.branch,
				content: encodeBase64Utf8(content),
				encoding: "base64",
				commit_message: message,
				last_commit_id: sha,
			}),
		});
		if (!response.ok) {
			throw new GitBackendError(
				errorMessage(response.status, path, config.branch),
				response.status,
			);
		}
		return;
	}

	// github and gitea share the same Contents API shape
	const url = `${config.apiRoot}/repos/${config.owner}/${config.repo}/contents/${path}`;
	const response = await fetch(url, {
		method: "PUT",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify({
			message,
			content: encodeBase64Utf8(content),
			sha,
			branch: config.branch,
		}),
	});
	if (!response.ok) {
		throw new GitBackendError(
			errorMessage(response.status, path, config.branch),
			response.status,
		);
	}
}
