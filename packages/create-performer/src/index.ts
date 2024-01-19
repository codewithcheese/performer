import fs from "node:fs";
import path from "node:path";
import { mkdirp, copy, dist } from "./utils.js";

export type Options = {
  name: string;
  template: "default";
  types: "typescript";
};

export type File = {
  name: string;
  contents: string;
};

export type Condition = "default";

export type Common = {
  files: Array<{
    name: string;
    include: Condition[];
    exclude: Condition[];
    contents: string;
  }>;
};

export async function create(cwd: string, options: Options): Promise<void> {
  mkdirp(cwd);

  write_template_files(options.template, options.types, options.name, cwd);
  write_common_files(cwd, options, options.name);
}

function write_template_files(
  template: string,
  types: "typescript" | "checkjs" | null,
  name: string,
  cwd: string,
) {
  const dir = dist(`templates/${template}`);
  copy(`${dir}/assets`, cwd, (name: string) => name.replace("DOT-", "."));
  copy(`${dir}/package.json`, `${cwd}/package.json`);

  const manifest = `${dir}/files.types=${types}.json`;
  const files: File[] = JSON.parse(fs.readFileSync(manifest, "utf-8"));

  files.forEach((file) => {
    const dest = path.join(cwd, file.name);
    mkdirp(path.dirname(dest));

    fs.writeFileSync(dest, file.contents.replace(/~TODO~/g, name));
  });
}

function write_common_files(cwd: string, options: Options, name: string) {
  const shared = dist("shared.json");
  const { files }: Common = JSON.parse(fs.readFileSync(shared, "utf-8"));

  const pkg_file = path.join(cwd, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkg_file, "utf-8"));

  sort_files(files).forEach((file) => {
    const include = file.include.every((condition) =>
      matches_condition(condition, options),
    );
    const exclude = file.exclude.some((condition) =>
      matches_condition(condition, options),
    );

    if (exclude || !include) return;

    if (file.name === "package.json") {
      const new_pkg = JSON.parse(file.contents);
      merge(pkg, new_pkg);
    } else {
      const dest = path.join(cwd, file.name);
      mkdirp(path.dirname(dest));
      fs.writeFileSync(dest, file.contents);
    }
  });

  pkg.dependencies = sort_keys(pkg.dependencies);
  pkg.devDependencies = sort_keys(pkg.devDependencies);
  pkg.name = to_valid_package_name(name);

  fs.writeFileSync(pkg_file, JSON.stringify(pkg, null, "\t") + "\n");
}

/**
 * @param {import('./types/internal.js').Condition} condition
 * @param {import('./types/internal.js').Options} options
 * @returns {boolean}
 */
function matches_condition(condition: Condition, options: Options): boolean {
  if (
    condition === "default" ||
    condition === "skeleton" ||
    condition === "skeletonlib"
  ) {
    return options.template === condition;
  }
  if (condition === "typescript" || condition === "checkjs") {
    return options.types === condition;
  }
  return !!options[condition];
}

/**
 * @param {any} target
 * @param {any} source
 */
function merge(target: any, source: any) {
  for (const key in source) {
    if (key in target) {
      const target_value = target[key];
      const source_value = source[key];

      if (
        typeof source_value !== typeof target_value ||
        Array.isArray(source_value) !== Array.isArray(target_value)
      ) {
        throw new Error("Mismatched values");
      }

      if (typeof source_value === "object") {
        merge(target_value, source_value);
      } else {
        target[key] = source_value;
      }
    } else {
      target[key] = source[key];
    }
  }
}

/** @param {Record<string, any>} obj */
function sort_keys(obj: Record<string, any>) {
  if (!obj) return;

  /** @type {Record<string, any>} */
  const sorted: Record<string, any> = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });

  return sorted;
}

/**
 * Sort files so that those which apply more generically come first, so they
 * can be overwritten by files for more precise cases later.
 *
 * @param {import('./types/internal.js').Common['files']} files
 */
function sort_files(files: Common["files"]) {
  return files.sort((f1, f2) => {
    const f1_more_generic =
      f1.include.every((include) => f2.include.includes(include)) &&
      f1.exclude.every((exclude) => f2.exclude.includes(exclude));
    const f2_more_generic =
      f2.include.every((include) => f1.include.includes(include)) &&
      f2.exclude.every((exclude) => f1.exclude.includes(exclude));
    const same = f1_more_generic && f2_more_generic;
    const different = !f1_more_generic && !f2_more_generic;
    return same || different ? 0 : f1_more_generic ? -1 : 1;
  });
}

/** @param {string} name */
function to_valid_package_name(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z0-9~.-]+/g, "-");
}
