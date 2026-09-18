# UniGlory Energy website

> **Working on this project?** Read `HANDOFF.md` first. It carries the
> current state, the design tokens and their contrast ratios, verification
> recipes, open TODOs, and a session log. Update sections 2, 11 and 12 before
> you finish. It is gitignored on purpose: the repository is public.


A fast, static marketing website for UniGlory Energy, built with Vite.

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
| `index.html` | The home page: copy, metadata, structured data |
| `styles.css` | Stylesheet (bundled and minified into `dist/assets/`) |
| `fonts.css` | Self-hosted `@font-face` rules, imported by `styles.css` |
| `script.js` | Nav, scroll reveal, quote-form handling (copied as-is) |
| `brand/` | Web-ready logo files, favicon, Apple touch icon, social share image |
| `fonts/` | Web fonts plus their OFL licence files |
| `images/` | Content photos (AVIF where the encoder produces a valid file, always with a JPEG) |
| `tools/` | Sources for generated assets and the contrast audit script |
| `scripts/copy-static.mjs` | Completes `dist/` after `vite build` |
| `Uniglory-logo/` | Original master logo artwork (never deployed) |
| `TODO-content.md` | Facts still needed from UniGlory for the product pages |

## Fonts

`fonts.css` (imported at the top of `styles.css`, and inlined into the single
CSS bundle on build) declares two self-hosted faces:

| File | Covers | Size |
| --- | --- | --- |
| `fonts/instrument-serif-latin-400.woff2` | Instrument Serif 400 (headlines only) | 15 KB |
| `fonts/instrument-sans-latin-variable.woff2` | Instrument Sans 400–700 | 30 KB |

Both are latin-subset only (the site is English-only) and both are licensed under
the SIL Open Font License 1.1 — the licence texts ship alongside them as
`fonts/InstrumentSerif-OFL.txt` and `fonts/InstrumentSans-OFL.txt`, as that
licence requires.

Instrument Serif ships a **single 400 weight**. Never set a heavier weight on a
headline: the browser would synthesise a fake bold. Keep `--display` on `h1/h2/h3`
only — small labels, navigation and buttons use `--body`, or the serif would
distort them.

There are no requests to `fonts.googleapis.com` or `fonts.gstatic.com` any more.
Both faces are preloaded in all four pages, so headline and body text do not swap
fonts after first paint. If you change or remove a font file, update those
`rel="preload"` links in the same commit or they will request a file that no
longer exists.

To update a font: request it from Google Fonts with a modern browser user agent
(e.g. `family=Instrument+Sans:wght@400..700`), download the `latin` woff2 it
returns, and replace the file in `fonts/`.

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

Current state: 173 elements checked on the home page, 106 / 106 / 104 on the
three product pages, at 1440px, 900px and 500px — 0 failures.

The accent system is three tokens because one blue cannot do every job:

- `--accent` (`#1b4dff`) — fills carrying white text, and text on white. Both
  clear 5.9:1, which is why a single token replaces the old bright-lime /
  lime-ink pair.
- `--accent-on-dark` (`#4d8dff`) — the same hue lightened for the navy surfaces
  (5.6:1 on `--ink`). Using `--accent` there would fail at 3.0:1.
- `--gold` (`#f5a524`) — decoration only: the eyebrow dot, the orbit, the float
  card, the stamp. As text on white it reaches only 2.0:1, so `--gold-ink`
  (`#8f5e00`, 5.6:1) exists for the rare case where gold must be text on light.

`--muted-on-dark` is the equivalent for muted copy on dark sections.

## Brand images

Everything in `brand/` is derived from the master files in `Uniglory-logo/`:

- `uniglory-logo.svg` — master artwork, print size attributes converted to pixels
- `uniglory-logo-white.svg` — same artwork with the blue wordmark set to white, for dark backgrounds
- `favicon.svg` — sun mark on a `#0a1730` rounded tile
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
