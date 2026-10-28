import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { loadSiteConfig } from "./src/infrastructure/siteConfig";

const { site } = loadSiteConfig(process.cwd());

export default defineConfig({
  site: site.url,
  base: site.base,
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
