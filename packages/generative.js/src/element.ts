import { ActionType } from "./action.js";
import { GenerativeNode } from "./node.js";
import { GenerativeMessage } from "./message.js";

export type GenerativeElement = {
  id: string;
  type: ActionType | "LISTENER" | GenerativeMessage;
  typeName: string;
  props: { afterChildren?: () => void };
  onResolved: (node: GenerativeNode) => void;
  onStreaming: (node: GenerativeNode) => void;
  onError: (error: unknown) => void;
  // links
  parent?: GenerativeElement;
  child?: GenerativeElement;
  sibling?: GenerativeElement;
  node?: GenerativeNode;
};
