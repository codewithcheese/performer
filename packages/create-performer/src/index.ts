import * as fs from "fs";
import * as path from "path";
import parser from "gitignore-parser";
import { copy, mkdirp } from "./utils.js";
import { fileURLToPath } from "url";
import glob from "tiny-glob/sync.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type Options = {
  name: string;
  template: "default";
  types: "typescript";
};

export async function create(cwd: string, options: Options): Promise<void> {
  mkdirp(cwd);

  write_template_files(options.template, options.types, options.name, cwd);
}

function write_template_files(
  template: string,
  types: "typescript",
  name: string,
  outputDir: string,
) {
  const relPath = path.basename(__dirname) === "src" ? "../" : "../../";
  const templateDir = path.join(__dirname, relPath, `templates/${template}`);
  const gitignoreFile = path.join(templateDir, "dot_gitignore");
  if (!fs.existsSync(gitignoreFile)) {
    throw new Error(`"${template}" template must have a "dot_gitignore" file`);
  }
  const gitignore = parser.compile(fs.readFileSync(gitignoreFile, "utf-8"));

  const packageJson = fs
    .readFileSync(path.join(templateDir, "package.template.json"))
    .toString();
  fs.writeFileSync(
    path.join(outputDir, "package.json"),
    packageJson.replace(/~TODO~/g, name),
  );

  copy(gitignoreFile, path.join(outputDir, ".gitignore"));

  const files = glob("**/*", { cwd: templateDir, filesOnly: true, dot: true });
  files.forEach((file) => {
    if (
      !gitignore.accepts(file) ||
      file === "package.json" ||
      file === "package.template.json" ||
      file === "dot_gitignore"
    ) {
      return;
    }

    const source = path.join(templateDir, file);
    const dest = path.join(outputDir, file);
    mkdirp(path.dirname(dest));
    const contents = fs.readFileSync(source).toString();
    fs.writeFileSync(dest, contents.replace(/~TODO~/g, name));
  });
}
