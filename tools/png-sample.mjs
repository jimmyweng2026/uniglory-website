// Minimal PNG pixel sampler (8-bit RGB/RGBA, no dependencies).
//
//   node tools/png-sample.mjs shot.png x y w h
//
// Prints the distinct colours inside the rectangle, most common first, with
// their share of the region. Useful for verifying compositing questions that a
// compressed screenshot makes hard to judge by eye — e.g. "is that panel really
// opaque, or is text ghosting through it?"

import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const [file, ...rest] = process.argv.slice(2);
if (!file || rest.length < 4) {
	console.error("usage: node tools/png-sample.mjs <png> <x> <y> <w> <h>");
	process.exit(2);
}
const [rx, ry, rw, rh] = rest.map(Number);

const buf = readFileSync(file);
if (buf.readUInt32BE(0) !== 0x89504e47) {
	console.error("not a PNG");
	process.exit(2);
}

let pos = 8;
let width = 0;
let height = 0;
let bitDepth = 0;
let colorType = 0;
const idat = [];

while (pos < buf.length) {
	const len = buf.readUInt32BE(pos);
	const type = buf.toString("ascii", pos + 4, pos + 8);
	const data = buf.subarray(pos + 8, pos + 8 + len);
	if (type === "IHDR") {
		width = data.readUInt32BE(0);
		height = data.readUInt32BE(4);
		bitDepth = data[8];
		colorType = data[9];
	} else if (type === "IDAT") {
		idat.push(data);
	} else if (type === "IEND") {
		break;
	}
	pos += 12 + len;
}

if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
	console.error(`unsupported PNG: bitDepth=${bitDepth} colorType=${colorType}`);
	process.exit(2);
}

const channels = colorType === 6 ? 4 : 3;
const raw = inflateSync(Buffer.concat(idat));
const stride = width * channels;
const pixels = Buffer.alloc(height * stride);

// Undo the per-scanline PNG filters.
for (let y = 0; y < height; y++) {
	const filter = raw[y * (stride + 1)];
	const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
	const out = pixels.subarray(y * stride, (y + 1) * stride);
	const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
	for (let i = 0; i < stride; i++) {
		const a = i >= channels ? out[i - channels] : 0;
		const b = prev ? prev[i] : 0;
		const c = prev && i >= channels ? prev[i - channels] : 0;
		let v = line[i];
		if (filter === 1) v += a;
		else if (filter === 2) v += b;
		else if (filter === 3) v += (a + b) >> 1;
		else if (filter === 4) {
			const p = a + b - c;
			const pa = Math.abs(p - a);
			const pb = Math.abs(p - b);
			const pc = Math.abs(p - c);
			v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
		}
		out[i] = v & 0xff;
	}
}

const counts = new Map();
let total = 0;
for (let y = ry; y < Math.min(ry + rh, height); y++) {
	for (let x = rx; x < Math.min(rx + rw, width); x++) {
		const i = y * stride + x * channels;
		const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
		counts.set(key, (counts.get(key) || 0) + 1);
		total += 1;
	}
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
console.log(`${file}  region x=${rx} y=${ry} ${rw}x${rh}  (image ${width}x${height})`);
for (const [color, count] of sorted.slice(0, 8)) {
	const pct = ((count / total) * 100).toFixed(1);
	const [r, g, b] = color.split(",").map(Number);
	const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
	console.log(`  ${hex}  rgb(${color})  ${String(pct).padStart(5)}%`);
}
if (sorted.length > 8) console.log(`  … ${sorted.length - 8} more distinct colours`);
