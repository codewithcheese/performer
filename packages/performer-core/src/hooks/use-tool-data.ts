import { z } from "zod";
import { createTool, Tool } from "../components/index.js";
import { useState } from "./use-state.js";
import { Signal } from "@preact/signals-core";
import { isEmptyObject } from "../util/is-empty-object.js";
import { getDefaults } from "../util/zod.js";

export function useToolData<Params extends z.ZodObject<any>>(
  name: string,
  schema: Params,
): [Signal<z.infer<Params>>, Tool] {
  const defaultValue = getDefaults(schema);
  if (isEmptyObject(defaultValue)) {
    throw Error("useToolData() schema must have a default value");
  }
  const data = useState<z.infer<Params>>(defaultValue);
  const tool = createTool(name, schema, async (_, args) => {
    data.value = args;
  });
  return [data, tool];
}
