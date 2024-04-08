import type { GenerativeElement } from "./element.js";
import { GenerativeMessage } from "./message.js";
import { nanoid } from "nanoid";
import { logger } from "./util/log.js";

export type NodeStatus =
  | "PENDING" // initial state
  | "LISTENING" // waiting for message input
  | "STREAMING" // message streaming
  | "RESOLVED" // message value resolved
  | "FINALIZED" // message acked by flow control
  | "AFTER_CHILDREN" // children rendered
  | "ERROR";

export type GenerativeNode = {
  id: string;
  state: {
    stream?: ReadableStream;
    message?: GenerativeMessage;
    childRenderCount: number;
  };
  element: GenerativeElement;
  status: NodeStatus;

  // linked tree
  parent: GenerativeNode | undefined;
  child: GenerativeNode | undefined;
  prevSibling: GenerativeNode | undefined;
  nextSibling: GenerativeNode | undefined;
};

export function setNodeResolved(node: GenerativeNode) {
  node.status = "RESOLVED";
  logger
    .withTag("Node")
    .debug(
      `id=${node.element.id} type=${node.element.typeName} status=${node.status}`,
    );
  node.element.onResolved(node);
}

export function setNodeStreaming(node: GenerativeNode) {
  node.status = "STREAMING";
  logger
    .withTag("Node")
    .debug(
      `id=${node.element.id} type=${node.element.typeName} status=${node.status}`,
    );
  node.element.onStreaming(node);
}

export function setNodeError(node: GenerativeNode, error: unknown) {
  node.status = "ERROR";
  logger
    .withTag("Node")
    .debug(
      `id=${node.element.id} type=${node.element.typeName} status=${node.status}`,
    );
  node.element.onError(error);
}

export function setNodeFinalized(node: GenerativeNode) {
  node.status = "FINALIZED";
  logger
    .withTag("Node")
    .debug(
      `id=${node.element.id} type=${node.element.typeName} status=${node.status}`,
    );
}

export function setNodeListening(node: GenerativeNode) {
  node.status = "LISTENING";
  logger
    .withTag("Node")
    .debug(
      `id=${node.element.id}  type=${node.element.typeName}status=${node.status}`,
    );
}
