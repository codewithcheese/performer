import { Action } from "./action.js";
import { PerformerNode } from "./node.js";

export type PerformerElement = {
  id: string;
  action: Action;
  props: { afterChildren?: () => void };

  notify?: () => void;

  parent?: PerformerElement;
  child?: PerformerElement;
  sibling?: PerformerElement;
  node?: PerformerNode;
};

export function Fragment(props: any) {
  return props.children;
}
