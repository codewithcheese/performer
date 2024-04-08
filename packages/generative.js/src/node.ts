import type { GenerativeElement } from "./element.js";
import { GenerativeMessage } from "./message.js";
import { nanoid } from "nanoid";
import { logger } from "./util/log.js";

export type NodeStatus =
  | "PENDING" // initial state
  | "PAUSED" // waiting for data
  | "LISTENING" // waiting for message input
  | "STREAMING" // message streaming
  | "RESOLVED" // message value resolved
  | "FINALIZED" // message acked by flow control
  | "ERROR";

export type GenerativeNode = {
  uid: string;
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

export function createNode({
  // threadId,
  element,
  parent,
  prevSibling,
  child,
  // serialized,
}: {
  // threadId: string;
  element: GenerativeElement;
  parent?: GenerativeNode;
  prevSibling?: GenerativeNode;
  child?: GenerativeNode;
  // serialized?: SerializedNode;
}): GenerativeNode {
  // validateElement(element, parent);
  // React compat Fragment type is Symbol(react.fragment)
  // const type = typeof element.type === "symbol" ? Fragment : element.type;
  return {
    // _typeName: typeof type === "string" ? type : type.name,
    // threadId,
    uid: nanoid(),
    // props: element.props,
    element,
    state: {
      childRenderCount: 0,
    },
    // hooks: serialized ? hydrateHooks(serialized.hooks) : {},
    status: "PENDING",
    parent,
    child,
    prevSibling,
    nextSibling: undefined,
  };
}
