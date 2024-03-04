import {
  PerformerDeltaEvent,
  PerformerErrorEvent,
  PerformerEvent,
  PerformerMessage,
  PerformerMessageEvent,
  PerformerNode,
  RenderOp,
} from "../index.js";
import * as log from "loglevel";
import { isImageContent, isTextContent } from "../message.js";

export function logMessageResolved(
  node: PerformerNode,
  message: PerformerMessage,
) {
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
          pairs.push(["text", message.content]);
        } else if (isImageContent(content)) {
          pairs.push(["image_url", content.image_url.url]);
        }
      }
    }
  }
  pairs.push(["node", nodeToStr(node)]);
  log.debug(toLogFmt(pairs));
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
            pairs.push(["text", message.content]);
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
    log.trace(toLogFmt(pairs));
  } else {
    log.debug(toLogFmt(pairs));
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
      pairs.push(["parent", getHierarchy(op.payload.parent).join("->")]);
    }
    if (typeof op.payload.element.props.children === "string") {
      pairs.push(["content", op.payload.element.props.children]);
    }
  } else if (op.type === "UPDATE") {
    pairs.push(["node", nodeToStr(op.payload.node)]);
    if (op.payload.node.parent) {
      pairs.push(["parent", getHierarchy(op.payload.node).join("->")]);
    }
  }

  pairs.push(["threadId", threadId]);
  log.debug(toLogFmt(pairs));
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
