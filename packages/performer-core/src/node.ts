import type { Component } from "./component.js";
import type { PerformerElement } from "./element.js";
import type { HookRecord } from "./hooks/index.js";
import { PerformerMessage } from "./message.js";
import { hydrateHooks } from "./hydration.js";
import { nanoid } from "nanoid";

export type PerformerNode = {
  uid: string;
  type: Component<any> | PerformerMessage["role"];
  _typeName: string;
  props: Record<string, any>;
  hooks: Record<string, unknown> & HookRecord;
  element: PerformerElement;
  childElements?: PerformerElement[] | undefined;
  viewResolved: boolean;
  disposeView?: () => void | undefined;
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

export function createNode({
  element,
  parent,
  prevSibling,
  child,
  serialized,
}: {
  element: PerformerElement;
  parent?: PerformerNode;
  prevSibling?: PerformerNode;
  child?: PerformerNode;
  serialized?: SerializedNode;
}): PerformerNode {
  return {
    uid: serialized ? serialized.uid : nanoid(),
    type: element.type,
    _typeName:
      typeof element.type === "string" ? element.type : element.type.name,
    props: element.props,
    element,
    hooks: serialized ? hydrateHooks(serialized.hooks) : {},
    viewResolved: false,
    isHydrating: !!serialized,
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
