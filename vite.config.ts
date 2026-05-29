import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: "/ridiculous/",
  root: "pages",
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
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "pages/index.html"),
        404: path.resolve(__dirname, "pages/404.html"),
        "color-picker": path.resolve(
          __dirname,
          "pages/color-picker/index.html",
        ),
        "gradient-editor": path.resolve(
          __dirname,
          "pages/gradient-editor/index.html",
        ),
        "unit-input": path.resolve(__dirname, "pages/unit-input/index.html"),
        "easing-picker": path.resolve(
          __dirname,
          "pages/easing-picker/index.html",
        ),
        "calc-editor": path.resolve(__dirname, "pages/calc-editor/index.html"),
        "transform-builder": path.resolve(
          __dirname,
          "pages/transform-builder/index.html",
        ),
        "filter-builder": path.resolve(
          __dirname,
          "pages/filter-builder/index.html",
        ),
        "grid-builder": path.resolve(
          __dirname,
          "pages/grid-builder/index.html",
        ),
        "clip-path-editor": path.resolve(
          __dirname,
          "pages/clip-path-editor/index.html",
        ),
        "box-shadow-editor": path.resolve(
          __dirname,
          "pages/box-shadow-editor/index.html",
        ),
        "transition-editor": path.resolve(
          __dirname,
          "pages/transition-editor/index.html",
        ),
        "font-editor": path.resolve(__dirname, "pages/font-editor/index.html"),
        "color-function": path.resolve(
          __dirname,
          "pages/color-function/index.html",
        ),
        "if-function": path.resolve(__dirname, "pages/if-function/index.html"),
        "query-builder": path.resolve(
          __dirname,
          "pages/query-builder/index.html",
        ),
      },
    },
  },
})
