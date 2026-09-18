# UniGlory Energy website

A fast, static marketing website for UniGlory Energy LLC, built with Vite.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Build

```bash
npm run build
```

The build runs in three steps:

1. `scripts/check-pages.mjs` fails the build if the shared `<header>` or
   `<footer>` markup differs between pages.
2. `vite build` writes the minified, hashed bundle into `dist/`.
3. `scripts/copy-static.mjs` copies the files Vite does not bundle
   (`script.js`, `robots.txt`, `sitemap.xml`, `llms.txt`, `CNAME`) plus the
   `brand/` folder into `dist/`.

`dist/` is the only folder that gets deployed.

## Deployment

The site is published to GitHub Pages by `.github/workflows/deploy.yml`: every
push to `main` builds on GitHub's runners and publishes `dist/`. Nothing from
`dist/` is committed — it is generated in CI.

The repository is configured with:

- `Settings → Pages → Build and deployment → Source`: **GitHub Actions**
- `Settings → Pages → Custom domain`: `www.unigloryenergy.com`, HTTPS enforced

Because the Pages source is GitHub Actions, the repository root is not published
at all: only what the build writes into `dist/` reaches the web. That is why
this README, `package.json`, `tools/` and `scripts/` are not downloadable from
the live site.

## Project layout

| Path | Purpose |
| --- | --- |
| `index.html` | The one-page site: copy, metadata, structured data |
| `styles.css` | Stylesheet (bundled and minified into `dist/assets/`) |
| `fonts.css` | Self-hosted `@font-face` rules, imported by `styles.css` |
| `script.js` | Nav, scroll reveal, quote-form handling (copied as-is) |
| `brand/` | Web-ready logo files, favicon, Apple touch icon, social share image |
| `fonts/` | Variable web fonts plus their OFL licence files |
| `images/` | Content photos as AVIF with JPEG fallbacks |
| `tools/` | Sources for generated assets and the contrast audit script |
| `scripts/copy-static.mjs` | Completes `dist/` after `vite build` |
| `Uniglory-logo/` | Original master logo artwork (never deployed) |
| `TODO-content.md` | Facts still needed from UniGlory for the product pages |

## Fonts

`fonts.css` (imported at the top of `styles.css`, and inlined into the single
CSS bundle on build) declares two self-hosted variable fonts. One file per family
covers every weight the design uses, which is smaller than shipping separate
static weights:

| File | Covers | Size |
| --- | --- | --- |
| `fonts/inter-latin-variable.woff2` | Inter 300–700 | 48 KB |
| `fonts/manrope-latin-variable.woff2` | Manrope 300–700 | 24 KB |

Both are latin-subset only (the site is English-only) and both are licensed under
the SIL Open Font License 1.1 — the licence texts ship alongside them as
`fonts/Inter-OFL.txt` and `fonts/Manrope-OFL.txt`, as that licence requires.

There are no requests to `fonts.googleapis.com` or `fonts.gstatic.com` any more.
The display face is preloaded in `index.html` so the headline does not swap
fonts after first paint.

To update a font: request the weight range from Google Fonts with a modern
browser user agent (e.g. `family=Inter:wght@300..700`), download the `latin`
variable woff2 it returns, replace the file, and copy the matching
`unicode-range` value into `fonts.css`.

## Content images

Photos live in `images/` as AVIF with a JPEG fallback, wired up with `<picture>`
so that only one of the two is ever downloaded:

| Image | Used for | Delivered size |
| --- | --- | --- |
| `solar-array-golden` | hero, above the fold | 1100×732 |
| `solar-panel-detail` | solutions card, behind a gradient at 35% opacity | 640×960 |
| `solar-farm-horizon` | “why” section | 1100×733 |

These are still Unsplash stock — the photo id is recorded in a comment next to
each `<picture>` — and should be replaced with licensed company photography.
Rebuild them with macOS `sips`:

```bash
sips -s format avif -s formatOptions 60 --resampleWidth 1100 source.jpg --out images/solar-array-golden.avif
sips -s format jpeg -s formatOptions 80 --resampleWidth 1100 source.jpg --out images/solar-array-golden.jpg
```

`sips` can write AVIF but not WebP, which is why AVIF is the modern format here.

## Accessibility and colour contrast

`tools/contrast-audit.js` walks every text element, composites the real
foreground and background colours, and reports anything below WCAG AA. To run it
against the build, serve `dist/`, add the script to a copy of `index.html`, and
read the `data-contrast` attribute from the DOM (the file header documents the
exact steps).

Current state: 169 text elements checked at 1440px, 900px and 500px — 0 failures.

Two tokens exist purely to keep accents readable on light surfaces:
`--lime-ink` (`#617b19`) and `--aqua-ink` (`#257e75`). The bright `--lime` and
`--aqua` are still used for text on the dark ink surfaces, where they clear 5:1.
`--muted-on-dark` is the equivalent for muted copy on dark sections.

## Brand images

Everything in `brand/` is derived from the master files in `Uniglory-logo/`:

- `uniglory-logo.svg` — master artwork, print size attributes converted to pixels
- `uniglory-logo-white.svg` — same artwork with the blue wordmark set to white, for dark backgrounds
- `favicon.svg` — sun mark on a `#163b43` rounded tile
- `apple-touch-icon.png` — 180×180 render of `tools/apple-touch-icon.svg`
- `og-image.png` — 1200×630 social share image, rendered from `tools/og-image.html`
- `uniglory-logo.png` — transparent PNG referenced by the structured data

Re-render on macOS with headless Chrome:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 \
  --screenshot=brand/og-image.png "file://$PWD/tools/og-image.html"

"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=180,180 \
  --screenshot=brand/apple-touch-icon.png "file://$PWD/tools/apple-touch-icon.svg"
```

## SEO / GEO maintenance

- Bump `dateModified` in the `WebPage` node of the structured data and
  `lastmod` in `sitemap.xml` whenever the page content changes.
- The `FAQPage` structured data must stay word-for-word identical to the FAQ
  section rendered on the page.
- Keep the metadata block, the `Organization` node, and the visible copy
  describing the same facts — this is what AI answer engines read.
- `robots.txt` allows all crawlers. If you ever want to opt out of AI
  *training* crawlers, add explicit `Disallow: /` blocks there.

## Still to do before launch

- Fill in `TODO-content.md`, the facts needed to finish the product pages.
- Replace the Unsplash photos with licensed company or product photography.
- Verify warehouse wording, certifications, and warranty terms before
  publishing any such claims.
- Submit `https://www.unigloryenergy.com/sitemap.xml` in Google Search Console
  and Bing Webmaster Tools.
- Create a Google Business Profile for the Phelan, CA address.
- Add real social profile URLs to `sameAs` in the `Organization` structured
  data once those profiles exist.
