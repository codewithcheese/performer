import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  AIMessageChunk,
  SystemMessage as LCSystemMessage,
} from "langchain/schema";

export type PerformerMessage =
  | UserMessage
  | AssistantMessage
  | SystemMessage
  | ToolMessage;

export type MessageImageUrlContent = {
  type: "image_url";
  image_url: string;
};

export type MessageTextContent = {
  type: "text";
  text: string;
};

export type MessageContent = (MessageTextContent | MessageImageUrlContent)[];

export type ToolCall = {
  id: string;
  type: "function"; // Only function is supported by OpenAI
  function: {
    name: string;
    arguments: string;
  };
};

export type FunctionCall = {
  name: string;
  arguments: string;
};

export type UserMessage = {
  role: "user";
  content: MessageContent;
};

export type AssistantMessage = {
  role: "assistant";
  content: MessageContent;
  tool_calls?: ToolCall[];
  function_call?: FunctionCall;
};

export type SystemMessage = {
  role: "system";
  content: MessageContent;
};

export type ToolMessage = {
  id: string;
  role: "tool";
  content: string;
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

export function isTextContent(content: unknown): content is MessageTextContent {
  return (
    !!content &&
    typeof content === "object" &&
    "type" in content &&
    content.type === "text" &&
    "text" in content
  );
}

export function isImageContent(
  content: unknown,
): content is MessageImageUrlContent {
  return (
    !!content &&
    typeof content === "object" &&
    "type" in content &&
    content.type === "image_url" &&
    "image_url" in content
  );
}

export function isMessage(message: unknown): message is PerformerMessage {
  return (
    message != null &&
    typeof message === "object" &&
    "role" in message &&
    "content" in message
  );
}

export function isToolMessage(message: unknown): message is AssistantMessage {
  return isMessage(message) && message.role === "tool";
}

export function isSystemMessage(message: unknown): message is AssistantMessage {
  return isMessage(message) && message.role === "system";
}

export function isUserMessage(message: unknown): message is AssistantMessage {
  return isMessage(message) && message.role === "user";
}

export function isAssistantMessage(
  message: unknown,
): message is AssistantMessage {
  return isMessage(message) && message.role === "assistant";
}

export function readTextContent(message: PerformerMessage) {
  return typeof message.content === "string"
    ? message.content
    : message.content
        .filter(isTextContent)
        .map((content) => content.text)
        .join(" ");
}
