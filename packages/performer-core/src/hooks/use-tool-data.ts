import { z } from "zod";
import { Tool } from "../components/index.js";
import { useState } from "./use-state.js";
import { Signal } from "@preact/signals-core";

export function useToolData<Params extends z.ZodObject<any>>(
  name: string,
  description: string,
  params: Params,
  initValue: z.infer<Params>,
): [Signal<z.infer<Params>>, Tool] {
  const data = useState<z.infer<Params>>(initValue);
  const tool: Tool = {
    id: name,
    name,
    description,
    params,
    async call(_, args) {
      data.value = args;
    },
  };
  return [data, tool];
}
