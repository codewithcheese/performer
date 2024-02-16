import {
  nodeToMessage,
  PerformerDeltaEvent,
  PerformerErrorEvent,
  PerformerEvent,
  PerformerMessageEvent,
  PerformerNode,
  readTextContent,
} from "../index.js";
import * as log from "loglevel";
import { isImageContent, isTextContent } from "../message.js";

export type LogConfig = {
  showDeltaEvents: boolean;
  showResolveMessages: boolean;
};

function getNestedProperty(object: any, propertyPath: string): any {
  return propertyPath
    .split(".")
    .reduce((o, key) => (o && o[key] !== "undefined" ? o[key] : null), object);
}

export function logEvent(event: PerformerEvent, config: LogConfig) {
  if (!config.showDeltaEvents && "delta" in event.detail) return;

  let msg = `Event ${event.type}`;
  if (
    event instanceof PerformerMessageEvent ||
    event instanceof PerformerDeltaEvent
  ) {
    const message =
      "message" in event.detail ? event.detail.message : event.detail.delta;
    if (message.role) {
      msg += ` ${message.role} `;
    } else {
      msg += " ";
    }
    if (message.content) {
      msg +=
        typeof message.content === "string"
          ? message.content
          : message.content
              .map((content) => {
                if (isTextContent(content) && content.text !== "") {
                  return `text:${content.text}`;
                } else if (isImageContent(content)) {
                  return `image:${content.image_url}`;
                } else {
                  return "";
                }
              })
              .join(", ");
    }
    if ("tool_calls" in message && message.tool_calls) {
      msg += ` ${message.tool_calls
        .map((toolCall) => {
          if (toolCall.function) {
            return `${toolCall.function.name ? toolCall.function.name + ":" : ""}${
              toolCall.function.arguments
            }`;
          } else {
            return "";
          }
        })
        .join(", ")}`;
    }
  } else if (event instanceof PerformerErrorEvent) {
    msg += ` ${event.detail.message}`;
  }

  log.debug(msg);
}

export function logObject<T>(object: T, properties: string[]) {
  const loggable = properties
    .map((key) => `${String(key)}=${getNestedProperty(object, String(key))}`)
    .join(" ");
  return loggable.trim();
}

export function logNode(node: PerformerNode) {
  return getHierarchy(node).join("->");
}

export function logContent(node: PerformerNode, length: number = 20) {
  if (typeof node.type === "string" && node.type !== "raw") {
    let content = readTextContent(nodeToMessage(node));
    if (content.length > length) {
      content = content.substring(0, length) + "...";
    }
    return `"${content}"`;
  } else {
    return "";
  }
}

function getHierarchy(node: PerformerNode) {
  const names: string[] = [];
  if (node.parent) names.push(...getHierarchy(node.parent));
  names.push(typeof node.type === "string" ? node.type : node.type.name);
  return names;
}

export function logResolveMessages(
  node: PerformerNode | undefined,
  config: Partial<LogConfig> = {},
) {
  if (!config.showResolveMessages) return;
  if (node) {
    log.debug(`Resolving messages`, logNode(node));
  }
}
