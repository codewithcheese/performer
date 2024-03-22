import { z } from "zod";
import { useState } from "./use-state.js";
import { Signal } from "@preact/signals-core";
import { isEmptyObject } from "../util/is-empty-object.js";
import { getDefaults } from "../util/zod.js";
import { createTool, Tool } from "../tool.js";
import { logger } from "../util/log.js";

export function useToolData<Params extends z.ZodObject<any>>(
  name: string,
  schema: Params,
): [Signal<z.infer<Params>>, Tool] {
  const defaultValue = getDefaults(schema);
  if (isEmptyObject(defaultValue)) {
    throw Error("useToolData() schema must have default values.");
  }
  const data = useState<z.infer<Params>>(defaultValue);
  const tool = createTool(name, schema, async (args) => {
    logger.withTag("useToolData").debug(name, args);
    data.value = args;
  });
  return [data, tool];
}
