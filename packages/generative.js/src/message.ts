export type GenerativeMessage =
  | UserMessage
  | AssistantMessage
  | SystemMessage
  | ToolMessage;

export type MessageImageUrlContent = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};

export type MessageTextContent = {
  type: "text";
  text: string;
};

export type MessageContentItem = (
  | MessageTextContent
  | MessageImageUrlContent
)[];

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
  content: string | MessageContentItem;
};

export type AssistantMessage = {
  role: "assistant";
  content: string | null;
  tool_calls?: ToolCall[];
  function_call?: FunctionCall;
};

export type SystemMessage = {
  role: "system";
  content: string;
};

export type ToolMessage = {
  tool_call_id: string;
  role: "tool";
  content: string;
};

export type MessageDelta = {
  role?: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  function_call?: {
    name?: string;
    arguments?: string;
  };
  tool_calls?: {
    index: number;
    id?: string;
    function?: {
      name?: string;
      arguments?: string;
    };
    type?: "function";
  }[];
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

export function isMessage(message: unknown): message is GenerativeMessage {
  return (
    message != null &&
    typeof message === "object" &&
    "role" in message &&
    "content" in message
  );
}

export function isMessageDelta(delta: unknown): delta is MessageDelta {
  return (
    delta != null &&
    typeof delta === "object" &&
    ("role" in delta ||
      "content" in delta ||
      "tool_calls" in delta ||
      "function_call" in delta)
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

export function readTextContent(message: GenerativeMessage) {
  if (!message.content) {
    return "";
  }
  return typeof message.content === "string"
    ? message.content
    : message.content
        .filter(isTextContent)
        .map((content) => content.text)
        .join(" ");
}

export function concatDelta(previous: MessageDelta, delta: MessageDelta) {
  if (delta.content != null) {
    // Check for both null and undefined
    previous.content = previous.content
      ? previous.content + delta.content
      : delta.content;
  }

  // Apply function_call
  if (delta.function_call) {
    if (!previous.function_call) {
      previous.function_call = { name: "", arguments: "" };
    }
    previous.function_call.name += delta.function_call.name ?? "";
    previous.function_call.arguments += delta.function_call.arguments ?? "";
  }

  // Apply tool_calls
  if (delta.tool_calls && delta.tool_calls.length > 0) {
    if (!previous.tool_calls) {
      previous.tool_calls = [];
    }
    delta.tool_calls.forEach((toolCall) => {
      const existingToolCall =
        previous.tool_calls && previous.tool_calls[toolCall.index];
      if (!existingToolCall) {
        if (!previous.tool_calls) {
          previous.tool_calls = [];
        }
        previous.tool_calls[toolCall.index] = toolCall;
      } else {
        // Example of concatenation/merge logic for existing tool calls
        existingToolCall.id = existingToolCall.id + (toolCall.id ?? "");
        if (toolCall.function) {
          if (!existingToolCall.function) {
            existingToolCall.function = { name: "", arguments: "" };
          }
          existingToolCall.function.name += toolCall.function.name ?? "";
          existingToolCall.function.arguments +=
            toolCall.function.arguments ?? "";
        }
      }
    });
  }
}
