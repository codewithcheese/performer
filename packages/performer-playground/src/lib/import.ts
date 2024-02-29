import { Component } from "@performer/core";
import { slugify } from "./slugify.js";

export type AppImport = {
  slug: string;
  name: string;
  path: string;
  module: Record<string, any>;
};

export async function importApps(target = "browser"): Promise<AppImport[]> {
  const modules = import.meta.glob("@app/**/*.(tsx|jsx|sandpack)");
  const imports: AppImport[] = [];
  for (const [path, loader] of Object.entries(modules)) {
    try {
      let module = (await loader()) as Record<string, unknown> & {
        meta?: unknown;
        App: Component<any>;
      };
      if (!("App" in module)) {
        console.warn(`No \`App\` export found in ${path}, skipping import`);
        continue;
      }
      let slug: string;
      let name: string;
      // default name to filename
      name = path.split("/").pop()!.split(".").shift()!;
      if ("name" in module && typeof module.name === "string") {
        name = module.name;
      }
      if ("slug" in module && typeof module.slug === "string") {
        slug = module.slug;
      } else {
        slug = slugify(name);
      }
      if ("target" in module && typeof module.target === "string") {
        if (module.target !== target) {
          // skip if module does not match target
          continue;
        }
      }
      console.log(path, module);
      imports.push({
        slug,
        name,
        path,
        module: module as Record<string, any>,
      });
    } catch (e) {
      console.error(e);
    }
  }
  return imports;
}
