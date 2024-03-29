import type { Component } from "./component.js";
import type { PerformerElement } from "./element.js";
import type { HookRecord } from "./hooks/index.js";
import { MessageDelta, PerformerMessage } from "./message.js";
import { hydrateHooks } from "./hydration.js";
import { nanoid } from "nanoid";
import { nodeToStr } from "./util/log.js";
import { Fragment } from "./jsx/index.js";
import { Action } from "./action.js";

export type PerformerNode = {
  // threadId: string;
  uid: string;
  action: Action /* | PerformerMessage["role"] | "raw";*/;
  // _typeName: string;
  props: Record<string, any>;
  state: {
    stream?: ReadableStream;
    messages?: PerformerMessage[];
    childRenderCount: number;
  };
  // hooks: Record<string, unknown> & HookRecord;
  element: PerformerElement;
  // childElements?: PerformerElement[] | undefined;
  status: "PENDING" | "PAUSED" | "FINALISING" | "RESOLVED" | "LISTENING";
  // disposeView?: () => void | undefined;
  isHydrating: boolean;

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

// export function isRawNode(node: PerformerNode): node is RawNode {
//   return node.type === "raw";
// }

// export interface RawNode extends PerformerNode {
//   type: "raw";
//   props: {
//     stream?: ReadableStream<MessageDelta>;
//     message?: PerformerMessage;
//     onResolved?: (message: PerformerMessage) => Promise<void>;
//   };
// }

// function validateElement(element: unknown, parent?: PerformerNode) {
//   if (!(typeof element === "object")) {
//     throw Error(
//       `Invalid Child Type - The ${parent && nodeToStr(parent)} component has child of type "${typeof element}" with value: "${element}".\nComponent children must be other components or elements, not primitive values.\nOnly message elements (system, user, assistant) elements support non-object children values.`,
//     );
//   }
// }

export function createNode({
  // threadId,
  element,
  parent,
  prevSibling,
  child,
  serialized,
}: {
  // threadId: string;
  element: PerformerElement;
  parent?: PerformerNode;
  prevSibling?: PerformerNode;
  child?: PerformerNode;
  serialized?: SerializedNode;
}): PerformerNode {
  // validateElement(element, parent);
  // React compat Fragment type is Symbol(react.fragment)
  // const type = typeof element.type === "symbol" ? Fragment : element.type;
  return {
    // _typeName: typeof type === "string" ? type : type.name,
    // threadId,
    uid: serialized ? serialized.uid : nanoid(),
    action: element.action,
    props: element.props,
    element,
    state: {
      childRenderCount: 0,
    },
    // hooks: serialized ? hydrateHooks(serialized.hooks) : {},
    status: "PENDING",
    isHydrating: !!serialized,
    parent,
    child,
    prevSibling,
    nextSibling: undefined,
  };
}

// export function getNearestParent(
//   node: PerformerNode,
//   predicate: (parent: PerformerNode) => boolean,
// ) {
//   let parent: PerformerNode | undefined = node.parent;
//   while (parent) {
//     if (predicate(parent)) {
//       return parent;
//     }
//     parent = parent.parent;
//   }
//   return parent;
// }
