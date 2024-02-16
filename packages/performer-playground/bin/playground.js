import { createServer } from "vite";
import * as path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
if (args.length === 0 || !args[0]) {
  console.error("Usage: npm run playground <performer-app-path>");
  process.exit(1); // Exits with a non-zero code to indicate an error
}

const playgroundDir = path.join(
  process.cwd(),
  "./node_modules/@performer/playground/",
);

const appPath = path.join(process.cwd(), args[0]);

console.log("Starting playground...", appPath);

const server = await createServer({
  root: playgroundDir,
  server: {
    port: 3011,
  },
  resolve: {
    alias: {
      "@app": appPath,
    },
  },
});

await server.listen();
server.printUrls();
