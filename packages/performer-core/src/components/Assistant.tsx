import { useMessages } from "../hooks/index.js";
import { ChatOpenAI } from "langchain/chat_models/openai";
import type { Component } from "../component.js";
import {
  AIMessage,
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
  SystemMessage as LCSystemMessage,
} from "langchain/schema";
import {
  isAssistantMessage,
  MessageContent,
  type PerformerMessage,
} from "../message.js";
import type { BaseChatModel } from "langchain/chat_models/base";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface Tool {
  id: string;
  name: string;
  description: string;
  params: z.ZodObject<any>;
  call: (params: any) => void;
}

export type AssistantProps = {
  model?: BaseChatModel;
  toolChoice?: "auto" | "none" | Tool;
  tools?: Tool[];
  onMessage?: (message: PerformerMessage) => void;
};

export const Assistant: Component<AssistantProps> = async (
  { model, toolChoice = "auto", tools = [], onMessage = () => {} },
  { useResource },
) => {
  const messages = useMessages();

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
  const message = await useResource(async (controller) => {
    if (!model) {
      model = new ChatOpenAI();
    }
    const chat = model.bind({ signal: controller.signal, ...options });
    const iterable = await chat.stream(lcMessages);
    const transformStream = new TransformStream<BaseMessage, PerformerMessage>(
      fromLangchain,
    );
    return iterable.pipeThrough(transformStream);
  });

  async function handleMessage(message: PerformerMessage) {
    if (isAssistantMessage(message) && message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        // @ts-expect-error index is undocumented
        const tool = tools[toolCall.index];
        if (!tool) {
          throw Error(`Tool not found for tool call: ${toolCall.id}`);
        }
        tool.call(JSON.parse(toolCall.function.arguments));
      }
    }
    onMessage(message);
  }

  return () => {
    return <message onMessage={handleMessage} stream={message} />;
  };
};

export const fromLangchain = {
  transform(
    chunk: BaseMessage,
    controller: TransformStreamDefaultController<PerformerMessage>,
  ) {
    let role: "user" | "assistant" | "system";
    if (chunk instanceof HumanMessage) {
      role = "user";
    } else if (chunk instanceof AIMessage || chunk instanceof AIMessageChunk) {
      role = "assistant";
    } else if (chunk instanceof LCSystemMessage) {
      role = "system";
    } else {
      throw new Error("Unknown message type");
    }
    let content: MessageContent = [];
    let tool_calls;
    let function_call;
    if (typeof chunk.content === "string") {
      content.push({ type: "text", text: chunk.content });
    } else if (Array.isArray(chunk.content)) {
      for (const contentPart of chunk.content) {
        switch (contentPart.type) {
          case "text":
            content.push(contentPart);
            break;
          case "image_url":
            content.push({
              type: "image_url",
              image_url:
                typeof contentPart.image_url === "object"
                  ? contentPart.image_url.url
                  : contentPart.image_url,
            });
            break;
          default:
            throw new Error("Unsupported content type");
        }
      }
    } else {
      throw new Error("Unsupported content type");
    }
    if (chunk.additional_kwargs?.tool_calls) {
      tool_calls = chunk.additional_kwargs.tool_calls;
    }
    if (chunk.additional_kwargs?.function_call) {
      function_call = chunk.additional_kwargs.function_call;
    }
    controller.enqueue({ role, content, tool_calls, function_call });
  },
};

export function toLangchain(messages: PerformerMessage[]) {
  const lcMessages: BaseMessage[] = [];
  messages.forEach((message) => {
    switch (message.role) {
      case "system":
        lcMessages.push(new LCSystemMessage({ content: message.content }));
        break;
      case "user":
        lcMessages.push(new HumanMessage({ content: message.content }));
        break;
      case "assistant":
        lcMessages.push(new AIMessage({ content: message.content }));
        break;
    }
  });
  return lcMessages;
}
