import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { transform } from "esbuild";

if (!process.env.VITE_PERFORMER_APP_PATH) {
  throw new Error("Environment variable VITE_PERFORMER_APP_PATH required.");
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: "performer-jsx-transformer",
      async transform(code, id) {
        if (id.startsWith(process.env.VITE_PERFORMER_APP_PATH)) {
          console.log(`Performer JSX transformed ${id}`);
          const result = await transform(code, {
            loader: "jsx",
            jsx: "automatic",
            jsxImportSource: "@performer/core",
            sourcefile: id,
          });
          return {
            code: result.code,
            map: result.map,
          };
        }
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      "@app": process.env.VITE_PERFORMER_APP_PATH,
    },
  },
});
