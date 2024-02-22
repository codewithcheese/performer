import { Component } from "@performer/core";

export type AppImport = {
  name: string;
  path: string;
  module: Record<string, any>;
};

export async function importApps(): Promise<AppImport[]> {
  const modules = import.meta.glob("@app/**/*.(tsx|jsx|sandpack)");
  const imports: AppImport[] = [];
  for (const [path, loader] of Object.entries(modules)) {
    try {
      let module = (await loader()) as Record<string, unknown> & {
        meta?: { name?: string };
        App: Component<any>;
      };
      if (!("App" in module)) {
        console.warn(`No \`App\` export found in ${path}, skipping import`);
        continue;
      }
      let name: string;
      if (
        "meta" in module &&
        module.meta &&
        "name" in module.meta &&
        module.meta.name
      ) {
        name = module.meta.name;
      } else {
        // use filename
        name = path.split("/").pop()!.split(".").shift()!;
      }
      console.log(path, module);
      imports.push({
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
