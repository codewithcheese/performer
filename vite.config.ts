import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["**/test/*.test.*"],
  },
  resolve: {
    alias: {
      "@performer/core/jsx-dev-runtime": "./packages/performer-core/src/jsx",
    },
  },
});
