import { useMessages } from "../hooks/index.js";
import { ChatOpenAI } from "langchain/chat_models/openai";
import type { Component } from "../component.js";
import { BaseMessage } from "langchain/schema";
import {
  type PerformerMessage,
  fromLangchain,
  isAssistantMessage,
  isImageContent,
  isMessage,
  isTextContent,
  toLangchain,
  type ToolMessage,
} from "../message.js";
import type { BaseChatModel } from "langchain/chat_models/base";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { PerformerEvent, createMessageEvent } from "../event.js";
import { useAnnounce } from "../hooks/use-announce.js";

export interface Tool {
  id: string;
  name: string;
  description: string;
  params: z.ZodObject<any>;
  call: (params: any) => Promise<ToolMessage | void>;
}

export type AssistantProps = {
  model?: BaseChatModel; // rollup error  TS2305: Module '"langchain/chat_models/base"' has no exported member 'BaseChatModel'.
  content?: string;
  toolChoice?: "auto" | "none" | Tool;
  tools?: Tool[];
  onMessage?: (message: PerformerMessage) => void;
};

export const Assistant: Component<AssistantProps> = async (
  { model, toolChoice = "auto", tools = [], content, onMessage = () => {} },
  use,
) => {
  const announce = useAnnounce();
  const messages = useMessages();
  const newMessages: PerformerMessage[] = [];

  if (content) {
    const message = {
      role: "assistant" as const,
      content: [{ type: "text" as const, text: content }],
    };
    newMessages.push(message);
    onMessage(message);
  } else {
    let options = {};

    if (tools.length) {
      const toolMap: Map<string, Tool> = new Map();
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
          toolMap.set(tool.id, tool);
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

    const lcMessages = toLangchain(messages);
    const message = await use(async (controller) => {
      if (!model) {
        model = new ChatOpenAI();
      }
      const chat = model.bind({ signal: controller.signal, ...options });
      const iterable = await chat.stream(lcMessages);
      const transformStream = new TransformStream<
        BaseMessage,
        PerformerMessage
      >(fromLangchain);
      return await handleChatModelResponse(
        iterable.pipeThrough(transformStream),
        announce,
      );
    });
    if (message) {
      newMessages.push(message);
      onMessage(message);
    }

    if (isAssistantMessage(message) && message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        // @ts-expect-error index is undocumented
        const tool = tools[toolCall.index];
        if (!tool) {
          throw Error(`Tool not found for tool call: ${toolCall.id}`);
        }
        const toolMessage = await tool.call(
          JSON.parse(toolCall.function.arguments),
        );
        if (toolMessage) {
          newMessages.push(toolMessage);
          onMessage(toolMessage);
        }
      }
    }
  }

  return () => {
    return newMessages.map((message) => {
      switch (message.role) {
        case "tool":
          return <tool id={message.id} content={message.content} />;
        case "assistant":
          return (
            <assistant
              tool_calls={message.tool_calls}
              function_call={message.function_call}
              content={message.content}
            />
          );
        case "user":
          return <user content={message.content} />;
        case "system":
          return <system content={message.content} />;
        default:
          throw Error("Unknown message role: " + (message as any).role);
      }
    });
  };
};

// typescript does not recognise ReadableStream as async iterable
function isAsyncIterable(obj: unknown): obj is AsyncIterable<unknown> {
  return (
    !!obj &&
    typeof (obj as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function"
  );
}

async function handleChatModelResponse(
  msgOrStream: ReadableStream<unknown>,
  announce: (event: PerformerEvent) => void,
): Promise<PerformerMessage | undefined> {
  let aggregate: PerformerMessage | undefined;
  // todo use more network efficient id
  const sid = crypto.randomUUID();
  if (isAsyncIterable(msgOrStream)) {
    for await (const chunk of msgOrStream) {
      if (isMessage(chunk)) {
        announce({
          sid,
          op: "update",
          type: "MESSAGE",
          payload: chunk,
        });
        if (!aggregate) {
          aggregate = { ...chunk };
        } else {
          // aggregate function call
          if (
            isAssistantMessage(chunk) &&
            isAssistantMessage(aggregate) &&
            chunk.function_call &&
            aggregate.function_call
          ) {
            aggregate.function_call.arguments += chunk.function_call.arguments;
          }
          // aggregate tool calls
          if (
            isAssistantMessage(chunk) &&
            isAssistantMessage(aggregate) &&
            chunk.tool_calls &&
            aggregate.tool_calls
          ) {
            for (const [index, toolCall] of chunk.tool_calls.entries()) {
              aggregate.tool_calls[index].function.arguments +=
                toolCall.function.arguments;
            }
          }

          if (isAssistantMessage(chunk)) {
            // fixme always append to last not index
            for (const [i, chunkEntry] of chunk.content.entries()) {
              const aggregateEntry = aggregate.content[i];
              if (isTextContent(chunkEntry) && isTextContent(aggregateEntry)) {
                aggregateEntry.text += chunkEntry.text;
              } else if (
                isImageContent(chunkEntry) &&
                isImageContent(aggregateEntry)
              ) {
                aggregateEntry.image_url += chunkEntry.image_url;
              }
            }
          }
        }
      }
    }
    if (aggregate) {
      announce({
        sid,
        op: "close",
        type: "MESSAGE",
        payload: aggregate,
      });
      return aggregate;
    }
  } else if (isMessage(msgOrStream)) {
    announce(createMessageEvent(msgOrStream));
    return msgOrStream;
  }
  return;
}
