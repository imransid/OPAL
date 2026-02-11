import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel/serverless";

// Prefer an explicit env, otherwise auto-detect Vercel preview/prod URL.
// PUBLIC_SITE_URL example: https://yourdomain.com
const site =
  process.env.PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://opal.example.com");

export default defineConfig({
  devToolbar: { enabled: false },

  // Vercel SSR
  output: "server",
  adapter: vercel(),

  site,

  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        // page is a full URL string
        const { pathname } = new URL(page);

        // exclude internal/admin + API routes
        if (pathname.startsWith("/admin")) return false;
        if (pathname.startsWith("/api")) return false;

        return true;
      },
    }),
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: [
            "global-builtin",
            "import",
            "color-functions",
            "if-function",
            "abs-percent",
          ],
        },
      },
    },
  },
});
