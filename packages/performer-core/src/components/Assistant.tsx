import { MessageDelta, type PerformerMessage } from "../message.js";
import { ClientOptions, OpenAI } from "openai";
import { object } from "../util/object.js";
import "../util/readable-stream-polyfill.js";
import { ReactNode, useCallback } from "react";
import { ActionType } from "../action.js";
import { Message } from "./Message.js";
import { ChatCompletionCreateParamsStreaming } from "openai/resources/index";
import { Tool } from "../index.js";
import { zodToJsonSchema } from "zod-to-json-schema";

export function Assistant({
  className,
  model = "gpt-3.5-turbo",
  toolChoice = "auto",
  tools = [],
  requestOptions = {},
  clientOptions = {},
  children,
}: {
  className?: string;
  model?: string;
  toolChoice?: "auto" | "none" | Tool;
  tools?: Tool[];
  requestOptions?: Partial<ChatCompletionCreateParamsStreaming>;
  clientOptions?: ClientOptions;
  children?: ReactNode | ((message: PerformerMessage) => ReactNode);
}) {
  const action = useCallback<ActionType>(
    async ({ messages, signal }) =>
      fetchCompletion({
        model,
        toolChoice,
        tools,
        messages,
        signal,
        requestOptions,
        clientOptions,
      }),
    [model, requestOptions, clientOptions, tools, toolChoice],
  );
  return (
    <Message className={className} action={action}>
      {children}
    </Message>
  );
}

async function fetchCompletion({
  model = "gpt-3.5-turbo",
  toolChoice = "auto",
  tools = [],
  messages,
  signal,
  requestOptions,
  clientOptions = {},
}: {
  model?: string;
  toolChoice?: "auto" | "none" | Tool;
  tools?: Tool[];
  messages: PerformerMessage[];
  signal: AbortSignal;
  requestOptions?: Partial<ChatCompletionCreateParamsStreaming>;
  clientOptions?: ClientOptions;
}) {
  if (tools.length) {
    requestOptions = {
      ...requestOptions,
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
  const openai = new OpenAI({
    dangerouslyAllowBrowser: true,
    ...clientOptions,
  });
  const stream = await openai.chat.completions.create(
    {
      model,
      messages,
      stream: true,
      ...requestOptions,
    },
    { signal },
  );
  return new ReadableStream<MessageDelta>({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!object(delta)) {
          controller.enqueue(delta);
        }
      }
      controller.close();
    },
  });
}
