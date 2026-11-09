import { defineConfig } from "vitest/config";
import path from "path";

// Testes de unidade. Os testes de navegador (e2e/) são do Playwright e ficam de fora.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", "e2e"],
    environment: "node",
  },
});
