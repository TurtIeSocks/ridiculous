import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.app.json",
      include: ["tests/**/*.test-d.ts"],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/components/ui/color-picker/**"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
})
