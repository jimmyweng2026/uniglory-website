/**
 * Copies the files that are not part of Vite's bundle into dist/.
 *
 * Vite only emits index.html plus the CSS/JS/SVG assets it resolves, so the
 * loose static files (script.js, robots.txt, sitemap.xml, llms.txt, CNAME) and
 * the brand/ folder have to be copied for dist/ to be a complete deployment.
 */
import { cp, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");

if (!existsSync(dist)) {
	console.error("dist/ not found — run `vite build` first.");
	process.exit(1);
}

await mkdir(dist, { recursive: true });

// Files and folders kept at the project root and mirrored into dist/.
const entries = [
	"script.js",
	"robots.txt",
	"sitemap.xml",
	"llms.txt",
	"CNAME",
	"brand",
];

for (const name of entries) {
	const from = path.join(root, name);
	if (!existsSync(from)) {
		console.warn(`  ! skipped, missing: ${name}`);
		continue;
	}
	await cp(from, path.join(dist, name), { recursive: true });
	console.log(`  ✓ ${name}`);
}

// Stop GitHub Pages from running Jekyll over the built output.
await writeFile(path.join(dist, ".nojekyll"), "");

console.log("dist/ is ready to deploy");
