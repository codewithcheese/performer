import { PerformerElement, RenderOp } from "../index.js";
import { ConsolaOptions, createConsola, LogLevels, LogType } from "consola";

let options: Partial<ConsolaOptions & { fancy: boolean }> = {};

if (
  typeof globalThis.window !== "undefined" &&
  typeof globalThis.process === "undefined"
) {
  // Running in a browser environment (excluding jsdom)
  const { BrowserReporter } = await import("./consola-browser-reporter.js");
  options.reporters = [new BrowserReporter({})];
} else {
  // Running in a Node.js environment or jsdom
  const { NodeReporter } = await import("./consola-node-reporter.js");
  options.reporters = [new NodeReporter()];
}

export const logger = createConsola(options);

export function logOp(threadId: string, op: RenderOp) {
  const pairs: [string, any][] = [["op", op.type]];
  if (op.type === "CREATE") {
    pairs.push(["element", op.payload.element.id]);
    if (op.payload.parent) {
      pairs.push(["parent", nodeToStr(op.payload.element)]);
    }
    // if (typeof op.payload.element.props.children === "string") {
    //   pairs.push(["content", op.payload.element.props.children]);
    // }
  } else if (op.type === "RESUME") {
    pairs.push(
      ["node", op.payload.node.element.id],
      ["status", op.payload.node.status],
    );
    if (op.payload.node.element) {
      pairs.push(["parent", nodeToStr(op.payload.node.element)]);
    }
  }

  if (op.type === "PAUSED") {
    pairs.push(["id", op.payload.node.element.id]);
    logger.debug(toLogFmt(pairs));
  } else {
    logger.info(toLogFmt(pairs));
  }
}

export function nodeToStr(element: PerformerElement) {
  return getHierarchy(element).join("->");
}

function getHierarchy(element: PerformerElement) {
  const names: string[] = [];
  if (element.parent) names.push(...getHierarchy(element.parent));
  names.push(
    typeof element.type === "string" ? element.type : element.type.name,
  );
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

// export function logPaused(node: PerformerNode, pending: string) {
//   logger.info(
//     toLogFmt([
//       ["node", "paused"],
//       ["pending", pending],
//       ["node", nodeToStr(node)],
//       // ["threadId", node.threadId],
//     ]),
//   );
// }

export function getLogger(tag: string) {
  return logger.withTag(tag);
}

export function setLogLevel(level: LogType) {
  logger.level = LogLevels[level];
}
