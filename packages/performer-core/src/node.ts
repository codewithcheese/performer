import type { PerformerElement } from "./element.js";
import { PerformerMessage } from "./message.js";
import { nanoid } from "nanoid";

export type NodeStatus =
  | "PENDING" // initial state
  | "PAUSED" // fixme: remove
  | "FINALIZE" // ready for ack from React before becoming resolved
  | "RESOLVED" // done
  | "LISTENING" // type LISTENER, transitions to FINALIZE once input queue is assigned to messages
  | "STREAMING"
  | "ERROR";

export type PerformerNode = {
  // threadId: string;
  uid: string;
  // _typeName: string;
  // props: Record<string, any>;
  state: {
    stream?: ReadableStream;
    message?: PerformerMessage;
    childRenderCount: number;
  };
  // hooks: Record<string, unknown> & HookRecord;
  element: PerformerElement;
  // childElements?: PerformerElement[] | undefined;
  status: NodeStatus;
  // disposeView?: () => void | undefined;
  isHydrating: boolean;

  // linked tree
  parent: PerformerNode | undefined;
  child: PerformerNode | undefined;
  prevSibling: PerformerNode | undefined;
  nextSibling: PerformerNode | undefined;
};

export function setNodeFinalize(node: PerformerNode) {
  node.status = "FINALIZE";
  node.element.onFinalize();
}

export function setNodeStreaming(node: PerformerNode) {
  node.status = "STREAMING";
  node.element.onStreaming();
}

export function setNodeError(node: PerformerNode, error: unknown) {
  node.status = "ERROR";
  node.element.onError(error);
}

// export type SerializedNode = {
//   uid: string;
//   type: string;
//   hooks: Record<string, unknown> & HookRecord;
//   children: SerializedNode[];
// };

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
  // serialized,
}: {
  // threadId: string;
  element: PerformerElement;
  parent?: PerformerNode;
  prevSibling?: PerformerNode;
  child?: PerformerNode;
  // serialized?: SerializedNode;
}): PerformerNode {
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
    isHydrating: false,
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
