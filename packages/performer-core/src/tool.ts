import { z } from "zod";
import { AssistantMessage, ToolMessage } from "./message.js";

export interface Tool<T extends z.ZodObject<any>> {
  name: string;
  description: string;
  schema: T;
}

export function getToolCall<T extends z.ZodObject<any>>(
  tool: Tool<T>,
  message: AssistantMessage,
) {
  const toolCall = message.tool_calls?.find(
    (tc) => tool.name === tc.function.name,
  );
  return (
    toolCall && {
      id: toolCall.id,
      data: JSON.parse(toolCall.function.arguments) as z.infer<
        typeof tool.schema
      >,
    }
  );
}

export function createTool<T extends z.ZodObject<any>>(
  name: string,
  schema: T,
): Tool<T> {
  return {
    name,
    description: schema.description || "",
    schema,
  };
}
