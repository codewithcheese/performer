import {
  PerformerMessageEvent,
  PerformerDeltaEvent,
  PerformerErrorEvent,
  isAssistantMessage,
  PerformerEvent,
  PerformerNode,
} from "../index.js";
import log from "loglevel";
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
    const message = event.detail.message;
    msg += ` ${message.role} `;
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
    if (isAssistantMessage(message) && message.tool_calls) {
      msg += ` ${message.tool_calls
        .map(
          (toolCall) =>
            `${toolCall.function.name ? toolCall.function.name + ":" : ""}${
              toolCall.function.arguments
            }`,
        )
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
