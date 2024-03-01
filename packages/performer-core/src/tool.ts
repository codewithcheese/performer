import { z } from "zod";
import { ToolMessage } from "./message.js";

export interface Tool {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
  callback?: (
    params: z.infer<any>,
    tool_call_id: string,
  ) => void | ToolMessage | Promise<ToolMessage | void>;
}

export function createTool<T extends z.ZodObject<any>>(
  name: string,
  schema: T,
  callback?: (
    params: z.infer<T>,
    tool_call_id: string,
  ) => void | ToolMessage | Promise<ToolMessage | void>,
): Tool {
  return {
    name,
    description: schema.description || "",
    schema,
    callback,
  };
}
