import { Component } from "@performer/core";

export type AppImport = {
  slug: string;
  name: string;
  path: string;
  module: Record<string, any>;
};

export async function importApps(): Promise<AppImport[]> {
  const modules = import.meta.glob("@app/**/*.(tsx|jsx)");
  const imports: AppImport[] = [];
  for (const [path, loader] of Object.entries(modules)) {
    try {
      const module = (await loader()) as Record<string, unknown> & {
        meta?: unknown;
        App: Component<any>;
      };
      if (!("App" in module)) {
        console.warn(`No \`App\` export found in ${path}, skipping import`);
        continue;
      }
      let slug: string;
      let name: string;
      // default slug and name to filename
      slug = name = path.split("/").pop()!.split(".").shift()!;
      if (module.meta && typeof module.meta === "object") {
        if ("name" in module.meta && typeof module.meta.name === "string") {
          name = module.meta.name;
        }
        if ("slug" in module.meta && typeof module.meta.slug === "string") {
          slug = module.meta.slug;
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
