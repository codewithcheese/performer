#!/usr/bin/env node

import * as path from "path";
import "dotenv/config";
import { fileURLToPath } from "url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
if (args.length === 0 || !args[0]) {
  console.error("Usage: npm run playground <performer-app-path>");
  process.exit(1); // Exits with a non-zero code to indicate an error
}

const rootPath = path.join(__dirname, '../')
const appPath = path.join(process.cwd(), args[0]);

console.log("Starting playground...");
console.log("Discovering performers in: ", appPath);

const server = await createServer({
  configFile: false,
  root: rootPath,
  optimizeDeps: {
    // when root is in node_modules vite does not detect dependencies that need to be pre-bundled
    include: ['react-dom', 'react-dom/client', 'loglevel'],
    // it seems vite also ignore entries when the root is in node modules
    // entries: ['./src/main.tsx']
  },
  server: {
    port: 3011,
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@app": appPath,
    },
  },
});

await server.listen();
server.printUrls();
