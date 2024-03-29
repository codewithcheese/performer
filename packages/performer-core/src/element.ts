import { Action } from "./action.js";
import { PerformerNode } from "./node.js";

export type PerformerElement = {
  id: string;
  type: Action | "LISTENER" | "NOOP";
  props: { afterChildren?: () => void };
  notify?: () => void;
  // links
  parent?: PerformerElement;
  child?: PerformerElement;
  sibling?: PerformerElement;
  node?: PerformerNode;
};

export function Fragment(props: any) {
  return props.children;
}
