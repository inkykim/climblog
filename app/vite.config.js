import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  // Relative base so the built site works whether served at a domain root
  // (Cloudflare Pages) or a subpath (e.g. GitHub Pages project site).
  base: "./",
  plugins: [svelte()],
});
