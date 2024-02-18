#!/usr/bin/env node

import * as path from "path";
import * as fs from "fs";
import "dotenv/config";
import { fileURLToPath } from "url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

export function mkdirp(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "EEXIST") {
      return;
    }
    throw e;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
if (args.length === 0 || !args[0]) {
  console.error("Usage: npm run playground <performer-app-path>");
  process.exit(1); // Exits with a non-zero code to indicate an error
}

const srcPath = path.join(__dirname, '../src/')
const rootPath = path.join(process.cwd(), './.playground/')
const appPath = path.join(process.cwd(), args[0]);

mkdirp(rootPath)
fs.copyFileSync(path.join(srcPath, './root.html'), path.join(rootPath, './index.html'));

console.log("Starting playground...", appPath);

const server = await createServer({
  configFile: false,
  root: rootPath,
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
