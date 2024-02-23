import { defineConfig } from "vitest/config";
import svgr from "vite-plugin-svgr";
import react from "@vitejs/plugin-react";
import path from "path";

const examplesPath = path.join(__dirname, "./e2e/apps");

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    include: ["test/**.*"],
  },
  plugins: [
    svgr(),
    react(),
  ],
  resolve: {
    alias: {
      "@app": examplesPath,
    },
  },
});
