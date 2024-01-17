import type { Component } from "./component.js";
import type { PerformerElement } from "./element.js";
import type { HookRecord } from "./hooks/index.js";
import { PerformerMessage } from "./message.js";

export type PerformerNode = {
  type: Component<any> | PerformerMessage["role"];
  _typeName: string;
  props: Record<string, any>;
  hooks: Record<string, unknown> & HookRecord;
  element: PerformerElement;
  childElements?: PerformerElement[];
  disposeView?: () => void;
  dependsOn: Set<string>;

  // linked tree
  parent?: PerformerNode;
  child?: PerformerNode;
  prevSibling?: PerformerNode;
  nextSibling?: PerformerNode;
};

export function createNode({
  element,
  parent,
  prevSibling,
  child,
}: {
  element: PerformerElement;
  parent?: PerformerNode;
  prevSibling?: PerformerNode;
  child?: PerformerNode;
}): PerformerNode {
  const node: PerformerNode = {
    type: element.type,
    _typeName:
      typeof element.type === "string" ? element.type : element.type.name,
    props: element.props,
    element,
    hooks: {},
    dependsOn: new Set(),
    prevSibling,
    child,
  };
  if (parent) {
    node.parent = parent;
  }
  return node;
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
