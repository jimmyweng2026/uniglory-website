// Internal link check for the built site.
//
// Runs on dist/ after `vite build`, so it sees exactly what will be deployed.
// Every root-relative href/src in every built HTML file must resolve to a file
// that exists in dist/, and every same-page or cross-page #anchor must exist in
// the target document. External links are ignored on purpose: this check must
// never need the network.
//
// Exits non-zero on the first broken link so the build fails loudly.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";

const DIST = "dist";

function walkHtml(dir) {
	const found = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) found.push(...walkHtml(path));
		else if (entry.name.endsWith(".html")) found.push(path);
	}
	return found;
}

if (!existsSync(DIST) || !statSync(DIST).isDirectory()) {
	console.error("check-links: dist/ not found — run the build first");
	process.exit(1);
}

if (!existsSync(join(DIST, "404.html")) && existsSync("404.html")) {
	console.warn("check-links: warning — 404.html exists at the root but not in dist/");
}

const pages = walkHtml(DIST).sort();
const cache = new Map();

function html(rel) {
	if (!cache.has(rel)) cache.set(rel, readFileSync(join(DIST, rel), "utf8"));
	return cache.get(rel);
}

// `/a/b/` -> a/b/index.html, `/x.html` -> x.html, `/` -> index.html
function resolveTarget(urlPath) {
	const clean = urlPath.split("?")[0].split("#")[0];
	if (clean === "" || clean === "/") return "index.html";
	const rel = clean.replace(/^\//, "");
	if (clean.endsWith("/")) return `${rel}index.html`;
	if (existsSync(join(DIST, rel)) && statSync(join(DIST, rel)).isFile()) return rel;
	return `${rel}/index.html`;
}

function anchors(rel) {
	const ids = new Set();
	for (const m of html(rel).matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);
	for (const m of html(rel).matchAll(/\sname="([^"]+)"/g)) ids.add(m[1]);
	return ids;
}

const problems = [];
let checked = 0;

for (const file of pages) {
	const from = relative(DIST, file);
	const isPage = file.endsWith("index.html");
	const source = html(from);
	const tagRe = /\s(?:href|src)="([^"]+)"/g;

	for (const m of source.matchAll(tagRe)) {
		const value = m[1];
		checked += 1;

		// Skip anything that is not an internal reference.
		if (/^(https?:|mailto:|tel:|data:|#)/.test(value)) {
			// Same-page anchors still get checked.
			if (value.startsWith("#") && value.length > 1) {
				const id = value.slice(1);
				if (isPage && !anchors(from).has(id)) {
					problems.push(`${from}: #${id} has no matching id on this page`);
				}
			}
			continue;
		}
		if (!value.startsWith("/")) continue;

		const hash = value.includes("#") ? value.split("#")[1] : "";
		const target = resolveTarget(value);

		if (!existsSync(join(DIST, target))) {
			problems.push(`${from}: ${value} -> missing dist/${target}`);
			continue;
		}
		if (hash && !anchors(target).has(hash)) {
			problems.push(`${from}: ${value} -> dist/${target} has no id="${hash}"`);
		}
	}
}

console.log(`check-links: ${pages.length} pages, ${checked} references`);

if (problems.length) {
	console.error(`\n  ${problems.length} broken reference(s):`);
	for (const p of problems) console.error(`    ✗ ${p}`);
	process.exit(1);
}

console.log("  ✓ every internal link and anchor resolves");
void dirname;
