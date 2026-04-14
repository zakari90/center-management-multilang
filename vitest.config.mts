import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "stub-css",
      transform(code, id) {
        if (id.endsWith(".css") || id.endsWith(".scss") || id.endsWith(".sass")) {
          return { code: "" };
        }
      },
    },
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    // Disable CSS processing to avoid PostCSS configuration issues during tests
    css: false,
  },
});
