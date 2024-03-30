import { ActionType } from "./action.js";
import { PerformerNode } from "./node.js";

export type PerformerElement = {
  id: string;
  type: ActionType | "LISTENER";
  props: { afterChildren?: () => void };
  onFinalize: () => void;
  onStreaming: () => void;
  // links
  parent?: PerformerElement;
  child?: PerformerElement;
  sibling?: PerformerElement;
  node?: PerformerNode;
};

export function Fragment(props: any) {
  return props.children;
}
