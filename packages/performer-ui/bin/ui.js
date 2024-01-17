import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
if (args.length === 0 || !args[0]) {
  console.error("Usage: npm run performer-ui <performer-app-path>");
  process.exit(1); // Exits with a non-zero code to indicate an error
}

const appPath = path.join(process.cwd(), args[0]);

console.log("Starting Performer UI...", appPath);

const vite = spawn(
  path.join(__dirname, "../node_modules/.bin/vite"),
  ["--port", 3011],
  {
    env: { PERFORMER_APP_PATH: appPath },
    stdio: "inherit",
    shell: true,
  },
);

vite.on("close", (code) => {
  console.log(`Vite process exited with code ${code}`);
});
