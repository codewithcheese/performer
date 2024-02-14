import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function mkdirp(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "EEXIST") {
      return;
    }
    throw e;
  }
}

export function rimraf(path: string) {
  (fs.rmSync || fs.rmdirSync)(path, { recursive: true, force: true });
}

export function copy(from: string, to: string, rename = (x: string) => x) {
  if (!fs.existsSync(from)) return;

  const stats = fs.statSync(from);

  if (stats.isDirectory()) {
    fs.readdirSync(from).forEach((file) => {
      copy(path.join(from, file), path.join(to, rename(file)));
    });
  } else {
    mkdirp(path.dirname(to));
    fs.copyFileSync(from, to);
  }
}

export function dist(path: string) {
  return fileURLToPath(new URL(`../dist/${path}`, import.meta.url).href);
}

export const package_manager = get_package_manager() || "npm";

/**
 * Supports npm, pnpm, Yarn, cnpm, bun and any other package manager that sets the
 * npm_config_user_agent env variable.
 * Thanks to https://github.com/zkochan/packages/tree/main/which-pm-runs for this code!
 */
function get_package_manager() {
  if (!process.env.npm_config_user_agent) {
    return undefined;
  }
  const user_agent = process.env.npm_config_user_agent;
  const pm_spec = user_agent.split(" ")[0];
  const separator_pos = pm_spec!.lastIndexOf("/");
  const name = pm_spec!.substring(0, separator_pos);
  return name === "npminstall" ? "cnpm" : name;
}
