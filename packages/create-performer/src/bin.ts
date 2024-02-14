#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import { bold, cyan, grey } from "kleur/colors";
import { create } from "./index.js";
import { package_manager } from "./utils.js";

const { version } = JSON.parse(
  fs.readFileSync(new URL("../../package.json", import.meta.url), "utf-8"),
);
let cwd = process.argv[2] || ".";

console.log(`
${grey(`create-performer version ${version}`)}
`);

p.intro("Welcome to Performer!");

if (cwd === ".") {
  const dir = await p.text({
    message: "Where should we create your project?",
    placeholder: "  (hit Enter to use current directory)",
  });

  if (p.isCancel(dir)) process.exit(1);

  if (dir) {
    cwd = dir;
  }
}

if (fs.existsSync(cwd)) {
  if (fs.readdirSync(cwd).length > 0) {
    const force = await p.confirm({
      message: "Directory not empty. Continue?",
      initialValue: false,
    });

    // bail if `force` is `false` or the user cancelled with Ctrl-C
    if (force !== true) {
      process.exit(1);
    }
  }
}

await create(cwd, {
  name: path.basename(path.resolve(cwd)),
  template: "default",
  types: "typescript",
});

p.outro("Your project is ready!");

console.log("\nNext steps:");
let i = 1;

const relative = path.relative(process.cwd(), cwd);
if (relative !== "") {
  console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
}

console.log(`  ${i++}: ${bold(cyan(`${package_manager} install`))}`);
console.log(
  `  ${i++}: ${bold(cyan(`Edit \`src/chat.tsx\` to customize your AI app.`))}`,
);

console.log(`\nNeed help? Visit us at ${cyan("https://performer.dev/")}`);
