import {
  isAssistantMessage,
  nodeToMessage,
  PerformerDeltaEvent,
  PerformerErrorEvent,
  PerformerEvent,
  PerformerMessage,
  PerformerMessageEvent,
  PerformerNode,
  RenderOp,
} from "../index.js";
import { consola, createConsola } from "consola";
import { isImageContent, isTextContent } from "../message.js";

export const logger = createConsola({});

export function logMessageResolved(node: PerformerNode) {
  const message = nodeToMessage(node);
  const pairs: [string, any][] = [];
  pairs.push(["message", "resolved"]);
  pairs.push(["role", message.role]);
  if (typeof message.content === "string") {
    pairs.push(["content", message.content]);
  } else {
    if (typeof message.content === "string") {
      pairs.push(["content", message.content]);
    } else if (message.content) {
      for (const content of message.content) {
        if (isTextContent(content)) {
          pairs.push(["text", content.text]);
        } else if (isImageContent(content)) {
          pairs.push(["image_url", content.image_url.url]);
        }
      }
    }
  }
  if (isAssistantMessage(message) && message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      pairs.push(["tool_call.name", toolCall.function.name]);
      pairs.push(["tool_call.arguments", toolCall.function.arguments]);
    }
  }
  if (isAssistantMessage(message) && message.function_call) {
    pairs.push(["function_call.name", message.function_call.name]);
    pairs.push(["function_call.arguments", message.function_call.arguments]);
  }
  pairs.push(["node", nodeToStr(node)]);
  logger.info(toLogFmt(pairs));
}

export function logEvent(event: PerformerEvent) {
  const pairs: [string, any][] = [["event", event.type]];
  if ("threadId" in event) {
    pairs.push(["threadId", event.threadId]);
  }

  if (
    event instanceof PerformerMessageEvent ||
    event instanceof PerformerDeltaEvent
  ) {
    const message =
      "message" in event.detail ? event.detail.message : event.detail.delta;
    if (message.role) {
      pairs.push(["role", message.role]);
    }
    if (message.content) {
      if (typeof message.content === "string") {
        pairs.push(["content", message.content]);
      } else {
        for (const content of message.content) {
          if (isTextContent(content)) {
            pairs.push(["text", content.text]);
          } else if (isImageContent(content)) {
            pairs.push(["image_url", content.image_url.url]);
          }
        }
      }
    }
    if ("tool_calls" in message && message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall?.function?.name) {
          pairs.push(["tool_call.name", toolCall.function.name]);
        }
        if (toolCall?.function?.arguments) {
          pairs.push(["tool_call.arguments", toolCall.function.arguments]);
        }
      }
    }
  } else if (event instanceof PerformerErrorEvent) {
    pairs.push(["message", event.detail.message]);
  }

  if (event instanceof PerformerDeltaEvent) {
    logger.debug(toLogFmt(pairs));
  } else {
    logger.info(toLogFmt(pairs));
  }
}

export function logOp(threadId: string, op: RenderOp) {
  const pairs: [string, any][] = [["op", op.type]];
  if (op.type === "CREATE") {
    pairs.push([
      "element",
      op.payload.element.type instanceof Function
        ? op.payload.element.type.name
        : op.payload.element.type,
    ]);
    if (op.payload.parent) {
      pairs.push(["parent", nodeToStr(op.payload.parent)]);
    }
    if (typeof op.payload.element.props.children === "string") {
      pairs.push(["content", op.payload.element.props.children]);
    }
  } else if (op.type === "RESUME") {
    pairs.push(["node", op.payload.node._typeName]);
    if (op.payload.node.parent) {
      pairs.push(["parent", nodeToStr(op.payload.node.parent)]);
    }
  }

  pairs.push(["threadId", threadId]);
  if (op.type === "PAUSED") {
    logger.debug(toLogFmt(pairs));
  } else {
    logger.info(toLogFmt(pairs));
  }
}

export function nodeToStr(node: PerformerNode) {
  return getHierarchy(node).join("->");
}

function getHierarchy(node: PerformerNode) {
  const names: string[] = [];
  if (node.parent) names.push(...getHierarchy(node.parent));
  names.push(typeof node.type === "string" ? node.type : node.type.name);
  return names;
}

function escapeValue(value: any): string {
  if (typeof value === "string") {
    // Escape quotes and encapsulate the string in quotes if it contains spaces or quotes
    if (value.includes(" ") || value.includes('"')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return JSON.stringify(value);
}

export function toLogFmt(pairs: [string, any][]): string {
  return pairs.map(([key, value]) => `${key}=${escapeValue(value)}`).join(" ");
}

export function logPaused(node: PerformerNode, pending: string) {
  logger.info(
    toLogFmt([
      ["node", "paused"],
      ["pending", pending],
      ["node", nodeToStr(node)],
      ["threadId", node.threadId],
    ]),
  );
}
