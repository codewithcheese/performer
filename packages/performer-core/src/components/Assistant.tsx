import {
  useMessages,
  useResource,
  useState,
  useAbortController,
} from "../hooks/index.js";
import type { Component } from "../component.js";
import {
  isAssistantMessage,
  MessageDelta,
  type PerformerMessage,
  ToolMessage,
} from "../message.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import OpenAI from "openai";
import { isEmptyObject } from "../util/is-empty-object.js";
import { Tool } from "../tool.js";
import "../util/readable-stream-polyfill.js";

export type AssistantProps = {
  baseURL?: string;
  apiKey?: string;
  model?: string;
  toolChoice?: "auto" | "none" | Tool;
  tools?: Tool[];
  defaultHeaders?: Record<string, any>;
  dangerouslyAllowBrowser?: boolean;
  onMessage?: (message: PerformerMessage) => void;
};

export const Assistant: Component<AssistantProps> = function ({
  apiKey,
  baseURL,
  model = "gpt-3.5-turbo",
  toolChoice = "auto",
  tools = [],
  onMessage = () => {},
  dangerouslyAllowBrowser = true,
  defaultHeaders,
}) {
  const toolMessages = useState<ToolMessage[]>([]);
  const messages = useMessages();

  let options: Record<string, any> = {};
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
            parameters: zodToJsonSchema(tool.schema),
          },
        };
      }),
    };
  }

  const controller = useAbortController();
  const message = useResource(async () => {
    const openai = new OpenAI({
      ...(apiKey ? { apiKey } : {}),
      ...(baseURL ? { baseURL } : {}),
      ...(defaultHeaders ? { defaultHeaders } : {}),
      ...(dangerouslyAllowBrowser ? { dangerouslyAllowBrowser } : {}),
    });
    const stream = await openai.chat.completions.create(
      {
        model,
        messages,
        stream: true,
        ...(options ? options : {}),
      },
      { signal: controller.signal },
    );
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
      toolMessages.value = await Promise.all(
        message.tool_calls.map(async (toolCall): Promise<ToolMessage> => {
          const tool = tools.find(
            (tool) => tool.name === toolCall.function.name,
          );
          if (!tool) {
            throw Error(`Tool not found for tool call: ${toolCall.id}`);
          }
          if (tool.callback) {
            const message = await tool.callback(
              JSON.parse(toolCall.function.arguments),
              toolCall.id,
            );
            if (message) {
              return message;
            }
          }

          return {
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolCall.function.arguments,
          };
        }),
      );
    }
  }

  return () => {
    return (
      <>
        <raw onResolved={callTools} onMessage={onMessage} stream={message} />
        {toolMessages.value.map((message) => (
          <raw onMessage={onMessage} message={message} />
        ))}
      </>
    );
  };
};
