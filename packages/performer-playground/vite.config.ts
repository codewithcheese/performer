import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { transform } from "esbuild";
import path from "path";

const examplesPath = path.join(__dirname, "../../examples");

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    include: ["test/**.*"],
  },
  plugins: [
    // {
    //   name: "performer-jsx-transformer",
    //   async transform(code, id) {
    //     if (id.startsWith(examplesPath)) {
    //       console.log(`Performer JSX transformed ${id}`);
    //       const result = await transform(code, {
    //         loader: "jsx",
    //         jsx: "automatic",
    //         jsxImportSource: "@performer/core",
    //         sourcefile: id,
    //       });
    //       return {
    //         code: result.code,
    //         map: result.map,
    //       };
    //     }
    //   },
    // },
    react(),
  ],
  resolve: {
    alias: {
      "@app": examplesPath,
    },
  },
});
