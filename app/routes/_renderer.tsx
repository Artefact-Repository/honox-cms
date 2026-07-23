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
				`data-theme` attribute is set before the stylesheet paints —
				avoids a flash of the wrong color scheme. Mirrors the onclick
				logic on the Light/Dark/System buttons in the "Appearance"
				header popover (content/configs*.json's `headerItems`). */}
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: static, non-user-controlled boot script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var s=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)');var d=s==='light'||s==='dark'?s:(m.matches?'dark':'light');document.documentElement.dataset.theme=d;m.addEventListener('change',function(e){if((localStorage.getItem('theme')||'system')==='system'){document.documentElement.dataset.theme=e.matches?'dark':'light';}});}catch(e){}})();`,
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
