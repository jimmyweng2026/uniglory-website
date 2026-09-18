import { defineConfig } from "vite";
import { resolve } from "node:path";

// Multi-page build. Every page is a real HTML file so that the content is in the
// markup for crawlers, and so each page can carry its own metadata and
// structured data. Add a new entry here when you add a page.
export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: resolve(import.meta.dirname, "index.html"),
				"solar-modules": resolve(import.meta.dirname, "solar-modules/index.html"),
			},
		},
	},
});
