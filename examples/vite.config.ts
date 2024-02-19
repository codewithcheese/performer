import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: {
    alias: {
      "@performer/core/jsx-dev-runtime": "../packages/performer-core/src/jsx",
    },
  },
});
