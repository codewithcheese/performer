import { PerformerNode, SerializedNode } from "./node.js";
import type { Performer } from "./performer.js";
import type { PerformerElement } from "./element.js";
import { performOp } from "./render.js";
import { Signal } from "@preact/signals-core";
import { walk } from "./util/walk.js";
import { nodeToStr } from "./util/log.js";

export type HydrateProps = {
  performer: Performer;
  threadId?: string;
  element: PerformerElement;
  serialized: SerializedNode;
  parent?: PerformerNode;
  prevSibling?: PerformerNode;
  elementMap: Record<string, PerformerElement>;
};

export async function hydrate({
  performer,
  threadId = "root",
  element,
  serialized,
  parent,
  prevSibling,
  elementMap,
}: HydrateProps): Promise<PerformerNode> {
  const node = await performOp(
    performer,
    { type: "CREATE", payload: { threadId, element, parent, prevSibling } },
    serialized,
  );

  let index = 0;
  // not incremented when child serialized is a transplant
  let childElementIndex = 0;
  let childThreadId = node.hooks.thread?.id ? node.hooks.thread.id : threadId;
  let childPrevSibling: PerformerNode | undefined = undefined;
  const childElements = node.childElements || [];
  // todo validate length of child elements matches serialized children
  while (index < Math.max(childElements.length, serialized.children.length)) {
    const childSerialized = serialized.children[index];
    let childElement;
    if (childSerialized && childSerialized.transplant) {
      if (!elementMap[childSerialized.type]) {
        throw new Error(
          `Failed to hydrate. Transplanted node "${childSerialized.type}" not found in element map.`,
        );
      }
      childElement = elementMap[childSerialized.type];
      childElement.props = childSerialized.props || {};
    } else {
      childElement = childElements[childElementIndex];
      childElementIndex += 1;
    }
    const childNode = await hydrate({
      performer,
      threadId: childThreadId,
      element: childSerialized.transplant
        ? elementMap[childSerialized.type]
        : childElement,
      serialized: childSerialized,
      parent: node,
      prevSibling: childPrevSibling,
      elementMap,
    });

    if (index === 0) {
      node.child = childNode;
    }

    if (childPrevSibling) {
      childPrevSibling.nextSibling = childNode;
      childNode.prevSibling = childPrevSibling;
    }
    childNode.parent = node;
    childPrevSibling = childNode;
    index += 1;
  }

  node.isHydrating = false;

  if (!parent) {
    // evaluate if finished
    let hasFinished = true;
    walk(node, () => (hasFinished = node.status === "RESOLVED"));
    if (hasFinished) {
      performer.setState("settled");
    }
  }

  return node;
}

export function serialize(node: PerformerNode): SerializedNode {
  const serializedNode: SerializedNode = {
    uid: node.uid,
    transplant: undefined,
    type: typeof node.type === "string" ? node.type : node.type.name,
    hooks: {},
    children: [],
  };
  // serialize hooks
  // todo serialize any signal to object that self identifies as signal instead of key based serialization
  // e.g. { type: 'signal', value }
  for (const [key, value] of Object.entries(node.hooks)) {
    if (key.startsWith("state-") || key.startsWith("context-")) {
      if (value instanceof Signal) {
        serializedNode.hooks[key] = value.peek();
      } else {
        throw Error(
          `Failed to serialize hook #${key}. Expected to Signal found ${value}`,
        );
      }
    } else if (!(value instanceof Function)) {
      serializedNode.hooks[key] = value;
    }
  }
  if (node.transplant) {
    serializedNode.transplant = true;
    serializedNode.props = node.props;
  }
  let childNode = node.child;
  while (childNode) {
    serializedNode.children.push(serialize(childNode));
    childNode = childNode.nextSibling;
  }
  if (__DEV__) {
    // try stringify
    // todo: try stringify each hook and prop
    try {
      JSON.stringify(serializedNode);
    } catch (e) {
      if (e instanceof Error && e.stack && e.stack.startsWith("TypeError")) {
        throw new __DEV__SerializationError(
          `Failed to serialize ${nodeToStr(node)}`,
          e,
        );
      }
      throw e;
    }
  }
  return serializedNode;
}

export function hydrateHooks(serializedHooks: Record<string, any>) {
  const hooks: Record<string, any> = {};
  for (const [key, value] of Object.entries(serializedHooks)) {
    if (key.startsWith("state-") || key.startsWith("context-")) {
      hooks[key] = new Signal(value);
    } else {
      hooks[key] = value;
    }
  }
  return hooks;
}

class __DEV__SerializationError extends Error {
  constructor(
    message: string,
    public originalError: Error,
  ) {
    super(message);
    this.name = "__DEV__SerializationError";
    this.stack = originalError.stack;
  }
}
