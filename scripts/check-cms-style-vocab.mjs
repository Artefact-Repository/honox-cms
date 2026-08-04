#!/usr/bin/env bun
// Anti-drift check for the CMS block `style`-string vocabulary (see
// content/tasks/cms-static-css-generalised-bridge.md). Scans
// content/pages/**/*.json for every `style` declaration and fails if it
// finds a (property, value) pair that app/components/block-style.ts's
// validators would silently drop — i.e. new CMS content introduced a style
// the static-CSS pipeline was never told about.
//
// This intentionally duplicates the allowlists in block-style.ts and
// panda.config.ts rather than importing them: those files import from the
// "design-system" alias, which only resolves inside Vite (see vite.config.ts
// `resolve.alias`) — not in a standalone script. The vocabulary is small and
// stable (11 categorical properties, 9 continuous ones), so keeping the
// three lists in lockstep by hand is the pragmatic tradeoff; if it ever
// drifts, this script is exactly what catches it.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const CONTENT_DIR = "content/pages";

// Mirrors CATEGORICAL_VALIDATORS in app/components/block-style.ts.
const CATEGORICAL_VALUES = {
	"text-align": new Set(["left", "center", "right", "justify", "start", "end"]),
	"font-weight": new Set(["600", "bold"]),
	"text-transform": new Set(["uppercase"]),
	"text-decoration": new Set(["none"]),
	"justify-content": new Set(["flex-end"]),
	"flex-wrap": new Set(["wrap"]),
	"flex-shrink": new Set(["0"]),
	"letter-spacing": new Set(["0.05em"]),
	"border-radius": new Set(["9999px"]),
	color: new Set(["var(--colors-fg-muted)", "#71717a", "#6b7280"]),
	"border-bottom": new Set(["1px solid var(--colors-border)", "1px solid #e5e7eb"]),
	"border-top": new Set(["1px solid var(--colors-border)", "1px solid #e5e7eb"]),
};

// Mirrors CONTINUOUS_VALIDATORS' property names in block-style.ts — values
// are regex-validated there (open-ended), so this script only checks the
// property itself is recognized, not the specific value.
const CONTINUOUS_PROPERTIES = new Set([
	"margin",
	"padding",
	"max-width",
	"margin-bottom",
	"padding-bottom",
	"min-width",
	"row-gap",
	"width",
	"font-size",
]);

function findJsonFiles(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const stat = statSync(full);
		if (stat.isDirectory()) out.push(...findJsonFiles(full));
		else if (entry.endsWith(".json")) out.push(full);
	}
	return out;
}

function parseStyleDeclarations(style) {
	const out = {};
	for (const decl of style.split(";")) {
		const idx = decl.indexOf(":");
		if (idx === -1) continue;
		const prop = decl.slice(0, idx).trim().toLowerCase();
		const value = decl.slice(idx + 1).trim();
		if (prop && value) out[prop] = value;
	}
	return out;
}

function walk(node, file, problems) {
	if (Array.isArray(node)) {
		for (const item of node) walk(item, file, problems);
		return;
	}
	if (node && typeof node === "object") {
		if (typeof node.style === "string" && node.style.trim()) {
			for (const [prop, value] of Object.entries(
				parseStyleDeclarations(node.style),
			)) {
				const categorical = CATEGORICAL_VALUES[prop];
				if (categorical) {
					if (!categorical.has(value.toLowerCase()) && !categorical.has(value)) {
						problems.push({ file, blockType: node.blockType, prop, value });
					}
					continue;
				}
				if (!CONTINUOUS_PROPERTIES.has(prop)) {
					problems.push({ file, blockType: node.blockType, prop, value });
				}
			}
		}
		for (const value of Object.values(node)) walk(value, file, problems);
	}
}

const problems = [];
for (const file of findJsonFiles(CONTENT_DIR)) {
	walk(JSON.parse(readFileSync(file, "utf8")), file, problems);
}

if (problems.length > 0) {
	console.error(
		`✘ ${problems.length} CMS \`style\` declaration(s) aren't covered by the ` +
			"static-CSS vocabulary (block-style.ts validators / panda.config.ts " +
			"staticCss.css) — they'll be silently dropped instead of rendered:\n",
	);
	for (const p of problems) {
		console.error(`  ${p.file} [${p.blockType}]  ${p.prop}: ${p.value}`);
	}
	console.error(
		"\nAdd the (property, value) pair to CATEGORICAL_VALIDATORS/" +
			"CONTINUOUS_VALIDATORS in app/components/block-style.ts, the matching " +
			"entry in panda.config.ts's staticCss.css, and this script's allowlist.",
	);
	process.exit(1);
}

console.log("✔ CMS style vocabulary matches the static-CSS allowlist.");
