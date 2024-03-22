import { PerformerNode, SerializedNode } from "./node.js";
import type { Performer } from "./performer.js";
import type { PerformerElement } from "./element.js";
import { performOp } from "./render.js";
import { Signal } from "@preact/signals-core";
import { walk } from "./util/walk.js";

export type HydrateProps = {
  performer: Performer;
  threadId?: string;
  element: PerformerElement;
  serialized: SerializedNode;
  parent?: PerformerNode;
  prevSibling?: PerformerNode;
};

export async function hydrate({
  performer,
  threadId = "root",
  element,
  serialized,
  parent,
  prevSibling,
}: HydrateProps): Promise<PerformerNode> {
  const node = await performOp(
    performer,
    { type: "CREATE", payload: { threadId, element, parent, prevSibling } },
    serialized,
  );

  let index = 0;
  let childThreadId = node.hooks.thread?.id ? node.hooks.thread.id : threadId;
  let childPrevSibling: PerformerNode | undefined = undefined;
  const childElements = node.childElements || [];
  // todo validate length of child elements matches serialized children
  while (index < childElements.length) {
    const childElement = childElements[index];
    const childSerialized = serialized.children[index];
    const childNode = await hydrate({
      performer,
      threadId: childThreadId,
      element: childElement,
      serialized: childSerialized,
      parent: node,
      prevSibling: childPrevSibling,
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
      performer.setFinished();
    }
  }

  return node;
}

export function serialize(node: PerformerNode): SerializedNode {
  const serializedNode: SerializedNode = {
    uid: node.uid,
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
  let childNode = node.child;
  while (childNode) {
    serializedNode.children.push(serialize(childNode));
    childNode = childNode.nextSibling;
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
