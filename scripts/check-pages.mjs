/**
 * Fails the build if the shared header or footer markup drifts between pages.
 *
 * Pages are plain HTML with no templating, so the header and footer are
 * duplicated on purpose. This check keeps that duplication honest: edit the
 * header on one page and the build stops until every page matches.
 */
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const skipDirs = new Set(["node_modules", "dist", ".git", "tools", "scripts", "brand", "fonts", "images", "Uniglory-logo"]);

async function findPages(dir, found = []) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (entry.name.startsWith(".") || skipDirs.has(entry.name)) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) await findPages(full, found);
		else if (entry.name.endsWith(".html")) found.push(full);
	}
	return found;
}

function extract(html, tag) {
	const match = new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`).exec(html);
	return match ? match[0] : null;
}

const pages = (await findPages(root)).sort();
if (pages.length < 2) {
	console.log(`check-pages: only ${pages.length} page found, nothing to compare`);
	process.exit(0);
}

const reference = pages[0];
const referenceHtml = await readFile(reference, "utf8");
let failures = 0;

for (const tag of ["header", "footer"]) {
	const expected = extract(referenceHtml, tag);
	if (!expected) {
		console.error(`  ✗ ${path.relative(root, reference)} has no <${tag}>`);
		failures++;
		continue;
	}
	for (const page of pages.slice(1)) {
		const html = await readFile(page, "utf8");
		const actual = extract(html, tag);
		if (actual === expected) {
			console.log(`  ✓ <${tag}> matches in ${path.relative(root, page)}`);
			continue;
		}
		failures++;
		console.error(`  ✗ <${tag}> differs in ${path.relative(root, page)}`);
		if (actual === null) {
			console.error(`      the page has no <${tag}> element at all`);
			continue;
		}
		const a = expected.split("\n");
		const b = actual.split("\n");
		const at = a.findIndex((line, i) => line !== b[i]);
		console.error(`      first difference at line ${at + 1}:`);
		console.error(`        ${path.relative(root, reference)}: ${(a[at] ?? "").trim()}`);
		console.error(`        ${path.relative(root, page)}: ${(b[at] ?? "").trim()}`);
	}
}

if (failures) {
	console.error(
		`\ncheck-pages: ${failures} mismatch(es). Copy the ${reference === pages[0] ? "header/footer" : "shared markup"} from ${path.relative(root, reference)} so every page matches.`,
	);
	process.exit(1);
}

console.log(`check-pages: header and footer identical across ${pages.length} pages`);
