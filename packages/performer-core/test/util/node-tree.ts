import { PerformerNode } from "../../src/index.js";

type PerformerNodeTree = Array<PerformerNodeTree> & PerformerNode;

export function transformerToNodeTree(node: PerformerNode): PerformerNodeTree {
  const newNode: PerformerNodeTree = Object.assign([], node);

  let currentChild = node.child;
  let index = 0;
  while (currentChild) {
    newNode[index] = transformerToNodeTree(currentChild);
    currentChild = currentChild.nextSibling;
    index += 1;
  }

  return newNode;
}
