import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
if (args.length === 0 || !args[0]) {
  console.error("Usage: npm run playground <performer-app-path>");
  process.exit(1); // Exits with a non-zero code to indicate an error
}

const appPath = path.join(process.cwd(), args[0]);

console.log("Starting Performer UI...", appPath);

const vite = spawn(
  path.join(
    process.cwd(),
    "./node_modules/@performer/playground/node_modules/.bin/vite",
  ),
  ["--port", 3011],
  {
    env: {
      VITE_PERFORMER_APP_PATH: appPath,
      VITE_OPENAI_API_KEY: process.env["OPENAI_API_KEY"],
    },
    stdio: "inherit",
    shell: true,
    cwd: path.join(process.cwd(), "./node_modules/@performer/playground/"),
  },
);

vite.on("close", (code) => {
  console.log(`Vite process exited with code ${code}`);
});
