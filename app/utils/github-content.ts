// Direct browser → GitHub REST API client for writing content file changes
// straight to `main`, the same "simple" (no editorial workflow / no PR)
// publish model the Sveltia CMS admin uses (see public/admin/config.yml's
// `backend`).
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
//  2. A manually-pasted personal access token (repo scope, or fine-grained
//     with this repo's Contents: read/write permission), stored under our
//     own key — the fallback when (1) is absent or breaks.

import { parse as parseYaml } from "yaml";

const GITHUB_API_ROOT = "https://api.github.com";

interface RepoConfig {
	owner: string;
	repo: string;
	branch: string;
}

let repoConfigPromise: Promise<RepoConfig> | null = null;

// Reads owner/repo/branch straight from the CMS's own public/admin/config.yml
// (its `backend` block) instead of hardcoding a second copy here — same
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
					backend?: { repo?: string; branch?: string };
				};
				const repoPath = config.backend?.repo ?? "";
				const [owner, repo] = repoPath.split("/");
				if (!owner || !repo) {
					throw new Error(
						"public/admin/config.yml's backend.repo is missing or malformed.",
					);
				}
				return {
					owner,
					repo,
					branch: config.backend?.branch || "main",
				};
			})
			.catch((error) => {
				// Don't cache a rejected promise forever — let the next drag retry
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

/** Reads the GitHub token out of Sveltia's own logged-in session, if any —
 * see the module-level comment for exactly where this key comes from. */
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

export class GitHubContentError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = "GitHubContentError";
		this.status = status;
	}
}

async function githubRequest(
	path: string,
	token: string,
	branch: string,
	init?: RequestInit,
): Promise<Response> {
	const { owner, repo } = await getRepoConfig();
	const response = await fetch(
		`${GITHUB_API_ROOT}/repos/${owner}/${repo}/contents/${path}`,
		{
			...init,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
				...init?.headers,
			},
		},
	);
	if (!response.ok) {
		const message =
			response.status === 401
				? "GitHub rejected the token — reconnect with a valid one."
				: response.status === 404
					? `${path} not found on GitHub's ${branch} branch.`
					: response.status === 409
						? "File changed on GitHub since it was last read — reload and retry."
						: `GitHub API error (${response.status}).`;
		throw new GitHubContentError(message, response.status);
	}
	return response;
}

export interface GitHubFile {
	content: string;
	sha: string;
}

export async function fetchFileFromGitHub(
	path: string,
	token: string,
): Promise<GitHubFile> {
	const { branch } = await getRepoConfig();
	const response = await githubRequest(`${path}?ref=${branch}`, token, branch);
	const json = (await response.json()) as { content: string; sha: string };
	return { content: decodeBase64Utf8(json.content), sha: json.sha };
}

export async function updateFileOnGitHub(
	path: string,
	content: string,
	sha: string,
	message: string,
	token: string,
): Promise<{ sha: string }> {
	const { branch } = await getRepoConfig();
	const response = await githubRequest(path, token, branch, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			message,
			content: encodeBase64Utf8(content),
			sha,
			branch,
		}),
	});
	const json = (await response.json()) as { content: { sha: string } };
	return { sha: json.content.sha };
}
