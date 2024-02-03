import { jsx } from "./jsx/index.js";

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

export function messagesToElements(messages: PerformerMessage[]) {
  return messages.map((message) => {
    return jsx(message.role, message);
  });
}
