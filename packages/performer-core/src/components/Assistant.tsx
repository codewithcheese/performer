import { useMessages, useState } from "../hooks/index.js";
import type { Component } from "../component.js";
import {
  isAssistantMessage,
  MessageDelta,
  type PerformerMessage,
  ToolMessage,
} from "../message.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import OpenAI from "openai";
import { isEmptyObject } from "../util/is-empty-object.js";

export interface Tool {
  name: string;
  description: string;
  params: z.ZodObject<any>;
  call: (
    id: string,
    params: z.infer<any>,
  ) => void | ToolMessage | Promise<ToolMessage | void>;
}

export function createTool<T extends z.ZodObject<any>>(
  name: string,
  schema: T,
  callback: (
    id: string,
    params: z.infer<T>,
  ) => void | ToolMessage | Promise<ToolMessage | void>,
): Tool {
  return {
    name,
    description: schema.description || "",
    params: schema,
    call: callback,
  };
}

export type AssistantProps = {
  model?: string;
  toolChoice?: "auto" | "none" | Tool;
  tools?: Tool[];

  onMessage?: (message: PerformerMessage) => void;
};

export const Assistant: Component<AssistantProps> = async (
  {
    model = "gpt-3.5-turbo",
    toolChoice = "auto",
    tools = [],
    onMessage = () => {},
  },
  { useResource },
) => {
  const toolMessages = useState<ToolMessage[]>([]);
  const messages = useMessages();

  let options = {};
  if (tools.length) {
    options = {
      ...options,
      // response_format: {
      // 	type: 'json_object'
      // },
      tool_choice:
        typeof toolChoice === "string"
          ? toolChoice
          : { type: "function", function: { name: toolChoice.name } },
      tools: tools.map((tool) => {
        return {
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: zodToJsonSchema(tool.params),
          },
        };
      }),
    };
  }

  const message = await useResource(async (controller) => {
    const openai = new OpenAI();
    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      ...(options ? options : {}),
    });
    controller.signal.addEventListener("abort", () => {
      stream.controller.abort();
    });
    return new ReadableStream<MessageDelta>({
      async start(controller) {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          if (!isEmptyObject(delta)) {
            controller.enqueue(delta);
          }
        }
        controller.close();
      },
    });
  });

  async function callTools(message: PerformerMessage) {
    if (isAssistantMessage(message) && message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        // @ts-expect-error index is undocumented
        const tool = tools[toolCall.index];
        if (!tool) {
          throw Error(`Tool not found for tool call: ${toolCall.id}`);
        }
        const message = await tool.call(
          toolCall.id,
          JSON.parse(toolCall.function.arguments),
        );
        if (!message) {
          toolMessages.value = [
            ...toolMessages.value,
            { role: "tool", tool_call_id: toolCall.id, content: "" },
          ];
        } else {
          toolMessages.value = [...toolMessages.value, message];
        }
      }
    }
  }

  return () => {
    return (
      <>
        <raw onResolved={callTools} onMessage={onMessage} stream={message} />
        {toolMessages.value.map((message) => (
          <raw message={message} />
        ))}
      </>
    );
  };
};
