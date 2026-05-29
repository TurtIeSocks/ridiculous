import { existsSync, renameSync, rmSync } from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
// Pulls in the `ssgOptions` augmentation on Vite's UserConfig.
import type {} from "vite-react-ssg"

export default defineConfig({
  base: "/ridiculous/",
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  ssgOptions: {
    // /foo -> dist/foo/index.html (deep links served directly by GitHub Pages)
    dirStyle: "nested",
    // Render the catch-all route at a concrete /404 path so the NotFound page
    // is prerendered. The splat ("*") itself is dynamic and dropped by the
    // built-in filter, so without this there'd be no 404 page at all.
    includedRoutes: (paths) => [...paths, "/404"],
    // GitHub Pages serves /404.html for unmatched URLs. Promote the
    // prerendered dist/404/index.html to dist/404.html.
    onFinished: () => {
      const dist = path.resolve(__dirname, "dist")
      const nested = path.join(dist, "404", "index.html")
      const flat = path.join(dist, "404.html")
      if (existsSync(nested)) {
        renameSync(nested, flat)
        rmSync(path.join(dist, "404"), { recursive: true, force: true })
      }
    },
  },
})
