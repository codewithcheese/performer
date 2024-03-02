import type { Component } from "./component.js";
import type { PerformerElement } from "./element.js";
import type { HookRecord } from "./hooks/index.js";
import { MessageDelta, PerformerMessage } from "./message.js";
import { hydrateHooks } from "./hydration.js";
import { nanoid } from "nanoid";
import { logNode } from "./util/log.js";
import { Fragment } from "./jsx/index.js";

export type PerformerNode = {
  worker: string;
  uid: string;
  type: Component<any> | PerformerMessage["role"] | "raw";
  _typeName: string;
  props: Record<string, any>;
  hooks: Record<string, unknown> & HookRecord;
  element: PerformerElement;
  childElements?: PerformerElement[] | undefined;
  status: "PENDING" | "PAUSED" | "RESOLVED";
  disposeView?: () => void | undefined;
  isHydrating: boolean;
  childRenderCount: number;

  // linked tree
  parent: PerformerNode | undefined;
  child: PerformerNode | undefined;
  prevSibling: PerformerNode | undefined;
  nextSibling: PerformerNode | undefined;
};

export type SerializedNode = {
  uid: string;
  type: string;
  hooks: Record<string, unknown> & HookRecord;
  children: SerializedNode[];
};

export function isRawNode(node: PerformerNode): node is RawNode {
  return node.type === "raw";
}

export interface RawNode extends PerformerNode {
  type: "raw";
  props: {
    stream?: ReadableStream<MessageDelta>;
    message?: PerformerMessage;
    onResolved?: (message: PerformerMessage) => Promise<void>;
  };
}

function validateElement(element: unknown, parent?: PerformerNode) {
  if (!(typeof element === "object")) {
    throw Error(
      `Invalid Child Type - The ${parent && logNode(parent)} component has child of type "${typeof element}" with value: "${element}".\nComponent children must be other components or elements, not primitive values.\nOnly message elements (system, user, assistant) elements support non-object children values.`,
    );
  }
}

export function createNode({
  worker,
  element,
  parent,
  prevSibling,
  child,
  serialized,
}: {
  worker: string;
  element: PerformerElement;
  parent?: PerformerNode;
  prevSibling?: PerformerNode;
  child?: PerformerNode;
  serialized?: SerializedNode;
}): PerformerNode {
  validateElement(element, parent);
  // React compat Fragment type is Symbol(react.fragment)
  const type = typeof element.type === "symbol" ? Fragment : element.type;
  return {
    _typeName: typeof type === "string" ? type : type.name,
    worker,
    uid: serialized ? serialized.uid : nanoid(),
    type,
    props: element.props,
    element,
    hooks: serialized ? hydrateHooks(serialized.hooks) : {},
    status: "PENDING",
    isHydrating: !!serialized,
    childRenderCount: 0,
    parent,
    child,
    prevSibling,
    nextSibling: undefined,
  };
}

export function getNearestParent(
  node: PerformerNode,
  predicate: (parent: PerformerNode) => boolean,
) {
  let parent: PerformerNode | undefined = node.parent;
  while (parent) {
    if (predicate(parent)) {
      return parent;
    }
    parent = parent.parent;
  }
  return parent;
}
