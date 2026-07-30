import { jsxRenderer } from "hono/jsx-renderer";
import { Link, Script } from "honox/server";
import { detectLocale } from "../lib/i18n";

export const __importing_islands = true;

export default jsxRenderer(({ children }, c) => {
	const currentPath = c.req.path;
	const currentLocale = detectLocale(currentPath);
	return (
		<html lang={currentLocale}>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				{/* Blocking (no async/defer) and first in <head>, so the
				`data-theme` attribute and accent `color-palette_*` class are set
				before the stylesheet paints — avoids a flash of the wrong color
				scheme/accent. Mirrors the onchange/onclick logic on the Dark mode
				Switch and color-palette dropdown in the "Appearance" header
				popover (content/configs*.json's `headerItems`).

				Also sets `data-can-write` — this app has no server-side session
				(see git-backend.ts's module comment), so the only "logged in"
				signal is a git host token in localStorage, either Sveltia CMS's
				own session key or our manually-connected one (same two keys
				`resolveToken()` in git-backend.ts checks, in the same order).
				Computed here, synchronously and before paint, so write-gated SSR
				markup that isn't its own island (e.g. the tasks table's
				hoverActions buttons) can default to hidden via CSS instead of
				flashing visible then disappearing after hydration. */}
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: static, non-user-controlled boot script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var s=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)');var d=s==='light'||s==='dark'?s:(m.matches?'dark':'light');document.documentElement.dataset.theme=d;m.addEventListener('change',function(e){if((localStorage.getItem('theme')||'system')==='system'){document.documentElement.dataset.theme=e.matches?'dark':'light';}});var p=localStorage.getItem('colorPalette');if(p)document.documentElement.classList.add('color-palette_'+p);}catch(e){}try{var su=localStorage.getItem('sveltia-cms.user');var canWrite=false;if(su){try{canWrite=!!JSON.parse(su).token;}catch(e){}}if(!canWrite)canWrite=!!localStorage.getItem('honox-board-github-token');document.documentElement.dataset.canWrite=canWrite?'true':'false';}catch(e){}})();`,
					}}
				/>
				<link rel="icon" href="/favicon.ico" />
				<Link href="/app/style.css" rel="stylesheet" />
				<Script src="/app/client.ts" async />
			</head>
			<body>{children}</body>
		</html>
	);
});
